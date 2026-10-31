import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '@core/config/api-config';
import { Observable } from 'rxjs';
import { Expense, UpdateExpenseStatusPayload } from '../models/expense.models';

/** Operaciones de Gastos a través del API Gateway. */
@Injectable({ providedIn: 'root' })
export class ExpenseApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}/api/v1`;

  getExpensesByTrip(tripId: string): Observable<Expense[]> {
    return this.http.get<Expense[]>(
      `${this.base}/trips/${encodeURIComponent(tripId)}/expenses`,
    );
  }

  getExpense(id: string): Observable<Expense> {
    return this.http.get<Expense>(`${this.base}/expenses/${encodeURIComponent(id)}`);
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
