import { FormControl } from '@angular/forms';

import { CheckoutValidators } from './checkout-validators';

describe('CheckoutValidators', () => {
  it('should reject a value that is only whitespace', () => {
    expect(CheckoutValidators.notOnlyWhitespace(new FormControl('   '))).toEqual({
      notOnlyWhitespace: true,
    });
  });

  it('should accept a normal value', () => {
    expect(CheckoutValidators.notOnlyWhitespace(new FormControl('John'))).toBeNull();
  });
});
