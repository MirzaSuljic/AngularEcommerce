import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService, AuthUser } from '../../auth/auth.service';
import { Product } from '../../common/product';
import { ProductService } from '../../services/product.service';
import { ConfirmService } from '../../shared/confirm.service';

/** /settings – opened from the user block at the bottom of the sidebar. */
@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class SettingsComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private productService = inject(ProductService);
  private confirm = inject(ConfirmService);

  user: AuthUser | null = null;
  private products: Product[] = [];

  profileForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
  });
  passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(4)]],
  });
  savingProfile = false;
  savingPassword = false;

  constructor() {
    this.auth.user$.subscribe((user) => {
      this.user = user;
      if (user && !this.profileForm.dirty) {
        this.profileForm.reset({ name: user.name });
      }
      if (user && Object.keys(user.productDiscounts ?? {}).length && this.products.length === 0) {
        this.productService.getAllProducts().subscribe((products) => (this.products = products));
      }
    });
    // pick up discount changes an admin made since login
    this.auth.refreshUser();
  }

  get isAdmin(): boolean {
    return this.auth.isAdmin();
  }

  get initials(): string {
    const parts = (this.user?.name || this.user?.username || '?').trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  }

  roleLabel(role: string): string {
    return role.replace(/^ROLE_/, '').replace(/_/g, ' ').toLowerCase();
  }

  /** The member's own product discounts with product names, by name. */
  get ownDiscounts(): { id: string; name: string; percent: number }[] {
    return Object.entries(this.user?.productDiscounts ?? {})
      .map(([id, percent]) => ({
        id,
        percent,
        name: this.products.find((p) => String(p.id) === id)?.name ?? `Product ${id}`,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  saveProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.savingProfile = true;
    this.auth.updateName(this.profileForm.getRawValue().name.trim()).subscribe({
      next: (user) => {
        this.savingProfile = false;
        this.profileForm.reset({ name: user.name });
        this.confirm.inform({ title: 'Profile saved', message: `Your name is now ${user.name}.` });
      },
      // the error popup comes from the global error interceptor
      error: () => (this.savingProfile = false),
    });
  }

  changePassword() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.savingPassword = true;
    this.auth.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.savingPassword = false;
        this.passwordForm.reset();
        this.confirm.inform({
          title: 'Password changed',
          message: 'Use the new password the next time you log in.',
        });
      },
      error: () => (this.savingPassword = false),
    });
  }

  async logout() {
    const confirmed = await this.confirm.ask({
      title: 'Log out?',
      message: 'Your cart stays, but member prices show again only after you log in.',
      confirmText: 'Log out',
      tone: 'danger',
    });
    if (confirmed) {
      this.auth.logout();
    }
  }
}
