import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

import { PricedItem, PricingService } from '../../services/pricing';

/**
 * Shows a price: regular price, or the discounted price with the old one crossed out
 * and a badge saying which discount applies ("Sale −20%" or "Member −10%").
 */
@Component({
  selector: 'app-price',
  imports: [CurrencyPipe],
  templateUrl: './price.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class PriceComponent {
  private pricing = inject(PricingService);

  readonly item = input.required<PricedItem>();
  /** "card" for the product grid, "large" for the product page, "inline" for cart rows */
  readonly size = input<'card' | 'large' | 'inline'>('card');
  readonly showBadge = input(true);

  get info() {
    return this.pricing.info(this.item());
  }
}
