import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Product } from '../../common/product';
import { ProductService } from '../../services/product.service';
import { AdminService, Member, apiErrorMessage, roleLabel } from '../admin.service';

@Component({
  selector: 'app-admin-members',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-members.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AdminMembersComponent {
  private fb = inject(FormBuilder);
  private admin = inject(AdminService);
  private productService = inject(ProductService);

  readonly roleLabel = roleLabel;

  members: Member[] = [];
  roles: string[] = [];
  selectedRoles = new Set<string>(['ROLE_USER']);
  loadError = '';

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    username: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._-]{3,30}$/)]],
    password: ['', [Validators.required, Validators.minLength(4)]],
    discountPercent: [10, [Validators.min(0), Validators.max(90)]],
  });

  // the member whose discount is open in the editor
  editing: Member | null = null;
  editPercent = 0;
  editScope: 'all' | 'selected' = 'all';
  editProductIds = new Set<number>();
  productSearch = '';
  showSelectedOnly = false;
  allProducts: Product[] = [];
  savingDiscount = false;
  discountMessage = '';

  saving = false;
  error = '';
  createdUsername = '';

  constructor() {
    this.loadMembers();
    this.admin.getRoles().subscribe({ next: (roles) => (this.roles = roles) });
  }

  loadMembers() {
    this.admin.getMembers().subscribe({
      next: (members) => {
        this.members = members;
        this.loadError = '';
      },
      error: (err: HttpErrorResponse) => (this.loadError = apiErrorMessage(err)),
    });
  }

  /** New members with an admin role cannot get a discount. */
  get selectedStaffRole(): boolean {
    return this.selectedRoles.has('ROLE_ADMIN') || this.selectedRoles.has('ROLE_SUPER_ADMIN');
  }

  discountSummary(member: Member): string {
    if (member.discountPercent === 0) {
      return 'No discount';
    }
    const count = member.discountProductIds.length;
    return `${member.discountPercent}% · ${count === 0 ? 'all products' : count + (count === 1 ? ' product' : ' products')}`;
  }

  openEditor(member: Member) {
    this.editing = member;
    this.editPercent = member.discountPercent;
    this.editScope = member.discountProductIds.length ? 'selected' : 'all';
    this.editProductIds = new Set(member.discountProductIds);
    this.productSearch = '';
    this.showSelectedOnly = false;
    this.discountMessage = '';
    if (this.allProducts.length === 0) {
      this.productService.getAllProducts().subscribe((products) => (this.allProducts = products));
    }
  }

  closeEditor() {
    this.editing = null;
  }

  get filteredProducts(): Product[] {
    const term = this.productSearch.trim().toLowerCase();
    return this.allProducts.filter(
      (p) =>
        (!this.showSelectedOnly || this.editProductIds.has(Number(p.id))) &&
        (!term || p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term))
    );
  }

  toggleProduct(id: string | number, checked: boolean) {
    if (checked) {
      this.editProductIds.add(Number(id));
    } else {
      this.editProductIds.delete(Number(id));
    }
  }

  selectAllShown(select: boolean) {
    for (const product of this.filteredProducts) {
      this.toggleProduct(product.id, select);
    }
  }

  saveDiscount() {
    const member = this.editing;
    if (!member) {
      return;
    }
    const percent = Number(this.editPercent);
    if (!Number.isFinite(percent) || percent < 0 || percent > 90) {
      this.discountMessage = 'Discount must be between 0 and 90 %.';
      return;
    }
    if (this.editScope === 'selected' && this.editProductIds.size === 0) {
      this.discountMessage = 'Pick at least one product, or choose “All products”.';
      return;
    }

    const productIds = this.editScope === 'all' ? [] : [...this.editProductIds];
    this.savingDiscount = true;
    this.discountMessage = '';
    this.admin.setDiscount(member.username, Math.round(percent), productIds).subscribe({
      next: (updated) => {
        this.savingDiscount = false;
        this.members = this.members.map((m) => (m.username === updated.username ? updated : m));
        this.editing = null;
        this.discountMessage = `${updated.name}: ${this.discountSummary(updated)}.`;
      },
      error: (err: HttpErrorResponse) => {
        this.savingDiscount = false;
        this.discountMessage = apiErrorMessage(err);
      },
    });
  }

  toggleRole(role: string, checked: boolean) {
    if (checked) {
      this.selectedRoles.add(role);
    } else {
      this.selectedRoles.delete(role);
    }
  }

  showError(name: 'name' | 'username' | 'password'): boolean {
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
    this.createdUsername = '';

    const value = this.form.getRawValue();
    const member = {
      ...value,
      roles: [...this.selectedRoles],
      discountPercent: this.selectedStaffRole ? 0 : Number(value.discountPercent) || 0,
    };
    this.admin.createMember(member).subscribe({
      next: (member) => {
        this.saving = false;
        this.createdUsername = member.username;
        this.form.reset();
        this.selectedRoles = new Set(['ROLE_USER']);
        this.loadMembers();
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        this.error = apiErrorMessage(err);
      },
    });
  }
}
