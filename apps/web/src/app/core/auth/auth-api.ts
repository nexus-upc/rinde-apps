import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '../config/api-config';
import { AuthenticationResponse, SignInRequest } from './auth.models';

/** Acceso HTTP sin estado de presentación ni navegación. */
@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  signIn(credentials: SignInRequest) {
    return this.http.post<AuthenticationResponse>(
      `${this.baseUrl}/api/v1/auth/sign-in`,
      credentials,
    );
  }
}
