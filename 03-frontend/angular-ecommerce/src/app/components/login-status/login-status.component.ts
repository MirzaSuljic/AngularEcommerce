import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService, AuthUser } from '../../auth/auth.service';

@Component({
  selector: 'app-login-status',
  imports: [RouterLink],
  templateUrl: './login-status.component.html',
  styleUrl: './login-status.component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class LoginStatusComponent {
  private auth = inject(AuthService);

  user: AuthUser | null = null;

  constructor() {
    this.auth.user$.subscribe((user) => (this.user = user));
  }

  get isAdmin(): boolean {
    return this.auth.isAdmin();
  }

  logout() {
    this.auth.logout();
  }
}
