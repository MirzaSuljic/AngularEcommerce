import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { provideState, provideStore } from '@ngrx/store';

import { cartFeature } from './cart.feature';
import { persistCart } from './cart.storage';

/**
 * Root store with the cart feature.
 * The app uses { persist: true }; tests use the default so they don't touch localStorage.
 */
export function provideCartStore(options: { persist?: boolean } = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideStore(),
    provideState(cartFeature.name, cartFeature.reducer, {
      metaReducers: options.persist ? [persistCart] : [],
    }),
  ]);
}
