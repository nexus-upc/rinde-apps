import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '@core/config/api-config';
import { Observable } from 'rxjs';
import {
  CreateVehiclePayload,
  Maintenance,
  MaintenanceAlert,
  RecordMaintenancePayload,
  Vehicle,
  VehicleHealthStatus,
} from '../models/fleet.models';

/** Operaciones de Flota, Vehículos y Mantenimiento a través del API Gateway. */
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

  getMaintenanceAlerts(): Observable<MaintenanceAlert[]> {
    return this.http.get<MaintenanceAlert[]>(`${this.base}/maintenances/alerts`);
  }

  recordMaintenance(payload: RecordMaintenancePayload): Observable<Maintenance> {
    return this.http.post<Maintenance>(`${this.base}/maintenances`, payload);
  }

  recordVehicleMaintenance(
    vehicleId: string,
    payload: RecordMaintenancePayload,
  ): Observable<Maintenance> {
    return this.http.post<Maintenance>(
      `${this.base}/vehicles/${encodeURIComponent(vehicleId)}/maintenances`,
      payload,
    );
  }
}
