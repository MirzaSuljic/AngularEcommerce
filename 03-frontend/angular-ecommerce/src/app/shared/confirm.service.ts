import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message?: string;
  /** label of the confirm button (default "Confirm") */
  confirmText?: string;
  /** label of the cancel button (default "Cancel") */
  cancelText?: string;
  /** "danger" for deleting things (red button), "error" for error messages, "primary" for everything else */
  tone?: 'danger' | 'error' | 'primary';
  /** optional list shown under the message, e.g. product names */
  items?: string[];
}

interface ConfirmRequest extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
  /** true = an information popup with only an OK button */
  infoOnly?: boolean;
}


/**
 * Global modal dialog.
 * Ask:    `if (await this.confirm.ask({ title: 'Delete it?', tone: 'danger' })) { ... }`
 * Inform: `this.confirm.inform({ title: 'Saved', items: ['Product A', 'Product B'] })`
 * The dialog itself is <app-confirm-dialog />, placed once in the app shell.
 */
@Injectable({
  providedIn: 'root',
})
export class ConfirmService {
  readonly request = signal<ConfirmRequest | null>(null);

  ask(options: ConfirmOptions): Promise<boolean> {
    // a new question cancels one that is still open
    this.request()?.resolve(false);
    return new Promise((resolve) => this.request.set({ ...options, resolve }));
  }

  /** Shows a message with only an OK button. */
  inform(options: Omit<ConfirmOptions, 'cancelText'>): Promise<void> {
    this.request()?.resolve(false);
    return new Promise((resolve) =>
      this.request.set({ confirmText: 'OK', ...options, infoOnly: true, resolve: () => resolve() })
    );
  }

  close(confirmed: boolean) {
    const request = this.request();
    this.request.set(null);
    request?.resolve(confirmed);
  }
}
