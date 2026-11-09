import { ProductCategory } from './product-category';

describe('ProductCategory', () => {
  it('should create an instance', () => {
    const category = new ProductCategory(1, 'Books');
    expect(category.categoryName).toBe('Books');
  });
});
