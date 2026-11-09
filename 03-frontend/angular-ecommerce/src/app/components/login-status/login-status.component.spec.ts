import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { LoginStatusComponent } from './login-status.component';

describe('LoginStatusComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginStatusComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(LoginStatusComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
