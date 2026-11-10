import { Injectable, inject } from '@angular/core';

import { AuthService, AuthUser } from '../auth/auth.service';

/** Anything with a price: a Product or a CartItem. */
export interface PricedItem {
  id: string | number;
  unitPrice: number;
  salePercent?: number;
  memberDiscountEnabled?: boolean;
}

export interface PriceInfo {
  /** regular catalog price */
  original: number;
  /** price the customer pays */
  price: number;
  /** total discount in percent compared to the regular price (0 = none) */
  percent: number;
  /** which discounts were applied */
  source: 'sale' | 'member' | 'both' | null;
  /** product sale in percent (0 = no sale) */
  salePercent: number;
  /** the member's discount for this product in percent (0 = none) */
  memberPercent: number;
}

/** Rounds to cents, half up (same as BigDecimal HALF_UP on the backend, without float noise). */
export function roundMoney(value: number): number {
  return Math.round(Number((value * 100).toPrecision(12))) / 100;
}

function applyPercent(price: number, percent: number): number {
  return percent > 0 ? roundMoney((price * (100 - percent)) / 100) : roundMoney(price);
}

/**
 * Same rule as Pricing.java on the backend:
 * a product sale applies to everyone, a member discount applies to all or selected products
 * (unless switched off for the product). Both stack: the member discount is taken off the sale price.
 */
@Injectable({
  providedIn: 'root',
})
export class PricingService {
  private user: AuthUser | null = null;

  constructor() {
    inject(AuthService).user$.subscribe((user) => (this.user = user));
  }

  /** The logged in member's discount on every product in percent (0 for guests and admins). */
  get memberPercent(): number {
    return this.user?.discountPercent ?? 0;
  }

  /** How many products have the member's own discount. */
  get productDiscountCount(): number {
    return Object.keys(this.user?.productDiscounts ?? {}).length;
  }

  get hasMemberDiscount(): boolean {
    return this.memberPercent > 0 || this.productDiscountCount > 0;
  }

  /** The product's own member discount, otherwise the all-products one (same as User.memberDiscountFor). */
  memberPercentFor(item: PricedItem): number {
    if (!this.user || item.memberDiscountEnabled === false) {
      return 0;
    }
    return this.user.productDiscounts?.[String(item.id)] ?? this.memberPercent;
  }

  info(item: PricedItem): PriceInfo {
    const sale = item.salePercent ?? 0;
    const member = this.memberPercentFor(item);
    const price = applyPercent(applyPercent(item.unitPrice, sale), member);
    const percent = item.unitPrice > 0 ? Math.round((1 - price / item.unitPrice) * 100) : 0;
    return {
      original: item.unitPrice,
      price,
      percent: price < item.unitPrice ? Math.max(percent, 1) : 0,
      source: sale > 0 && member > 0 ? 'both' : sale > 0 ? 'sale' : member > 0 ? 'member' : null,
      salePercent: sale,
      memberPercent: member,
    };
  }

  /** Totals for a list of cart items. */
  totals(items: (PricedItem & { quantity: number })[]): { subtotal: number; discount: number; total: number } {
    let subtotal = 0;
    let total = 0;
    for (const item of items) {
      const info = this.info(item);
      subtotal += item.unitPrice * item.quantity;
      total += info.price * item.quantity;
    }
    subtotal = roundMoney(subtotal);
    total = roundMoney(total);
    return { subtotal, discount: roundMoney(subtotal - total), total };
  }
}
