import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { AuthService } from '../../auth/auth.service';
import { Product } from '../../common/product';
import { ProductService } from '../../services/product.service';
import { AdminService, Member, apiErrorMessage, roleLabel } from '../admin.service';
import { ConfirmService } from '../../shared/confirm.service';
import { ToastService } from '../../shared/toast.service';

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
  private auth = inject(AuthService);
  private confirm = inject(ConfirmService);
  private toast = inject(ToastService);

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

  // the member whose discounts are open in the editor
  editing: Member | null = null;
  allPercent = 0;
  // "apply to selected": percent + products picked in the list
  pickPercent = 10;
  pickedIds = new Set<number>();
  productSearch = '';
  showPickedOnly = false;
  allProducts: Product[] = [];
  // edits of single rows in the "product discounts" table, keyed by product id
  rowDrafts: Record<string, number> = {};
  busy = false;

  saving = false;
  error = '';
  createdUsername = '';

  deletingUsername = '';

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
    return this.selectedRoles.has('ROLE_ADMIN');
  }

  /** The logged in admin cannot delete their own account. */
  isSelf(member: Member): boolean {
    return member.username === this.auth.user?.username;
  }

  async deleteMember(member: Member) {
    const confirmed = await this.confirm.ask({
      title: `Delete ${member.name}?`,
      message: `${member.username} will no longer be able to sign in. This cannot be undone.`,
      confirmText: 'Delete member',
      tone: 'danger',
    });
    if (!confirmed) {
      return;
    }
    this.deletingUsername = member.username;
    this.admin.deleteMember(member.username).subscribe({
      next: () => {
        this.deletingUsername = '';
        this.members = this.members.filter((m) => m.username !== member.username);
        if (this.editing?.username === member.username) {
          this.editing = null;
        }
        this.toast.success('Member deleted', member.name);
      },
      // the error toast comes from the global error interceptor
      error: () => (this.deletingUsername = ''),
    });
  }

  discountSummary(member: Member): string {
    const own = Object.keys(member.productDiscounts ?? {}).length;
    const parts: string[] = [];
    if (member.discountPercent > 0) {
      parts.push(`${member.discountPercent}% on all`);
    }
    if (own > 0) {
      parts.push(`${own} ${own === 1 ? 'product' : 'products'}`);
    }
    return parts.length ? parts.join(' · ') : 'No discount';
  }

  openEditor(member: Member) {
    this.editing = member;
    this.allPercent = member.discountPercent;
    this.pickedIds = new Set();
    this.productSearch = '';
    this.showPickedOnly = false;
    this.resetRowDrafts();
    if (this.allProducts.length === 0) {
      this.productService.getAllProducts().subscribe((products) => (this.allProducts = products));
    }
  }

  closeEditor() {
    this.editing = null;
  }

  /** Products that have the member's own discount, by name. */
  get discountedProducts(): { id: string; percent: number; product?: Product }[] {
    const discounts = this.editing?.productDiscounts ?? {};
    return Object.entries(discounts)
      .map(([id, percent]) => ({ id, percent, product: this.allProducts.find((p) => String(p.id) === id) }))
      .sort((a, b) => (a.product?.name ?? a.id).localeCompare(b.product?.name ?? b.id));
  }

  ownPercent(product: Product): number | undefined {
    return this.editing?.productDiscounts?.[String(product.id)];
  }

  get filteredProducts(): Product[] {
    const term = this.productSearch.trim().toLowerCase();
    return this.allProducts.filter(
      (p) =>
        (!this.showPickedOnly || this.pickedIds.has(Number(p.id))) &&
        (!term || p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term))
    );
  }

  togglePick(id: string | number, checked: boolean) {
    if (checked) {
      this.pickedIds.add(Number(id));
    } else {
      this.pickedIds.delete(Number(id));
    }
  }

  pickAllShown(pick: boolean) {
    for (const product of this.filteredProducts) {
      this.togglePick(product.id, pick);
    }
  }

  private validPercent(value: number, allowZero: boolean): boolean {
    return Number.isFinite(value) && value >= (allowZero ? 0 : 1) && value <= 90;
  }

  /** Saves the discount on every product (products with their own discount keep theirs). */
  saveAllPercent() {
    const member = this.editing;
    const percent = Number(this.allPercent);
    if (!member) {
      return;
    }
    if (!this.validPercent(percent, true)) {
      this.toast.error('Cannot save', 'Discount must be between 0 and 90 %.');
      return;
    }
    this.run(this.admin.setDiscount(member.username, Math.round(percent)), (updated) =>
      updated.discountPercent > 0
        ? {
            title: `${updated.discountPercent}% on all products`,
            message: `${updated.name} now gets ${updated.discountPercent}% on every product that has no own discount.`,
          }
        : { title: 'Discount removed', message: `${updated.name} no longer has a discount on all products.` }
    );
  }

  /** Gives the picked products the chosen percent; products picked earlier keep theirs. */
  applyToPicked() {
    const member = this.editing;
    const percent = Number(this.pickPercent);
    if (!member) {
      return;
    }
    if (!this.validPercent(percent, false)) {
      this.toast.error('Cannot save', 'Discount must be between 1 and 90 %.');
      return;
    }
    if (this.pickedIds.size === 0) {
      this.toast.error('Cannot save', 'Pick at least one product in the list.');
      return;
    }
    const count = this.pickedIds.size;
    const names = this.productNames([...this.pickedIds]);
    const discounts = { ...member.productDiscounts };
    for (const id of this.pickedIds) {
      discounts[String(id)] = Math.round(percent);
    }
    this.run(this.admin.setMemberProductDiscounts(member.username, discounts), (updated) => {
      this.pickedIds = new Set();
      this.showPickedOnly = false;
      return {
        title: `${Math.round(percent)}% saved for ${count} ${count === 1 ? 'product' : 'products'}`,
        message: `${updated.name} now gets ${Math.round(percent)}% on:`,
        items: names,
      };
    });
  }

  isRowDirty(id: string): boolean {
    return this.rowDrafts[id] !== this.editing?.productDiscounts?.[id];
  }

  saveRow(id: string) {
    const member = this.editing;
    const percent = Number(this.rowDrafts[id]);
    if (!member) {
      return;
    }
    if (!this.validPercent(percent, true)) {
      this.toast.error('Cannot save', 'Discount must be between 0 and 90 %.');
      return;
    }
    const discounts = { ...member.productDiscounts, [id]: Math.round(percent) };
    if (discounts[id] === 0) {
      delete discounts[id];
    }
    const [name] = this.productNames([id]);
    this.run(this.admin.setMemberProductDiscounts(member.username, discounts), (updated) =>
      discounts[id]
        ? { title: `${discounts[id]}% saved`, message: `${updated.name} now gets ${discounts[id]}% on:`, items: [name] }
        : { title: 'Discount removed', message: `${updated.name} no longer has an own discount on:`, items: [name] }
    );
  }

  async removeRow(id: string) {
    const member = this.editing;
    if (!member) {
      return;
    }
    const name = this.allProducts.find((p) => String(p.id) === id)?.name ?? `product ${id}`;
    const confirmed = await this.confirm.ask({
      title: 'Remove this discount?',
      message: `${member.name} will no longer get ${member.productDiscounts[id]}% on ${name}.`,
      confirmText: 'Remove',
      tone: 'danger',
    });
    if (!confirmed) {
      return;
    }
    const discounts = { ...member.productDiscounts };
    delete discounts[id];
    this.run(this.admin.setMemberProductDiscounts(member.username, discounts), (updated) => ({
      title: 'Discount removed',
      message: `${updated.name} no longer has an own discount on:`,
      items: [name],
    }));
  }

  async removeAllRows() {
    const member = this.editing;
    if (!member) {
      return;
    }
    const ids = Object.keys(member.productDiscounts);
    const count = ids.length;
    const confirmed = await this.confirm.ask({
      title: 'Remove all product discounts?',
      message: `${member.name} loses the own discount on ${count} ${count === 1 ? 'product' : 'products'}.`,
      confirmText: 'Remove all',
      tone: 'danger',
    });
    if (!confirmed) {
      return;
    }
    const names = this.productNames(ids);
    this.run(this.admin.setMemberProductDiscounts(member.username, {}), (updated) => ({
      title: 'All product discounts removed',
      message: `${updated.name} no longer has an own discount on:`,
      items: names,
    }));
  }

  private resetRowDrafts() {
    this.rowDrafts = { ...(this.editing?.productDiscounts ?? {}) };
  }

  /** Product names for ids, sorted ("Name (SKU)"). */
  private productNames(ids: (string | number)[]): string[] {
    return ids
      .map((id) => {
        const product = this.allProducts.find((p) => String(p.id) === String(id));
        return product ? `${product.name} (${product.sku})` : `Product ${id}`;
      })
      .sort((a, b) => a.localeCompare(b));
  }

  /** Runs a save, shows the updated member everywhere, then a popup with what changed. */
  private run(
    request: Observable<Member>,
    done: (updated: Member) => { title: string; message?: string; items?: string[] }
  ) {
    this.busy = true;
    this.toast.error('Cannot save', '');
    request.subscribe({
      next: (updated) => {
        this.busy = false;
        this.members = this.members.map((m) => (m.username === updated.username ? updated : m));
        this.editing = updated;
        this.allPercent = updated.discountPercent;
        this.resetRowDrafts();
        this.confirm.inform(done(updated));
      },
      // the error toast comes from the global error interceptor
      error: () => (this.busy = false),
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
