import { TestBed } from '@angular/core/testing';

import { CartItem } from '../common/cart-item';
import { Product } from '../common/product';
import { CartService } from './cart.service';

function product(id: string, unitPrice: number): Product {
  return new Product(id, 'SKU-' + id, 'Product ' + id, '', unitPrice, '', true, 10, new Date(), new Date());
}

describe('CartService', () => {
  let service: CartService;
  let totalPrice = 0;
  let totalQuantity = 0;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
    service.totalPrice.subscribe((v) => (totalPrice = v));
    service.totalQuantity.subscribe((v) => (totalQuantity = v));
  });

  it('should add items and compute totals', () => {
    service.addToCart(new CartItem(product('1', 10)));
    service.addToCart(new CartItem(product('1', 10)));
    service.addToCart(new CartItem(product('2', 5.5)));

    expect(service.cartItems.length).toBe(2);
    expect(totalQuantity).toBe(3);
    expect(totalPrice).toBeCloseTo(25.5);
  });

  it('should remove an item when its quantity drops to zero', () => {
    const item = new CartItem(product('1', 10));
    service.addToCart(item);

    service.decrementQuantity(service.cartItems[0]);

    expect(service.cartItems.length).toBe(0);
    expect(totalQuantity).toBe(0);
    expect(totalPrice).toBe(0);
  });
});
