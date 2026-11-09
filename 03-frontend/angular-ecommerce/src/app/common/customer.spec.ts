import { Customer } from './customer';

describe('Customer', () => {
  it('should describe the expected shape', () => {
    const value: Customer = { firstName: 'Mirza', lastName: 'Suljic', email: 'test@example.com' };
    expect(value).toBeTruthy();
  });
});
