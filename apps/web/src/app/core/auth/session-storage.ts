import { Injectable } from '@angular/core';

const TOKEN_KEY = 'rinde.accessToken';

/** Aísla el almacenamiento del navegador; una sesión en memoria también es válida. */
@Injectable({ providedIn: 'root' })
export class SessionStorage {
  read(): string | null {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }
  write(token: string): void {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* Sesión en memoria. */
    }
  }
  clear(): void {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* No hay almacenamiento disponible. */
    }
  }
}
