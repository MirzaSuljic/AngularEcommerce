import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('should fill the form from a demo account', () => {
    const component = TestBed.createComponent(LoginComponent).componentInstance;
    component.useDemoAccount(component.demoAccounts[0]);
    expect(component.form.getRawValue()).toEqual({ username: 'john', password: '1234' });
  });

  it('should show an error for wrong credentials', () => {
    const component = TestBed.createComponent(LoginComponent).componentInstance;
    const http = TestBed.inject(HttpTestingController);

    component.form.setValue({ username: 'john', password: 'wrong' });
    component.onSubmit();
    http.expectOne((req) => req.url.endsWith('/login')).flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(component.error).toBe('Wrong username or password.');
  });
});
