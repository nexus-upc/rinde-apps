import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '@core/config/api-config';
import { Observable } from 'rxjs';
import { CreateVehiclePayload, Vehicle, VehicleHealthStatus } from '../models/fleet.models';

/** Operaciones de Flota y Vehículos a través del API Gateway. */
@Injectable({ providedIn: 'root' })
export class FleetApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}/api/v1`;

  getVehicles(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.base}/vehicles`);
  }

  createVehicle(payload: CreateVehiclePayload): Observable<Vehicle> {
    return this.http.post<Vehicle>(`${this.base}/vehicles`, payload);
  }

  getVehicle(id: string): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${this.base}/vehicles/${encodeURIComponent(id)}`);
  }

  getVehicleHealth(id: string): Observable<VehicleHealthStatus> {
    return this.http.get<VehicleHealthStatus>(
      `${this.base}/vehicles/${encodeURIComponent(id)}/maintenance-status`,
    );
  }
}
