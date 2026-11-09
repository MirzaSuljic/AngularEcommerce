import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../auth/auth.service';
import { ContactService } from '../../services/contact.service';

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule],
  templateUrl: './contact.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ContactComponent {
  private fb = inject(FormBuilder);
  private contactService = inject(ContactService);
  private auth = inject(AuthService);

  readonly topics = ['Question about an order', 'Product question', 'Membership and discounts', 'Something else'];

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    subject: [this.topics[0], Validators.required],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
  });

  sending = false;
  sent = false;
  error = '';

  constructor() {
    // members don't have to type their name again
    const user = this.auth.user;
    if (user) {
      this.form.patchValue({ name: user.name });
    }
  }

  showError(name: 'name' | 'email' | 'message'): boolean {
    const control = this.form.controls[name];
    return control.invalid && control.touched;
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.sending = true;
    this.error = '';

    this.contactService.send(this.form.getRawValue()).subscribe({
      next: () => {
        this.sending = false;
        this.sent = true;
      },
      error: (err: HttpErrorResponse) => {
        this.sending = false;
        this.error =
          err.status === 0
            ? 'The server is not reachable. Check that the backend is running and try again.'
            : err.error?.message || 'The message could not be sent. Please try again.';
      },
    });
  }

  sendAnother() {
    this.sent = false;
    this.form.reset({ name: this.form.controls.name.value, subject: this.topics[0] });
  }
}
