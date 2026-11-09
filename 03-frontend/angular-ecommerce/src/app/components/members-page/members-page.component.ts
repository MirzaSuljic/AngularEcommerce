import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService, AuthUser } from '../../auth/auth.service';

@Component({
  selector: 'app-members-page',
  imports: [RouterLink],
  templateUrl: './members-page.component.html',
  styleUrl: './members-page.component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class MembersPageComponent {
  private auth = inject(AuthService);

  user: AuthUser | null = null;

  constructor() {
    this.auth.user$.subscribe((user) => (this.user = user));
    this.auth.refreshUser();
  }

  get isStaff(): boolean {
    return !!this.user?.roles.some((r) => r === 'ROLE_ADMIN' || r === 'ROLE_SUPER_ADMIN');
  }

  roleLabel(role: string): string {
    return role.replace('ROLE_', '').replace('_', ' ').toLowerCase();
  }
}
