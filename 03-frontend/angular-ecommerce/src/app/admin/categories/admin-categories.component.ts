import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ProductCategory } from '../../common/product-category';
import { ProductService } from '../../services/product.service';
import { AdminService, apiErrorMessage } from '../admin.service';
import { ConfirmService } from '../../shared/confirm.service';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-admin-categories',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-categories.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AdminCategoriesComponent {
  private fb = inject(FormBuilder);
  private admin = inject(AdminService);
  private productService = inject(ProductService);
  private confirm = inject(ConfirmService);
  private toast = inject(ToastService);

  categories: ProductCategory[] = [];
  form = this.fb.nonNullable.group({
    categoryName: ['', [Validators.required, Validators.maxLength(40)]],
  });
  saving = false;
  error = '';
  created = '';

  // product count per category id
  counts: Record<number, number> = {};

  deletingId = 0;

  constructor() {
    this.productService.getProductCategories().subscribe((c) => {
      this.categories = c;
      this.loadCounts();
    });
  }

  loadCounts() {
    this.admin.getCategories().subscribe({
      next: (stats) => (this.counts = Object.fromEntries(stats.map((s) => [s.id, s.productCount]))),
    });
  }

  countLabel(category: ProductCategory): string {
    const count = this.counts[category.id];
    return count === undefined ? '' : `${count} ${count === 1 ? 'product' : 'products'}`;
  }

  async deleteCategory(category: ProductCategory) {
    const name = category.categoryName.toLowerCase();
    const count = this.counts[category.id] ?? 0;
    const confirmed = await this.confirm.ask({
      title: `Delete ${name}?`,
      message:
        count > 0
          ? `The tab and its ${this.countLabel(category)} will be deleted. This cannot be undone.`
          : 'The empty tab will be removed from the shop.',
      confirmText: count > 0 ? `Delete with ${this.countLabel(category)}` : 'Delete category',
      tone: 'danger',
    });
    if (!confirmed) {
      return;
    }
    this.deletingId = category.id;
    this.admin.deleteCategory(category.id).subscribe({
      next: () => {
        this.deletingId = 0;
        this.toast.success('Category deleted', name);
        // the header tabs and this list drop the category
        this.productService.reloadCategories();
      },
      // the error toast comes from the global error interceptor
      error: () => (this.deletingId = 0),
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.error = '';
    this.created = '';

    this.admin.createCategory(this.form.getRawValue().categoryName.trim()).subscribe({
      next: (category) => {
        this.saving = false;
        this.created = category.categoryName;
        this.form.reset();
        // the header tabs and this list pick up the new category
        this.productService.reloadCategories();
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        this.error = apiErrorMessage(err);
      },
    });
  }
}
