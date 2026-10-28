import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** Escena decorativa del acceso: una ruta que se dibuja, una unidad que la recorre y su viaje. */
@Component({
  selector: 'app-route-scene',
  templateUrl: './route-scene.html',
  styleUrl: './route-scene.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', inert: '' },
})
export class RouteScene {
  /** Trazado compartido por la ruta y por el recorrido de la unidad. */
  protected readonly route = 'M150 330 C 260 360, 300 470, 380 520 S 560 600, 640 720';

  /** Con movimiento reducido la unidad queda quieta en su destino. */
  protected readonly reducedMotion = signal(false);

  constructor() {
    const media =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia(REDUCED_MOTION_QUERY)
        : null;
    this.reducedMotion.set(media?.matches ?? false);
    const onChange = (event: MediaQueryListEvent): void => this.reducedMotion.set(event.matches);
    media?.addEventListener('change', onChange);
    inject(DestroyRef).onDestroy(() => media?.removeEventListener('change', onChange));
  }
}
