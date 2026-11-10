import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { ToastService } from './toast.service';

/** Shows every failed API call as an error popup (the error is still passed on to the caller). */
export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const toast = inject(ToastService);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && !isHandledElsewhere(request.url, error)) {
        toast.error(errorTitle(error.status), errorDetail(error, request.method, request.url));
      }
      return throwError(() => error);
    })
  );
};

/** The login page shows its own "wrong password" message; an expired session just logs out. */
function isHandledElsewhere(url: string, error: HttpErrorResponse): boolean {
  return url.endsWith('/login') || (error.status === 401 && url.endsWith('/users/me'));
}

function errorTitle(status: number): string {
  switch (status) {
    case 0:
      return 'Server not reachable';
    case 400:
      return 'Request was rejected';
    case 401:
      return 'Please log in again';
    case 403:
      return 'Not allowed';
    case 404:
      return 'Not found (404)';
    case 409:
      return 'Already exists';
    default:
      return status >= 500 ? `Server error (${status})` : `Request failed (${status})`;
  }
}

function errorDetail(error: HttpErrorResponse, method: string, url: string): string {
  if (error.status === 0) {
    return 'Check that the backend is running on port 8080.';
  }
  const message = error.error?.message || error.error?.detail;
  if (message) {
    return message;
  }
  const path = url.replace(/^https?:\/\/[^/]+/, '').split('?')[0];
  if (error.status === 404) {
    return `${method} ${path} does not exist on the server. If the backend code was just changed, restart the backend.`;
  }
  return `${method} ${path}`;
}
