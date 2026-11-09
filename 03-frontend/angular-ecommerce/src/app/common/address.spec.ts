import { Address } from './address';

describe('Address', () => {
  it('should describe the expected shape', () => {
    const value: Address = { street: 'Main St 1', city: 'Tuzla', state: 'TK', country: 'Bosnia and Herzegovina', zipCode: '75000' };
    expect(value).toBeTruthy();
  });
});
