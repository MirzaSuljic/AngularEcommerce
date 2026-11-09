import { Product } from './product';

describe('Product', () => {
  it('should create an instance', () => {
    const product = new Product('1', 'SKU', 'Book', 'desc', 9.99, '', true, 5, new Date(), new Date());
    expect(product.name).toBe('Book');
  });
});
