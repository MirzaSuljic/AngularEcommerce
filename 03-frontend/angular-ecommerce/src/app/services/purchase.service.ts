import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Purchase } from '../common/purchase';

export interface PurchaseResponse {
  orderTrackingNumber: string;
  subtotal: number;
  memberDiscount: number;
  totalPrice: number;
}

@Injectable({
  providedIn: 'root',
})
export class PurchaseService {
  private http = inject(HttpClient);

  private purchaseUrl = `${environment.apiUrl}/checkout/purchase`;

  placeOrder(purchase: Purchase): Observable<PurchaseResponse> {
    return this.http.post<PurchaseResponse>(this.purchaseUrl, purchase);
  }
}
