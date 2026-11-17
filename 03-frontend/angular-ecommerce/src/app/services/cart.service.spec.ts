import { TestBed } from '@angular/core/testing';

import { Product } from '../common/product';
import { provideCartStore } from '../store/cart/provide-cart-store';
import { CartService } from './cart.service';

function product(id: string, unitPrice: number): Product {
  return new Product(id, 'SKU-' + id, 'Product ' + id, '', unitPrice, '', true, 10, new Date(), new Date());
}

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideCartStore()] });
    service = TestBed.inject(CartService);
  });

  it('should add items and compute totals', () => {
    service.addToCart(product('1', 10));
    service.addToCart(product('1', 10));
    service.addToCart(product('2', 5.5));

    expect(service.items().length).toBe(2);
    expect(service.totalQuantity()).toBe(3);
    expect(service.totalPrice()).toBeCloseTo(25.5);
    expect(service.quantityOf('1')).toBe(2);
  });

  it('should remove an item when its quantity drops to zero', () => {
    service.addToCart(product('1', 10));

    service.decrement('1');

    expect(service.items().length).toBe(0);
    expect(service.totalQuantity()).toBe(0);
    expect(service.totalPrice()).toBe(0);
  });

  it('should clear the cart', () => {
    service.addToCart(product('1', 10));
    service.addToCart(product('2', 4));

    service.clear();

    expect(service.items()).toEqual([]);
  });
});
