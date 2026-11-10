import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { CartStatusComponent } from './components/cart-status/cart-status.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ConfirmDialogComponent } from './shared/confirm-dialog.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, SidebarComponent, CartStatusComponent, ConfirmDialogComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
  host: { '(document:keydown.escape)': 'menuOpen = false' },
})
export class AppComponent {
  title = 'angular-ecommerce';

  /** the sidebar drawer on phones */
  menuOpen = false;

  constructor() {
    // close the drawer after picking a link
    inject(Router)
      .events.pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => (this.menuOpen = false));
  }
}
