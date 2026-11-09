import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private http = inject(HttpClient);
  private contactUrl = `${environment.apiUrl}/contact`;

  send(request: ContactRequest): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.contactUrl, request);
  }
}
