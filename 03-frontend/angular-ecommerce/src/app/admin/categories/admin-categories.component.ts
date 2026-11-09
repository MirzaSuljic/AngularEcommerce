import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ProductCategory } from '../../common/product-category';
import { ProductService } from '../../services/product.service';
import { AdminService, apiErrorMessage } from '../admin.service';

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

  categories: ProductCategory[] = [];
  form = this.fb.nonNullable.group({
    categoryName: ['', [Validators.required, Validators.maxLength(40)]],
  });
  saving = false;
  error = '';
  created = '';

  constructor() {
    this.productService.getProductCategories().subscribe((c) => (this.categories = c));
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
