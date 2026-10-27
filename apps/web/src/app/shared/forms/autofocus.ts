import { Directive, ElementRef, afterNextRender, inject } from '@angular/core';

/** Enfoca el control recién montado sin buscar identificadores globales en el documento. */
@Directive({ selector: '[appAutoFocus]' })
export class AutoFocus {
  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef);
    afterNextRender(() => element.nativeElement.focus({ preventScroll: true }));
  }
}
