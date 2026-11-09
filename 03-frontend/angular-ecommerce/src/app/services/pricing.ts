/** Price helpers for the member discount (the backend applies the same rule at checkout). */

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function discountAmount(subtotal: number, discountPercent: number): number {
  return roundMoney((subtotal * discountPercent) / 100);
}

export function discountedPrice(price: number, discountPercent: number): number {
  return roundMoney(price - discountAmount(price, discountPercent));
}
