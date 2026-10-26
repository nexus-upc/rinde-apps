import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthApi } from './auth-api';
import { AuthenticationResponse, ROLE_LABELS, SessionUser, SignInRequest } from './auth.models';
import { readTokenClaims } from './jwt-payload';
import { SessionStorage } from './session-storage';

/** Sesión global. El cliente lee los claims; el servidor valida su firma y sus permisos. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApi);
  private readonly storage = inject(SessionStorage);
  private readonly token = signal(this.restore());
  readonly accessToken = this.token.asReadonly();
  readonly isAuthenticated = computed(() => this.token() !== null);
  readonly user = computed<SessionUser | null>(() => {
    const value = this.token();
    const claims = value ? readTokenClaims(value) : null;
    return claims?.email && claims.role ? { email: claims.email, role: claims.role } : null;
  });
  readonly roleLabel = computed(() => {
    const role = this.user()?.role;
    return role ? (ROLE_LABELS[role] ?? role) : '';
  });
  signIn(credentials: SignInRequest): Observable<AuthenticationResponse> {
    return this.api.signIn(credentials).pipe(
      tap((response) => {
        this.storage.write(response.accessToken);
        this.token.set(response.accessToken);
      }),
    );
  }
  signOut(): void {
    this.storage.clear();
    this.token.set(null);
  }
  getToken(): string | null {
    const value = this.token();
    if (value && !this.valid(value)) this.signOut();
    return this.token();
  }
  private restore(): string | null {
    const value = this.storage.read();
    if (!value || this.valid(value)) return value;
    this.storage.clear();
    return null;
  }
  private valid(token: string): boolean {
    const expiration = readTokenClaims(token)?.exp;
    return expiration !== undefined && expiration * 1000 > Date.now();
  }
}
