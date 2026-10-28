import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '@core/config/api-config';
import { Observable } from 'rxjs';
import {
  AssignTripPayload,
  DriverSummary,
  TripAssignmentResponse,
  TripDetail,
  VehicleSummary,
} from '../models/trip.models';

/** Operaciones de Viajes y Flota a través del API Gateway. */
@Injectable({ providedIn: 'root' })
export class TripApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}/api/v1`;

  getTrip(id: string): Observable<TripDetail> {
    return this.http.get<TripDetail>(`${this.base}/trips/${encodeURIComponent(id)}`);
  }

  getVehicles(): Observable<VehicleSummary[]> {
    return this.http.get<VehicleSummary[]>(`${this.base}/vehicles`);
  }

  getDrivers(): Observable<DriverSummary[]> {
    return this.http.get<DriverSummary[]>(`${this.base}/drivers`);
  }

  assignTrip(id: string, payload: AssignTripPayload): Observable<TripAssignmentResponse> {
    return this.http.put<TripAssignmentResponse>(
      `${this.base}/trips/${encodeURIComponent(id)}/assignment`,
      payload,
    );
  }
}
