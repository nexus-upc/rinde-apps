import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

/** Dirección de la API, reemplazable por configuración o por una prueba. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.apiBaseUrl.replace(/\/+$/, ''),
});

export function isApiUrl(value: string, baseUrl: string): boolean {
  try {
    const base = new URL(baseUrl);
    const target = new URL(value);
    const path = base.pathname.replace(/\/+$/, '');
    return (
      target.origin === base.origin &&
      (path === '' || target.pathname === path || target.pathname.startsWith(path + '/'))
    );
  } catch {
    return false;
  }
}
