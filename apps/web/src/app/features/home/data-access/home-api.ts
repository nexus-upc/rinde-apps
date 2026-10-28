import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '@core/config/api-config';
import { Observable } from 'rxjs';
import { FleetDriver, FleetVehicle, TripSummary } from '../models/home.models';

/** Lecturas que necesita el inicio, a través del gateway. */
@Injectable({ providedIn: 'root' })
export class HomeApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}/api/v1`;

  trips(): Observable<TripSummary[]> {
    return this.http.get<TripSummary[]>(`${this.base}/trips`);
  }

  vehicles(): Observable<FleetVehicle[]> {
    return this.http.get<FleetVehicle[]>(`${this.base}/vehicles`);
  }

  drivers(): Observable<FleetDriver[]> {
    return this.http.get<FleetDriver[]>(`${this.base}/drivers`);
  }
}
