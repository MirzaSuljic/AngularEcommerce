import { CartItem } from './cart-item';
import { Product } from './product';

describe('CartItem', () => {
  it('should be created from a product with quantity 1', () => {
    const product = new Product('7', 'SKU', 'Book', '', 19.99, 'img.png', true, 3, new Date(), new Date());
    const item = new CartItem(product);

    expect(item.id).toBe('7');
    expect(item.unitPrice).toBe(19.99);
    expect(item.quantity).toBe(1);
  });
});
