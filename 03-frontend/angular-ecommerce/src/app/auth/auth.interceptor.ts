import { HttpInterceptorFn } from '@angular/common/http';

import { environment } from '../../environments/environment';
import { validToken } from './token-storage';

/** Adds "Authorization: Bearer <token>" to requests that go to our own API. */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = validToken();

  if (token && request.url.startsWith(environment.apiUrl)) {
    request = request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(request);
};
