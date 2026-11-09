import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

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

  // discount being edited per username in the table
  discountDrafts: Record<string, number> = {};
  savingDiscountFor = '';
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
        this.discountDrafts = Object.fromEntries(members.map((m) => [m.username, m.discountPercent]));
        this.loadError = '';
      },
      error: (err: HttpErrorResponse) => (this.loadError = apiErrorMessage(err)),
    });
  }

  /** New members with an admin role cannot get a discount. */
  get selectedStaffRole(): boolean {
    return this.selectedRoles.has('ROLE_ADMIN') || this.selectedRoles.has('ROLE_SUPER_ADMIN');
  }

  saveDiscount(member: Member) {
    const value = Number(this.discountDrafts[member.username]);
    if (!Number.isFinite(value) || value < 0 || value > 90) {
      this.discountMessage = 'Discount must be between 0 and 90 %.';
      return;
    }
    this.savingDiscountFor = member.username;
    this.discountMessage = '';
    this.admin.setDiscount(member.username, Math.round(value)).subscribe({
      next: (updated) => {
        this.savingDiscountFor = '';
        this.members = this.members.map((m) => (m.username === updated.username ? updated : m));
        this.discountDrafts[updated.username] = updated.discountPercent;
        this.discountMessage = `${updated.name} now gets ${updated.discountPercent}% off.`;
      },
      error: (err: HttpErrorResponse) => {
        this.savingDiscountFor = '';
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
