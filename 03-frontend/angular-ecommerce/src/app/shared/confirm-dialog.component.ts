import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  viewChild,
} from '@angular/core';

import { ConfirmService } from './confirm.service';

/** Renders the question asked through ConfirmService as a modal <dialog>. */
@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  readonly confirm = inject(ConfirmService);
  private dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const open = this.confirm.request() !== null;
      const dialog = this.dialog().nativeElement;
      if (open && !dialog.open) {
        dialog.showModal();
      } else if (!open && dialog.open) {
        dialog.close();
      }
    });
  }

  /** A click on the dimmed backdrop (the dialog element itself) cancels. */
  onDialogClick(event: MouseEvent) {
    if (event.target === this.dialog().nativeElement) {
      this.confirm.close(false);
    }
  }

  /** Esc cancels. */
  onCancel(event: Event) {
    event.preventDefault();
    this.confirm.close(false);
  }
}
