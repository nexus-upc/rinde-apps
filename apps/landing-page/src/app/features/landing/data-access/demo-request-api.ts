import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '@core/config/api-config';
import { DemoRequest, DemoRequestReceipt } from '../models/demo-request.models';

/** Envío público de solicitudes de demostración; no lleva credenciales. */
@Injectable({ providedIn: 'root' })
export class DemoRequestApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  submit(request: DemoRequest): Observable<DemoRequestReceipt> {
    return this.http.post<DemoRequestReceipt>(
      `${this.baseUrl}/api/v1/public/demo-requests`,
      request,
    );
  }
}
