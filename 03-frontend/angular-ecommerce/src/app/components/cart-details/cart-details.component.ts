import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../auth/auth.service';
import { CartItem } from '../../common/cart-item';
import { CartService } from '../../services/cart.service';
import { PricingService } from '../../services/pricing';
import { PriceComponent } from '../price/price.component';

@Component({
  selector: 'app-cart-details',
  imports: [CurrencyPipe, RouterLink, PriceComponent],
  templateUrl: './cart-details.component.html',
  styleUrl: './cart-details.component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class CartDetailsComponent implements OnInit {
  private cartService = inject(CartService);
  private auth = inject(AuthService);
  readonly pricing = inject(PricingService);

  cartItems: CartItem[] = [];
  totalPrice = 0;
  totalQuantity = 0;
  loggedIn = false;

  /** subtotal at regular prices, savings and the amount to pay */
  get totals() {
    return this.pricing.totals(this.cartItems);
  }

  ngOnInit(): void {
    this.listCartDetails();

    this.auth.user$.subscribe((user) => (this.loggedIn = !!user));
    this.auth.refreshUser();
  }

  listCartDetails() {
    this.cartItems = this.cartService.cartItems;

    this.cartService.totalPrice.subscribe((data) => (this.totalPrice = data));
    this.cartService.totalQuantity.subscribe((data) => (this.totalQuantity = data));

    this.cartService.computeCartTotals();
  }

  incrementQuantity(theCartItem: CartItem) {
    this.cartService.addToCart(theCartItem);
  }

  decrementQuantity(theCartItem: CartItem) {
    this.cartService.decrementQuantity(theCartItem);
  }

  remove(theCartItem: CartItem) {
    this.cartService.remove(theCartItem);
  }
}
