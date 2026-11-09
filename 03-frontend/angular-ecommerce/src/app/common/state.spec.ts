import { State } from './state';

describe('State', () => {
  it('should describe the expected shape', () => {
    const value: State = { id: 1, name: 'Tuzla' };
    expect(value).toBeTruthy();
  });
});
