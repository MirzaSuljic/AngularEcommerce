import { CartItem } from './cart-item';
import { OrderItem } from './order-item';
import { Product } from './product';

describe('OrderItem', () => {
  it('should be created from a cart item', () => {
    const product = new Product('7', 'SKU', 'Book', '', 19.99, 'img.png', true, 3, new Date(), new Date());
    const cartItem = new CartItem(product);
    cartItem.quantity = 2;

    const orderItem = new OrderItem(cartItem);

    expect(orderItem.productId).toBe('7');
    expect(orderItem.quantity).toBe(2);
    expect(orderItem.imageUrl).toBe('img.png');
  });
});
