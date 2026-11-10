import { Injectable, inject } from '@angular/core';

import { ConfirmService } from './confirm.service';

/**
 * Notifications (errors, success messages) as a popup in the global modal (ConfirmService).
 * Kept under this name so callers stay short: `this.toast.error('Cannot save', 'Reason')`.
 */
@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private confirm = inject(ConfirmService);

  error(title: string, message?: string) {
    this.confirm.inform({ title, message, tone: 'error' });
  }

  success(title: string, message?: string) {
    this.confirm.inform({ title, message, tone: 'primary' });
  }

  info(title: string, message?: string) {
    this.confirm.inform({ title, message, tone: 'primary' });
  }
}
