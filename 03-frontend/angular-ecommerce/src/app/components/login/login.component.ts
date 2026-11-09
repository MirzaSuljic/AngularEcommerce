import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../auth/auth.service';

interface DemoAccount {
  username: string;
  name: string;
  role: string;
}

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // seeded by the backend on first start (password 1234 for all of them)
  readonly demoAccounts: DemoAccount[] = [
    { username: 'john', name: 'John Travolta', role: 'User, Manager' },
    { username: 'jim', name: 'Jim Carry', role: 'Admin' },
    { username: 'arnold', name: 'Arnold Schwarzenegger', role: 'Super admin' },
  ];

  form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  submitting = false;
  error = '';

  useDemoAccount(account: DemoAccount) {
    this.form.setValue({ username: account.username, password: '1234' });
    this.error = '';
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { username, password } = this.form.getRawValue();
    this.submitting = true;
    this.error = '';

    this.auth.login(username, password).subscribe({
      next: () => {
        this.submitting = false;
        const returnUrl =
          this.route.snapshot.queryParamMap.get('returnUrl') || (this.auth.isAdmin() ? '/admin' : '/members');
        this.router.navigateByUrl(returnUrl);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting = false;
        this.error =
          err.status === 401
            ? 'Wrong username or password.'
            : 'The server is not reachable. Check that the backend is running on port 8080.';
      },
    });
  }
}
