import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import { CartItem } from '../common/cart-item';
import { Product } from '../common/product';
import { CartActions } from '../store/cart/cart.actions';
import { cartFeature } from '../store/cart/cart.feature';

/**
 * Facade over the NgRx cart store.
 * Components read signals and call methods here; they don't know about actions or selectors,
 * so the store can change without touching the UI.
 */
@Injectable({
  providedIn: 'root',
})
export class CartService {
  private store = inject(Store);

  /** cart lines in the order they were added */
  readonly items = this.store.selectSignal(cartFeature.selectAll);
  readonly totalQuantity = this.store.selectSignal(cartFeature.selectTotalQuantity);
  /** at regular catalog prices; use PricingService.totals() for the amount to pay */
  readonly totalPrice = this.store.selectSignal(cartFeature.selectTotalPrice);

  private entities = this.store.selectSignal(cartFeature.selectEntities);

  addToCart(product: Product): void {
    this.store.dispatch(CartActions.itemAdded({ item: { ...new CartItem(product) } }));
  }

  increment(id: string): void {
    this.store.dispatch(CartActions.quantityIncreased({ id }));
  }

  /** removes the line when the quantity drops to 0 */
  decrement(id: string): void {
    this.store.dispatch(CartActions.quantityDecreased({ id }));
  }

  remove(id: string): void {
    this.store.dispatch(CartActions.itemRemoved({ id }));
  }

  clear(): void {
    this.store.dispatch(CartActions.cleared());
  }

  quantityOf(id: string | undefined): number {
    return id ? (this.entities()[id]?.quantity ?? 0) : 0;
  }
}
