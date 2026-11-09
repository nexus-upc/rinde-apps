import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '@core/config/api-config';
import { Observable } from 'rxjs';
import { Expense, UpdateExpenseStatusPayload } from '../models/expense.models';

/** Operaciones de Gastos a través del API Gateway. */
@Injectable({ providedIn: 'root' })
export class ExpenseApi {
  private readonly http = inject(HttpClient);
  private readonly origin = inject(API_BASE_URL);
  private readonly base = `${this.origin}/api/v1`;

  getExpensesByTrip(tripId: string): Observable<Expense[]> {
    return this.http.get<Expense[]>(
      `${this.base}/trips/${encodeURIComponent(tripId)}/expenses`,
    );
  }

  getExpense(id: string): Observable<Expense> {
    return this.http.get<Expense>(`${this.base}/expenses/${encodeURIComponent(id)}`);
  }

  /** Descarga el archivo de un comprobante como blob; la ruta exige el JWT, así que no sirve un enlace directo. */
  getEvidenceContent(contentUrl: string): Observable<Blob> {
    return this.http.get(`${this.origin}${contentUrl}`, { responseType: 'blob' });
  }

  updateExpenseStatus(
    id: string,
    payload: UpdateExpenseStatusPayload,
  ): Observable<Expense> {
    return this.http.patch<Expense>(
      `${this.base}/expenses/${encodeURIComponent(id)}/status`,
      payload,
    );
  }
}
