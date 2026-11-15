import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '@core/config/api-config';
import { Observable } from 'rxjs';
import {
  CloseIncidentPayload,
  Incident,
  IncidentFilters,
  IncidentTripOption,
  IncidentVehicleOption,
  UpdateIncidentStatusPayload,
} from '../models/incident.models';

/** Operaciones de Incidencias operativas a través del API Gateway. */
@Injectable({ providedIn: 'root' })
export class IncidentApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}/api/v1`;

  getIncidents(filters?: IncidentFilters): Observable<Incident[]> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.tripId?.trim()) params = params.set('tripId', filters.tripId.trim());
    if (filters?.vehicleId?.trim()) params = params.set('vehicleId', filters.vehicleId.trim());
    return this.http.get<Incident[]>(`${this.base}/incidents`, { params });
  }

  getIncident(id: string): Observable<Incident> {
    return this.http.get<Incident>(`${this.base}/incidents/${encodeURIComponent(id)}`);
  }

  updateStatus(id: string, payload: UpdateIncidentStatusPayload): Observable<Incident> {
    return this.http.patch<Incident>(
      `${this.base}/incidents/${encodeURIComponent(id)}/status`,
      payload,
    );
  }

  closeIncident(id: string, payload: CloseIncidentPayload): Observable<Incident> {
    return this.http.post<Incident>(
      `${this.base}/incidents/${encodeURIComponent(id)}/close`,
      payload,
    );
  }

  getTrips(): Observable<IncidentTripOption[]> {
    return this.http.get<IncidentTripOption[]>(`${this.base}/trips`);
  }

  getVehicles(): Observable<IncidentVehicleOption[]> {
    return this.http.get<IncidentVehicleOption[]>(`${this.base}/vehicles`);
  }
}
