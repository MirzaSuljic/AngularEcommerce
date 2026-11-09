import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CartStatusComponent } from './cart-status.component';

describe('CartStatusComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartStatusComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(CartStatusComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
