import { EntityState, createEntityAdapter } from '@ngrx/entity';
import { createFeature, createReducer, createSelector, on } from '@ngrx/store';

import { CartItem } from '../../common/cart-item';
import { roundMoney } from '../../services/pricing';
import { CartActions } from './cart.actions';

export type CartState = EntityState<CartItem>;

/** Cart lines keyed by product id, in the order they were added. */
export const cartAdapter = createEntityAdapter<CartItem>();

export const initialCartState: CartState = cartAdapter.getInitialState();

export const cartFeature = createFeature({
  name: 'cart',
  reducer: createReducer(
    initialCartState,

    // same product again: +1 and refresh the price fields (sale may have changed)
    on(CartActions.itemAdded, (state, { item }) => {
      const existing = state.entities[item.id];
      return existing
        ? cartAdapter.updateOne(
            { id: item.id, changes: { ...item, quantity: existing.quantity + item.quantity } },
            state,
          )
        : cartAdapter.addOne({ ...item }, state);
    }),

    on(CartActions.quantityIncreased, (state, { id }) => {
      const existing = state.entities[id];
      return existing
        ? cartAdapter.updateOne({ id, changes: { quantity: existing.quantity + 1 } }, state)
        : state;
    }),

    // going below 1 removes the line
    on(CartActions.quantityDecreased, (state, { id }) => {
      const existing = state.entities[id];
      if (!existing) {
        return state;
      }
      return existing.quantity > 1
        ? cartAdapter.updateOne({ id, changes: { quantity: existing.quantity - 1 } }, state)
        : cartAdapter.removeOne(id, state);
    }),

    on(CartActions.itemRemoved, (state, { id }) => cartAdapter.removeOne(id, state)),

    on(CartActions.cleared, (state) => cartAdapter.removeAll(state)),
  ),

  extraSelectors: ({ selectCartState }) => {
    const { selectAll } = cartAdapter.getSelectors(selectCartState);

    const selectTotalQuantity = createSelector(selectAll, (items) =>
      items.reduce((sum, item) => sum + item.quantity, 0),
    );

    /** at regular catalog prices; discounts are applied by PricingService */
    const selectTotalPrice = createSelector(selectAll, (items) =>
      roundMoney(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)),
    );

    return { selectAll, selectTotalQuantity, selectTotalPrice };
  },
});
