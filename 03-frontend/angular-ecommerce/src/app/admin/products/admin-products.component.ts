import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Product } from '../../common/product';
import { ProductCategory } from '../../common/product-category';
import { ProductService } from '../../services/product.service';
import { AdminService, apiErrorMessage } from '../admin.service';

const PLACEHOLDER_IMAGE = 'assets/images/products/placeholder.png';

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
  });

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
      .createProduct({ ...value, categoryId: Number(value.categoryId), imageUrl: value.imageUrl.trim() })
      .subscribe({
        next: (product) => {
          this.saving = false;
          this.created = product;
          // keep the category so several products can be added in a row
          this.form.reset({ ...this.form.getRawValue(), name: '', sku: '', description: '', imageUrl: PLACEHOLDER_IMAGE });
          this.loadProducts();
        },
        error: (err: HttpErrorResponse) => {
          this.saving = false;
          this.error = apiErrorMessage(err);
        },
      });
  }
}
