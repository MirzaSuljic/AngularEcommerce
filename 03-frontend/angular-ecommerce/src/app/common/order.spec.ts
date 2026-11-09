import { Order } from './order';

describe('Order', () => {
  it('should describe the expected shape', () => {
    const value: Order = { totalQuantity: 1, totalPrice: 10 };
    expect(value).toBeTruthy();
  });
});
