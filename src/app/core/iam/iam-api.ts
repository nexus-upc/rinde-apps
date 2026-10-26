import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CurrentUser,
  InviteUserRequest,
  RegisterTenantRequest,
  Tenant,
  UpdateUserRequest,
  User,
} from './iam.models';

/** Llamadas a IAM a través del gateway: empresa, recuperación de acceso y usuarios. */
@Injectable({ providedIn: 'root' })
export class IamApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/v1`;

  registerTenant(request: RegisterTenantRequest): Observable<Tenant> {
    return this.http.post<Tenant>(`${this.base}/tenants`, request);
  }

  verifyTenant(tenantId: string, token: string): Observable<Tenant> {
    return this.http.post<Tenant>(`${this.base}/tenants/${encodeURIComponent(tenantId)}/verification`, { token });
  }

  requestPasswordReset(email: string): Observable<void> {
    return this.http.post<void>(`${this.base}/auth/password-reset`, { email });
  }

  /** Sirve para el enlace de recuperación y para la invitación: ambos definen la contraseña con su token. */
  definePassword(token: string, password: string): Observable<void> {
    return this.http.post<void>(`${this.base}/auth/password`, { token, password });
  }

  currentUser(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${this.base}/users/me`);
  }

  listUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/users`);
  }

  inviteUser(request: InviteUserRequest): Observable<User> {
    return this.http.post<User>(`${this.base}/users`, request);
  }

  updateUser(id: string, request: UpdateUserRequest): Observable<User> {
    return this.http.patch<User>(`${this.base}/users/${encodeURIComponent(id)}`, request);
  }
}
