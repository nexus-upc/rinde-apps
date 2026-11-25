import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '@core/config/api-config';
import { Observable } from 'rxjs';
import {
  AccountUserProfile,
  ChangePasswordRequest,
  CompanyProfile,
  UpdateAccountProfileRequest,
  UpdateCompanyProfileRequest,
} from '../models/account.models';

/** Operaciones de perfil de empresa, perfil de usuario y cambio de contraseña (contrato C7). */
@Injectable({ providedIn: 'root' })
export class AccountApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}/api/v1`;

  getCurrentCompany(): Observable<CompanyProfile> {
    return this.http.get<CompanyProfile>(`${this.base}/tenants/current`);
  }

  updateCurrentCompany(payload: UpdateCompanyProfileRequest): Observable<CompanyProfile> {
    return this.http.patch<CompanyProfile>(`${this.base}/tenants/current`, payload);
  }

  updateProfile(payload: UpdateAccountProfileRequest): Observable<AccountUserProfile> {
    return this.http.patch<AccountUserProfile>(`${this.base}/users/me`, payload);
  }

  changePassword(payload: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/users/me/password`, payload);
  }
}
