import { DestroyRef, Signal, inject, signal } from '@angular/core';

const WIDE_SCREEN_QUERY = '(min-width: 1100px)';

/** Indica si la ventana tiene 1100 px o más, desde donde el acceso usa dos columnas. Debe llamarse en un contexto de inyección. */
export function isWideScreen(): Signal<boolean> {
  const destroyRef = inject(DestroyRef);
  const media =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(WIDE_SCREEN_QUERY)
      : null;
  const wide = signal(media?.matches ?? false);
  const onChange = (event: MediaQueryListEvent): void => wide.set(event.matches);

  media?.addEventListener('change', onChange);
  destroyRef.onDestroy(() => media?.removeEventListener('change', onChange));
  return wide.asReadonly();
}
