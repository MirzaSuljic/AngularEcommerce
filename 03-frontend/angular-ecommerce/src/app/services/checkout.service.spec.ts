import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CheckoutService } from './checkout.service';

describe('CheckoutService', () => {
  let service: CheckoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CheckoutService);
  });

  it('should return months from the start month to December', () => {
    let months: number[] = [];
    service.getCreditCardMonths(10).subscribe((m) => (months = m));
    expect(months).toEqual([10, 11, 12]);
  });

  it('should return the next 11 years starting with the current one', () => {
    let years: number[] = [];
    service.getCreditCardYears().subscribe((y) => (years = y));
    expect(years.length).toBe(11);
    expect(years[0]).toBe(new Date().getFullYear());
  });
});
