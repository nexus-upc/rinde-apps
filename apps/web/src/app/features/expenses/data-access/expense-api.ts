import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '@core/config/api-config';
import { Observable } from 'rxjs';
import {
  Expense,
  ExpensePage,
  ExpenseTrayFilters,
  UpdateExpenseStatusPayload,
} from '../models/expense.models';

/** Operaciones de Gastos a través del API Gateway. */
@Injectable({ providedIn: 'root' })
export class ExpenseApi {
  private readonly http = inject(HttpClient);
  private readonly origin = inject(API_BASE_URL);
  private readonly base = `${this.origin}/api/v1`;

  getExpenses(filters?: ExpenseTrayFilters): Observable<ExpensePage> {
    let params = new HttpParams();
    if (filters?.status) {
      const statusValue =
        typeof filters.status === 'string' ? filters.status : filters.status.join(',');
      if (statusValue) params = params.set('status', statusValue);
    }
    if (filters?.tripId) params = params.set('tripId', filters.tripId);
    if (filters?.driverId) params = params.set('driverId', filters.driverId);
    if (filters?.from) params = params.set('from', filters.from);
    if (filters?.to) params = params.set('to', filters.to);
    if (filters?.page !== undefined) params = params.set('page', filters.page);
    if (filters?.size !== undefined) params = params.set('size', filters.size);
    return this.http.get<ExpensePage>(`${this.base}/expenses`, { params });
  }

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
