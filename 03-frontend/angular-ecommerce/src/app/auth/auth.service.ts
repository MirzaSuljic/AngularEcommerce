import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { clearToken, decodeToken, storeToken, validToken } from './token-storage';

export interface AuthUser {
  username: string;
  name: string;
  roles: string[];
  /** member discount in percent on every product without its own one; always 0 for admins */
  discountPercent: number;
  /** own member discount per product: product id -> percent */
  productDiscounts: Record<string, number>;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private loginUrl = `${environment.apiUrl}/login`;
  private meUrl = `${environment.apiUrl}/users/me`;

  private userSubject = new BehaviorSubject<AuthUser | null>(null);
  readonly user$ = this.userSubject.asObservable();

  private logoutTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    // restore the session after a page reload
    const token = validToken();
    if (token) {
      this.startSession(token);
      this.loadUser().subscribe({ error: () => this.logout() });
    } else {
      clearToken();
    }
  }

  get user(): AuthUser | null {
    return this.userSubject.value;
  }

  isAuthenticated(): boolean {
    return validToken() !== null;
  }

  /** Roles come from the JWT, so they are known right after a page reload. */
  hasRole(role: string): boolean {
    const token = validToken();
    return !!token && (decodeToken(token)?.roles ?? []).includes(role);
  }

  isAdmin(): boolean {
    return this.hasRole('ROLE_ADMIN');
  }

  /** POST /api/login (form encoded) and then load the user's profile. */
  login(username: string, password: string): Observable<AuthUser> {
    const body = new HttpParams().set('username', username).set('password', password);

    return this.http.post<LoginResponse>(this.loginUrl, body).pipe(
      tap((response) => this.startSession(response.access_token)),
      switchMap(() => this.loadUser())
    );
  }

  /** Re-reads the profile, e.g. to pick up a discount an admin just changed. */
  refreshUser() {
    if (this.isAuthenticated()) {
      this.loadUser().subscribe({ error: () => {} });
    }
  }

  /** The signed in user changes their own name. */
  updateName(name: string): Observable<AuthUser> {
    return this.http.put<AuthUser>(this.meUrl, { name }).pipe(tap((user) => this.userSubject.next(user)));
  }

  /** The signed in user changes their own password (the backend checks the current one). */
  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.put<void>(`${this.meUrl}/password`, { currentPassword, newPassword });
  }

  logout(navigate = true) {
    clearTimeout(this.logoutTimer);
    clearToken();
    this.userSubject.next(null);
    if (navigate) {
      this.router.navigateByUrl('/products');
    }
  }

  private loadUser(): Observable<AuthUser> {
    return this.http.get<AuthUser>(this.meUrl).pipe(tap((user) => this.userSubject.next(user)));
  }

  private startSession(token: string) {
    storeToken(token);

    // log out automatically when the access token expires
    const exp = decodeToken(token)?.exp ?? 0;
    clearTimeout(this.logoutTimer);
    this.logoutTimer = setTimeout(() => this.logout(), Math.max(exp * 1000 - Date.now(), 0));
  }
}
