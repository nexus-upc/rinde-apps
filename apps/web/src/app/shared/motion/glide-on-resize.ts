import { DestroyRef, Directive, ElementRef, afterNextRender, inject } from '@angular/core';

const GLIDE_MS = 320;

/**
 * Bloque centrado que cambia de alto: cuando su posición cambia, se desliza desde donde se veía
 * hasta la nueva. El observador corre después del cálculo de diseño y antes de pintar.
 */
@Directive({ selector: '[appGlideOnResize]' })
export class GlideOnResize {
  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (typeof ResizeObserver !== 'function' || typeof element.animate !== 'function') return;
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
      let layoutTop = element.offsetTop;
      let running: Animation | null = null;
      const observer = new ResizeObserver(() => {
        const next = element.offsetTop;
        if (next === layoutTop) return;
        // Lo que la animación en curso todavía desplaza se suma a la posición anterior.
        const parentTop =
          (element.offsetParent as HTMLElement | null)?.getBoundingClientRect().top ?? 0;
        const shift = element.getBoundingClientRect().top - parentTop - next;
        const offset = layoutTop - next + (running ? shift : 0);
        layoutTop = next;
        running?.cancel();
        running = element.animate(
          [{ transform: `translateY(${offset}px)` }, { transform: 'none' }],
          { duration: GLIDE_MS, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
        );
        running.onfinish = () => (running = null);
      });
      observer.observe(element);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
