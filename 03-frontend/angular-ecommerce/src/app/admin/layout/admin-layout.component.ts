import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AdminLayoutComponent {
  readonly sections = [
    { path: 'products', label: 'Products' },
    { path: 'categories', label: 'Categories' },
    { path: 'members', label: 'Members' },
  ];
}
