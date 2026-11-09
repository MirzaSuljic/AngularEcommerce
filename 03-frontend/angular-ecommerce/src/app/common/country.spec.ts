import { Country } from './country';

describe('Country', () => {
  it('should describe the expected shape', () => {
    const value: Country = { id: 1, code: 'BA', name: 'Bosnia and Herzegovina' };
    expect(value).toBeTruthy();
  });
});
