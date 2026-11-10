import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Product } from '../../common/product';
import { ProductCategory } from '../../common/product-category';
import { ProductService } from '../../services/product.service';
import { AdminService, apiErrorMessage } from '../admin.service';
import { ConfirmService } from '../../shared/confirm.service';
import { ToastService } from '../../shared/toast.service';

const PLACEHOLDER_IMAGE = 'assets/images/products/placeholder.png';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

@Component({
  selector: 'app-admin-products',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe],
  templateUrl: './admin-products.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AdminProductsComponent {
  private fb = inject(FormBuilder);
  private admin = inject(AdminService);
  private productService = inject(ProductService);
  private confirm = inject(ConfirmService);
  private toast = inject(ToastService);

  categories: ProductCategory[] = [];
  products: Product[] = [];
  totalInCategory = 0;

  form = this.fb.nonNullable.group({
    categoryId: [0, Validators.min(1)],
    name: ['', Validators.required],
    sku: ['', Validators.required],
    unitPrice: [19.99, [Validators.required, Validators.min(0.01)]],
    unitsInStock: [100, [Validators.required, Validators.min(0)]],
    imageUrl: [PLACEHOLDER_IMAGE],
    description: [''],
    salePercent: [0, [Validators.min(0), Validators.max(90)]],
    memberDiscountEnabled: [true],
  });

  // per-row edits of the discount settings, keyed by product id
  drafts: Record<string, { salePercent: number; memberDiscountEnabled: boolean }> = {};
  savingId = '';

  deletingId = '';

  saving = false;
  error = '';
  created: { id: number; name: string } | null = null;

  constructor() {
    this.productService.getProductCategories().subscribe((categories) => {
      this.categories = categories;
      if (!this.form.controls.categoryId.value && categories.length) {
        this.form.controls.categoryId.setValue(categories[0].id);
        this.loadProducts();
      }
    });
  }

  uploading = false;
  uploadedFileName = '';

  /** Uploads the chosen image right away and puts its URL into the form. */
  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // the same file can be chosen again
    if (!file) {
      return;
    }
    if (!IMAGE_TYPES.includes(file.type)) {
      this.toast.error('Cannot upload', 'Choose a PNG, JPG, WebP or GIF image.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      this.toast.error('Cannot upload', 'The image must be smaller than 5 MB.');
      return;
    }
    this.uploading = true;
    this.admin.uploadImage(file).subscribe({
      next: ({ url }) => {
        this.uploading = false;
        this.uploadedFileName = file.name;
        this.form.controls.imageUrl.setValue(url);
      },
      // the error toast comes from the global error interceptor
      error: () => (this.uploading = false),
    });
  }

  removeImage() {
    this.uploadedFileName = '';
    this.form.controls.imageUrl.setValue(PLACEHOLDER_IMAGE);
  }

  get previewImage(): string {
    return this.form.controls.imageUrl.value.trim() || PLACEHOLDER_IMAGE;
  }

  loadProducts() {
    const categoryId = Number(this.form.controls.categoryId.value);
    if (!categoryId) {
      return;
    }
    this.productService.getProductListPaginate(0, 100, categoryId).subscribe((data) => {
      this.products = data._embedded?.products ?? [];
      this.totalInCategory = data.page.totalElements;
      this.drafts = Object.fromEntries(
        this.products.map((p) => [
          p.id,
          { salePercent: p.salePercent ?? 0, memberDiscountEnabled: p.memberDiscountEnabled !== false },
        ])
      );
    });
  }

  isDirty(product: Product): boolean {
    const draft = this.drafts[product.id];
    return (
      !!draft &&
      (draft.salePercent !== (product.salePercent ?? 0) ||
        draft.memberDiscountEnabled !== (product.memberDiscountEnabled !== false))
    );
  }

  saveDiscounts(product: Product) {
    const draft = this.drafts[product.id];
    if (!Number.isFinite(draft.salePercent) || draft.salePercent < 0 || draft.salePercent > 90) {
      this.toast.error('Cannot save', 'Sale must be between 0 and 90 %.');
      return;
    }
    this.savingId = product.id;
    this.admin
      .setProductDiscounts(Number(product.id), {
        salePercent: Math.round(draft.salePercent),
        memberDiscountEnabled: draft.memberDiscountEnabled,
      })
      .subscribe({
        next: () => {
          this.savingId = '';
          product.salePercent = Math.round(draft.salePercent);
          product.memberDiscountEnabled = draft.memberDiscountEnabled;
          this.confirm.inform({
            title: 'Discounts saved',
            message: `Sale ${product.salePercent}% · member discounts ${product.memberDiscountEnabled === false ? 'off' : 'allowed'} for:`,
            items: [`${product.name} (${product.sku})`],
          });
        },
        // the error toast comes from the global error interceptor
        error: () => (this.savingId = ''),
      });
  }

  async deleteProduct(product: Product) {
    const confirmed = await this.confirm.ask({
      title: `Delete ${product.name}?`,
      message: 'The product is removed from the shop and from members\' discounts. This cannot be undone.',
      confirmText: 'Delete product',
      tone: 'danger',
    });
    if (!confirmed) {
      return;
    }
    this.deletingId = product.id;
    this.admin.deleteProduct(Number(product.id)).subscribe({
      next: () => {
        this.deletingId = '';
        this.products = this.products.filter((p) => p.id !== product.id);
        this.totalInCategory = Math.max(0, this.totalInCategory - 1);
        delete this.drafts[product.id];
        this.productService.reloadCounts();
        this.toast.success('Product deleted', product.name);
      },
      // the error toast comes from the global error interceptor
      error: () => (this.deletingId = ''),
    });
  }

  showError(name: 'name' | 'sku' | 'unitPrice' | 'unitsInStock'): boolean {
    const control = this.form.controls[name];
    return control.invalid && control.touched;
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.error = '';
    this.created = null;

    const value = this.form.getRawValue();
    this.admin
      .createProduct({
        ...value,
        categoryId: Number(value.categoryId),
        imageUrl: value.imageUrl.trim(),
        salePercent: Number(value.salePercent) || 0,
      })
      .subscribe({
        next: (product) => {
          this.saving = false;
          this.created = product;
          // keep the category so several products can be added in a row
          this.uploadedFileName = '';
          this.form.reset({
            ...this.form.getRawValue(),
            name: '',
            sku: '',
            description: '',
            imageUrl: PLACEHOLDER_IMAGE,
            salePercent: 0,
            memberDiscountEnabled: true,
          });
          this.loadProducts();
          this.productService.reloadCounts();
        },
        error: (err: HttpErrorResponse) => {
          this.saving = false;
          this.error = apiErrorMessage(err);
        },
      });
  }
}
