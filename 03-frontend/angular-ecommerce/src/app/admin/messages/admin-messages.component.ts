import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { AdminService, ContactMessage, apiErrorMessage } from '../admin.service';

@Component({
  selector: 'app-admin-messages',
  imports: [DatePipe],
  templateUrl: './admin-messages.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AdminMessagesComponent {
  private admin = inject(AdminService);

  messages: ContactMessage[] = [];
  showHandled = false;
  loading = true;
  error = '';

  constructor() {
    this.admin.getMessages().subscribe({
      next: (messages) => {
        this.messages = messages;
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.error = apiErrorMessage(err);
      },
    });
  }

  get openCount(): number {
    return this.messages.filter((m) => !m.handled).length;
  }

  get visibleMessages(): ContactMessage[] {
    return this.showHandled ? this.messages : this.messages.filter((m) => !m.handled);
  }

  toggleHandled(message: ContactMessage) {
    this.admin.setMessageHandled(message.id, !message.handled).subscribe({
      next: (updated) => (this.messages = this.messages.map((m) => (m.id === updated.id ? updated : m))),
      error: (err: HttpErrorResponse) => (this.error = apiErrorMessage(err)),
    });
  }
}
