import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { CartItem } from '../../common/cart-item';

/** Everything that can happen to the cart. Components never change cart state directly. */
export const CartActions = createActionGroup({
  source: 'Cart',
  events: {
    'Item Added': props<{ item: CartItem }>(),
    'Quantity Increased': props<{ id: string }>(),
    'Quantity Decreased': props<{ id: string }>(),
    'Item Removed': props<{ id: string }>(),
    Cleared: emptyProps(),
  },
});
