import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_BASE_URL, isApiUrl } from '../config/api-config';
import { AuthService } from './auth.service';

/** Solo envía el JWT al origen de la API; un 401 del token actual cierra esa sesión. */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const baseUrl = inject(API_BASE_URL);
  const token = auth.getToken();
  if (!token || !isApiUrl(request.url, baseUrl)) return next(request);
  const path = new URL(request.url).pathname;
  const signIn = path === '/api/v1/auth/sign-in' || path === '/api/v1/platform/auth/sign-in';
  const loginRoute = auth.user()?.scope === 'PLATFORM' ? '/platform/sign-in' : '/sign-in';
  if (signIn) return next(request);
  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !signIn &&
        auth.getToken() === token
      ) {
        auth.signOut();
        void router.navigateByUrl(loginRoute);
      }
      return throwError(() => error);
    }),
  );
};
