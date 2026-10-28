import { Injectable, InjectionToken, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

/** Prepara lo que el espacio de trabajo necesita antes de mostrarse (código de las rutas, fuentes). */
export type WorkspacePreload = (url: string) => Promise<unknown>;

export const WORKSPACE_PRELOAD = new InjectionToken<WorkspacePreload>('WORKSPACE_PRELOAD', {
  providedIn: 'root',
  factory: () => () => Promise.resolve(),
});

/** Límite de la preparación: si tarda más, se entra igual y el resto carga después. */
export const WORKSPACE_PRELOAD_LIMIT_MS = 4000;
const LEAVE_MS = 160;

/**
 * Pantalla de carga entre el acceso y el espacio de trabajo. Dura lo que tarda la preparación
 * real y la primera pintura, sin un mínimo decorativo.
 */
@Injectable({ providedIn: 'root' })
export class WorkspaceTransition {
  private readonly router = inject(Router);
  private readonly preload = inject(WORKSPACE_PRELOAD);

  private readonly visibleState = signal(false);
  private readonly leavingState = signal(false);
  readonly visible = this.visibleState.asReadonly();
  readonly leaving = this.leavingState.asReadonly();

  async enter(url: string): Promise<void> {
    this.leavingState.set(false);
    this.visibleState.set(true);
    await Promise.race([
      Promise.all([this.preload(url).catch(() => undefined), fontsReady()]),
      wait(WORKSPACE_PRELOAD_LIMIT_MS),
    ]);
    const navigated = await this.router.navigateByUrl(url);
    if (!navigated) {
      this.visibleState.set(false);
      return;
    }
    await nextPaint();
    this.leavingState.set(true);
    await wait(LEAVE_MS);
    this.visibleState.set(false);
    this.leavingState.set(false);
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fontsReady(): Promise<unknown> {
  return typeof document !== 'undefined' && document.fonts
    ? document.fonts.ready
    : Promise.resolve();
}

/** Espera a que el navegador pinte la pantalla nueva antes de retirar la carga. */
function nextPaint(): Promise<void> {
  if (typeof requestAnimationFrame !== 'function') return Promise.resolve();
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
}
