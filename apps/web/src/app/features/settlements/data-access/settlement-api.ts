import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '@core/config/api-config';
import { Observable } from 'rxjs';
import {
  CreateAdvancePayload,
  Settlement,
  SettlementExpenseStatusItem,
  SettlementTripOption,
  TripAdvance,
} from '../models/settlement.models';

/** Operaciones de Anticipos y Liquidaciones por viaje a través del API Gateway. */
@Injectable({ providedIn: 'root' })
export class SettlementApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}/api/v1`;

  getTrips(): Observable<SettlementTripOption[]> {
    return this.http.get<SettlementTripOption[]>(`${this.base}/trips`);
  }

  getAdvancesByTrip(tripId: string): Observable<TripAdvance[]> {
    return this.http.get<TripAdvance[]>(
      `${this.base}/trips/${encodeURIComponent(tripId)}/advances`,
    );
  }

  registerAdvance(tripId: string, payload: CreateAdvancePayload): Observable<TripAdvance> {
    return this.http.post<TripAdvance>(
      `${this.base}/trips/${encodeURIComponent(tripId)}/advances`,
      payload,
    );
  }

  getSettlementByTrip(tripId: string): Observable<Settlement> {
    return this.http.get<Settlement>(
      `${this.base}/trips/${encodeURIComponent(tripId)}/settlement`,
    );
  }

  getSettlementById(settlementId: string): Observable<Settlement> {
    return this.http.get<Settlement>(
      `${this.base}/settlements/${encodeURIComponent(settlementId)}`,
    );
  }

  getTripExpenses(tripId: string): Observable<SettlementExpenseStatusItem[]> {
    return this.http.get<SettlementExpenseStatusItem[]>(
      `${this.base}/trips/${encodeURIComponent(tripId)}/expenses`,
    );
  }

  recalculateSettlement(settlementId: string): Observable<Settlement> {
    return this.http.post<Settlement>(
      `${this.base}/settlements/${encodeURIComponent(settlementId)}/recalculation`,
      null,
    );
  }

  closeSettlement(settlementId: string): Observable<Settlement> {
    return this.http.post<Settlement>(
      `${this.base}/settlements/${encodeURIComponent(settlementId)}/close`,
      null,
    );
  }

  /** Descarga el archivo CSV de liquidación autenticado con JWT. */
  exportSettlementCsv(settlementId: string): Observable<HttpResponse<Blob>> {
    return this.http.get(
      `${this.base}/settlements/${encodeURIComponent(settlementId)}/export`,
      { responseType: 'blob', observe: 'response' },
    );
  }
}
