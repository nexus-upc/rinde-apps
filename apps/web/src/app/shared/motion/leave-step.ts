import { AnimationCallbackEvent } from '@angular/core';

const LEAVE_FALLBACK_MS = 240;

/**
 * Salida de un paso: deja de ser accesible y de recibir clics en el acto y se desvanece en su
 * lugar mientras entra el siguiente. Con movimiento reducido se retira sin esperar.
 */
export function leaveStep(event: AnimationCallbackEvent): void {
  const element = event.target as HTMLElement;
  element.setAttribute('inert', '');
  element.setAttribute('aria-hidden', 'true');
  const reduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || typeof element.getAnimations !== 'function') {
    event.animationComplete();
    return;
  }
  let done = false;
  const finish = (): void => {
    if (done) return;
    done = true;
    event.animationComplete();
  };
  element.addEventListener('animationend', finish, { once: true });
  setTimeout(finish, LEAVE_FALLBACK_MS);
  element.classList.add('arc-stage-leave');
}
