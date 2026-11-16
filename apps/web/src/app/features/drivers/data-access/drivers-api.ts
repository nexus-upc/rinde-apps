import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '@core/config/api-config';
import { Observable } from 'rxjs';
import {
  CreateDriverPayload,
  Driver,
  DriverEligibility,
  DriverUserAccount,
  LinkDriverAccountPayload,
} from '../models/driver.models';

/** Operaciones de Conductores y Cuentas DRIVER a través del API Gateway. */
@Injectable({ providedIn: 'root' })
export class DriversApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}/api/v1`;

  getDrivers(): Observable<Driver[]> {
    return this.http.get<Driver[]>(`${this.base}/drivers`);
  }

  getDriver(id: string): Observable<Driver> {
    return this.http.get<Driver>(`${this.base}/drivers/${encodeURIComponent(id)}`);
  }

  createDriver(payload: CreateDriverPayload): Observable<Driver> {
    return this.http.post<Driver>(`${this.base}/drivers`, payload);
  }

  linkAccount(id: string, payload: LinkDriverAccountPayload): Observable<Driver> {
    return this.http.put<Driver>(
      `${this.base}/drivers/${encodeURIComponent(id)}/account`,
      payload,
    );
  }

  getEligibility(id: string): Observable<DriverEligibility> {
    return this.http.get<DriverEligibility>(
      `${this.base}/drivers/${encodeURIComponent(id)}/eligibility`,
    );
  }

  getDriverAccounts(): Observable<DriverUserAccount[]> {
    return this.http.get<DriverUserAccount[]>(`${this.base}/users?role=DRIVER`);
  }
}
