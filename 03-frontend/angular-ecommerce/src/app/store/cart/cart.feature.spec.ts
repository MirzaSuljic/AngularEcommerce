import { CartItem } from '../../common/cart-item';
import { Product } from '../../common/product';
import { CartActions } from './cart.actions';
import { CartState, cartFeature, initialCartState } from './cart.feature';
import { persistCart } from './cart.storage';

function item(id: string, unitPrice: number): CartItem {
  const product = new Product(id, 'SKU-' + id, 'Product ' + id, '', unitPrice, '', true, 10, new Date(), new Date());
  return { ...new CartItem(product) };
}

const reducer = cartFeature.reducer;

function reduce(...actions: Parameters<typeof reducer>[1][]): CartState {
  return actions.reduce((state, action) => reducer(state, action), initialCartState);
}

describe('cart reducer', () => {
  it('adds a new item with quantity 1', () => {
    const state = reduce(CartActions.itemAdded({ item: item('1', 10) }));

    expect(state.ids).toEqual(['1']);
    expect(state.entities['1']?.quantity).toBe(1);
  });

  it('increments the quantity when the same product is added again', () => {
    const state = reduce(
      CartActions.itemAdded({ item: item('1', 10) }),
      CartActions.itemAdded({ item: item('1', 10) }),
    );

    expect(state.ids.length).toBe(1);
    expect(state.entities['1']?.quantity).toBe(2);
  });

  it('removes the line when the quantity drops below 1', () => {
    const state = reduce(
      CartActions.itemAdded({ item: item('1', 10) }),
      CartActions.quantityDecreased({ id: '1' }),
    );

    expect(state.ids).toEqual([]);
  });

  it('does not change state for unknown ids', () => {
    const start = reduce(CartActions.itemAdded({ item: item('1', 10) }));

    expect(reducer(start, CartActions.quantityIncreased({ id: 'x' }))).toBe(start);
    expect(reducer(start, CartActions.quantityDecreased({ id: 'x' }))).toBe(start);
  });

  it('empties the cart', () => {
    const state = reduce(
      CartActions.itemAdded({ item: item('1', 10) }),
      CartActions.itemAdded({ item: item('2', 5) }),
      CartActions.cleared(),
    );

    expect(state.ids).toEqual([]);
  });
});

describe('cart selectors', () => {
  it('computes total quantity and total price', () => {
    const cart = reduce(
      CartActions.itemAdded({ item: item('1', 10) }),
      CartActions.itemAdded({ item: item('1', 10) }),
      CartActions.itemAdded({ item: item('2', 5.5) }),
    );
    const root = { cart };

    expect(cartFeature.selectTotalQuantity(root)).toBe(3);
    expect(cartFeature.selectTotalPrice(root)).toBe(25.5);
    expect(cartFeature.selectAll(root).map((x) => x.id)).toEqual(['1', '2']);
  });
});

describe('persistCart meta-reducer', () => {
  beforeEach(() => localStorage.clear());

  it('saves changes and restores them on the next start', () => {
    const persisted = persistCart(reducer);
    const afterAdd = persisted(undefined, CartActions.itemAdded({ item: item('7', 3) }));

    expect(afterAdd.ids).toEqual(['7']);

    // a new app start: state is undefined, so the saved cart is loaded
    const restored = persisted(undefined, { type: '@ngrx/store/init' });
    expect(restored.ids).toEqual(['7']);
    expect(restored.entities['7']?.quantity).toBe(1);
  });

  it('ignores a broken saved value', () => {
    localStorage.setItem('luv2shop.cart', '{not json');

    const state = persistCart(reducer)(undefined, { type: '@ngrx/store/init' });

    expect(state.ids).toEqual([]);
  });
});
