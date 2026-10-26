import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthenticationResponse, ROLE_LABELS, SessionUser, SignInRequest } from './auth.models';
import { readTokenClaims } from './jwt-payload';

const TOKEN_KEY = 'rinde.accessToken';

/** Inicio y cierre de sesión. El token vive en sessionStorage, así que dura lo que la pestaña. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly token = signal<string | null>(loadValidToken());

  readonly isAuthenticated = computed(() => this.token() !== null);

  readonly user = computed<SessionUser | null>(() => {
    const token = this.token();
    const claims = token ? readTokenClaims(token) : null;
    return claims?.email && claims.role ? { email: claims.email, role: claims.role } : null;
  });

  readonly roleLabel = computed(() => {
    const role = this.user()?.role;
    return role ? (ROLE_LABELS[role] ?? role) : '';
  });

  signIn(credentials: SignInRequest): Observable<AuthenticationResponse> {
    return this.http
      .post<AuthenticationResponse>(`${environment.apiBaseUrl}/api/v1/auth/sign-in`, credentials)
      .pipe(
        tap((response) => {
          writeStoredToken(response.accessToken);
          this.token.set(response.accessToken);
        }),
      );
  }

  signOut(): void {
    removeStoredToken();
    this.token.set(null);
  }

  getToken(): string | null {
    return this.token();
  }
}

function loadValidToken(): string | null {
  const token = readStoredToken();
  if (!token) {
    return null;
  }
  const expiresAt = readTokenClaims(token)?.exp;
  if (expiresAt === undefined || expiresAt * 1000 <= Date.now()) {
    removeStoredToken();
    return null;
  }
  return token;
}

function readStoredToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeStoredToken(token: string): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Sin almacenamiento disponible, la sesión dura solo mientras la aplicación esté abierta.
  }
}

function removeStoredToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nada que limpiar si el almacenamiento no está disponible.
  }
}
