import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService, AuthUser } from '../../auth/auth.service';
import { ProductCategory } from '../../common/product-category';
import { CategoryCounts, ProductService } from '../../services/product.service';
import { SearchComponent } from '../search/search.component';

/**
 * The shop's left sidebar: logo, search, categories with product counts, info pages,
 * admin links (admins only) and, at the bottom, the signed in user (links to /settings).
 * On phones the app shell shows it as a drawer.
 */
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, SearchComponent],
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class SidebarComponent {
  private auth = inject(AuthService);
  private productService = inject(ProductService);

  readonly adminLinks = [
    { path: '/admin/products', label: 'Products' },
    { path: '/admin/categories', label: 'Categories' },
    { path: '/admin/members', label: 'Members' },
    { path: '/admin/messages', label: 'Messages' },
  ];

  user: AuthUser | null = null;
  categories: ProductCategory[] = [];
  counts: CategoryCounts | null = null;

  constructor() {
    this.auth.user$.subscribe((user) => (this.user = user));
    this.productService.getProductCategories().subscribe((categories) => (this.categories = categories));
    this.productService.getCategoryCounts().subscribe((counts) => (this.counts = counts));
  }

  get isAdmin(): boolean {
    return this.auth.isAdmin();
  }

  countFor(category: ProductCategory): number | null {
    return this.counts?.categories.find((c) => c.id === category.id)?.count ?? null;
  }

  /** "John Travolta" -> "JT" */
  get initials(): string {
    const parts = (this.user?.name || this.user?.username || '?').trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  }

  /** Second line under the name: role or member discount. */
  get subtitle(): string {
    if (!this.user) {
      return '';
    }
    if (this.isAdmin) {
      return 'Admin';
    }
    const own = Object.keys(this.user.productDiscounts ?? {}).length;
    if (this.user.discountPercent > 0) {
      return `Member · ${this.user.discountPercent}% off`;
    }
    if (own > 0) {
      return `Member · ${own} own ${own === 1 ? 'price' : 'prices'}`;
    }
    return 'Member';
  }
}
