import { Route, Routes } from '@angular/router';
import { WorkspacePreload } from '@core/loading/workspace-transition';

/**
 * Descarga el código de las rutas que llevan a la dirección de entrada (marco, pantalla y sus
 * rutas diferidas), para que el espacio de trabajo no cargue en frío al mostrarse.
 */
export function routePreload(routes: Routes): WorkspacePreload {
  return (url) => walk(routes, (url.split(/[?#]/)[0] ?? '').split('/').filter(Boolean));
}

function walk(routes: Routes, segments: string[]): Promise<unknown> {
  const loads: Promise<unknown>[] = [];
  for (const route of routes) {
    const path = (route.path ?? '').split('/').filter(Boolean);
    if (route.path === '**' || route.redirectTo || !matches(path, segments)) continue;
    const rest = segments.slice(path.length);
    if (route.loadComponent) loads.push(Promise.resolve(route.loadComponent()));
    if (route.children) loads.push(walk(route.children, rest));
    if (route.loadChildren) {
      loads.push(
        Promise.resolve(route.loadChildren()).then((children) =>
          Array.isArray(children) ? walk(children as Route[], rest) : undefined,
        ),
      );
    }
  }
  return Promise.all(loads);
}

function matches(path: string[], segments: string[]): boolean {
  return (
    path.length <= segments.length &&
    path.every((part, index) => part.startsWith(':') || part === segments[index])
  );
}
