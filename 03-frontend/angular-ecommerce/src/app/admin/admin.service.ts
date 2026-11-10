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
  /** false for admins */
  discountEligible: boolean;
  /** own discount per product: product id -> percent */
  productDiscounts: Record<string, number>;
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

  /** The member's discount on every product (products with their own discount keep theirs). */
  setDiscount(username: string, discountPercent: number): Observable<Member> {
    return this.http.put<Member>(`${this.baseUrl}/users/${encodeURIComponent(username)}/discount`, {
      discountPercent,
    });
  }

  /** Replaces the member's own discounts per product (product id -> percent). */
  setMemberProductDiscounts(username: string, discounts: Record<string, number>): Observable<Member> {
    return this.http.put<Member>(
      `${this.baseUrl}/users/${encodeURIComponent(username)}/product-discounts`,
      { discounts }
    );
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

  /** Categories with their product counts. */
  getCategories(): Observable<{ id: number; categoryName: string; productCount: number }[]> {
    return this.http.get<{ id: number; categoryName: string; productCount: number }[]>(
      `${this.baseUrl}/categories`
    );
  }

  /** Deletes the category and all of its products. */
  deleteCategory(categoryId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/categories/${categoryId}`);
  }

  createCategory(categoryName: string): Observable<{ id: number; categoryName: string }> {
    return this.http.post<{ id: number; categoryName: string }>(`${this.baseUrl}/categories`, {
      categoryName,
    });
  }

  deleteMember(username: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${encodeURIComponent(username)}`);
  }

  deleteProduct(productId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/products/${productId}`);
  }

  /** Uploads a product image; the backend answers with its public URL. */
  uploadImage(file: File): Observable<{ url: string }> {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<{ url: string }>(`${this.baseUrl}/uploads`, body);
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

/** "ROLE_ADMIN" -> "admin" */
export function roleLabel(role: string): string {
  return role.replace(/^ROLE_/, '').replace(/_/g, ' ').toLowerCase();
}
