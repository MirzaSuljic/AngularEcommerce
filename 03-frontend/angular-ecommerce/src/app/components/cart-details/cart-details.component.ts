import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../auth/auth.service';
import { CartItem } from '../../common/cart-item';
import { CartService } from '../../services/cart.service';
import { PricingService } from '../../services/pricing';
import { PriceComponent } from '../price/price.component';
import { ConfirmService } from '../../shared/confirm.service';

@Component({
  selector: 'app-cart-details',
  imports: [CurrencyPipe, RouterLink, PriceComponent],
  templateUrl: './cart-details.component.html',
  styleUrl: './cart-details.component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class CartDetailsComponent implements OnInit {
  private cartService = inject(CartService);
  private confirm = inject(ConfirmService);
  private auth = inject(AuthService);
  readonly pricing = inject(PricingService);

  readonly cartItems = this.cartService.items;
  readonly totalQuantity = this.cartService.totalQuantity;
  loggedIn = false;

  /** subtotal at regular prices, savings and the amount to pay */
  get totals() {
    return this.pricing.totals(this.cartItems());
  }

  ngOnInit(): void {
    this.auth.user$.subscribe((user) => (this.loggedIn = !!user));
    this.auth.refreshUser();
  }

  incrementQuantity(theCartItem: CartItem) {
    this.cartService.increment(theCartItem.id);
  }

  async decrementQuantity(theCartItem: CartItem) {
    // going from 1 to 0 removes the item, so ask first
    if (theCartItem.quantity === 1 && !(await this.askRemove(theCartItem))) {
      return;
    }
    this.cartService.decrement(theCartItem.id);
  }

  async remove(theCartItem: CartItem) {
    if (await this.askRemove(theCartItem)) {
      this.cartService.remove(theCartItem.id);
    }
  }

  private askRemove(item: CartItem): Promise<boolean> {
    return this.confirm.ask({
      title: `Remove ${item.name}?`,
      message: 'It will be taken out of your cart.',
      confirmText: 'Remove',
      tone: 'danger',
    });
  }
}
