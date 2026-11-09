import { Purchase } from './purchase';

describe('Purchase', () => {
  it('should describe the expected shape', () => {
    const address = { street: 'Main St 1', city: 'Tuzla', state: 'TK', country: 'BA', zipCode: '75000' };
    const purchase: Purchase = {
      customer: { firstName: 'Mirza', lastName: 'Suljic', email: 'test@example.com' },
      shippingAddress: address,
      billingAddress: address,
      order: { totalQuantity: 0, totalPrice: 0 },
      orderItems: [],
    };
    expect(purchase.orderItems).toEqual([]);
  });
});
