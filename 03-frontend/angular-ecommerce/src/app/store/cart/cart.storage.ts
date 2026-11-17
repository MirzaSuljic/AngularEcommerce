import { Action, ActionReducer } from '@ngrx/store';

import { CartState } from './cart.feature';

const STORAGE_KEY = 'luv2shop.cart';

function hasStorage(): boolean {
  return typeof localStorage !== 'undefined';
}

/** Reads the saved cart; anything unreadable is ignored so a bad value can't break the app. */
export function loadCart(): CartState | undefined {
  if (!hasStorage()) {
    return undefined;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return undefined;
    }
    const parsed = JSON.parse(raw) as CartState;
    return Array.isArray(parsed?.ids) && parsed.entities && typeof parsed.entities === 'object'
      ? parsed
      : undefined;
  } catch {
    return undefined;
  }
}

function saveCart(state: CartState): void {
  if (!hasStorage()) {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ids: state.ids, entities: state.entities }));
  } catch {
    // storage full or blocked (private mode): the cart still works, it just isn't kept
  }
}

/**
 * Feature meta-reducer: starts the cart from localStorage and saves every change,
 * so the cart survives a page refresh. Prices are checked again on the backend at checkout.
 */
export function persistCart(reducer: ActionReducer<CartState, Action>): ActionReducer<CartState, Action> {
  return (state, action) => {
    const next = reducer(state ?? loadCart(), action);
    if (next !== state) {
      saveCart(next);
    }
    return next;
  };
}
