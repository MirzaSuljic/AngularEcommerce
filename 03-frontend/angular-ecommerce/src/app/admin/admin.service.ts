import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface Member {
  id: number;
  name: string;
  username: string;
  roles: string[];
  discountPercent: number;
  /** false for admins and super admins */
  discountEligible: boolean;
  /** products the discount applies to; empty = every product */
  discountProductIds: number[];
}

export interface NewMember {
  name: string;
  username: string;
  password: string;
  roles: string[];
  discountPercent: number;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  dateCreated: string;
  handled: boolean;
}

export interface NewProduct {
  name: string;
  sku: string;
  description: string;
  unitPrice: number;
  unitsInStock: number;
  imageUrl: string;
  categoryId: number;
  salePercent: number;
  memberDiscountEnabled: boolean;
}

/** Calls the admin-only endpoints under /api/admin (the auth interceptor adds the JWT). */
@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/admin`;

  getRoles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/roles`);
  }

  getMembers(): Observable<Member[]> {
    return this.http.get<Member[]>(`${this.baseUrl}/users`);
  }

  createMember(member: NewMember): Observable<Member> {
    return this.http.post<Member>(`${this.baseUrl}/users`, member);
  }

  /** productIds empty = the discount applies to every product */
  setDiscount(username: string, discountPercent: number, productIds: number[] = []): Observable<Member> {
    return this.http.put<Member>(`${this.baseUrl}/users/${encodeURIComponent(username)}/discount`, {
      discountPercent,
      productIds,
    });
  }

  setProductDiscounts(
    productId: number,
    discounts: { salePercent: number; memberDiscountEnabled: boolean }
  ): Observable<{ id: number; name: string; categoryId: number }> {
    return this.http.put<{ id: number; name: string; categoryId: number }>(
      `${this.baseUrl}/products/${productId}/discounts`,
      discounts
    );
  }

  getMessages(): Observable<ContactMessage[]> {
    return this.http.get<ContactMessage[]>(`${this.baseUrl}/messages`);
  }

  setMessageHandled(id: number, handled: boolean): Observable<ContactMessage> {
    return this.http.put<ContactMessage>(`${this.baseUrl}/messages/${id}/handled`, { handled });
  }

  createCategory(categoryName: string): Observable<{ id: number; categoryName: string }> {
    return this.http.post<{ id: number; categoryName: string }>(`${this.baseUrl}/categories`, {
      categoryName,
    });
  }

  createProduct(product: NewProduct): Observable<{ id: number; name: string; categoryId: number }> {
    return this.http.post<{ id: number; name: string; categoryId: number }>(
      `${this.baseUrl}/products`,
      product
    );
  }
}

/** Turns an API error into a sentence for the admin forms. */
export function apiErrorMessage(err: HttpErrorResponse): string {
  if (err.status === 0) {
    return 'The server is not reachable. Check that the backend is running.';
  }
  if (err.status === 401 || err.status === 403) {
    return 'Your session has no admin rights any more. Log in again as an admin.';
  }
  return err.error?.message || err.error?.detail || `Request failed (${err.status}).`;
}

/** "ROLE_SUPER_ADMIN" -> "super admin" */
export function roleLabel(role: string): string {
  return role.replace(/^ROLE_/, '').replace(/_/g, ' ').toLowerCase();
}
