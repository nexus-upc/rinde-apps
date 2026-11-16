import { booleanAttribute, ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { Photo } from '../../models/landing-content.models';

/**
 * Foto de la landing. Se abre desde un recorte redondeado al entrar en pantalla. Si el archivo
 * no existe en public/images, muestra un recuadro neutro con la misma proporción.
 */
@Component({
  selector: 'app-photo-slot',
  template: `
    @if (!missing()) {
      <img
        class="photo scroll-photo"
        [class.photo--fill]="fill()"
        [class.photo--tinted]="photo().tinted"
        [src]="photo().src"
        [alt]="photo().alt"
        [style.aspect-ratio]="fill() ? null : photo().ratio"
        [style.object-position]="photo().position ?? null"
        loading="lazy"
        decoding="async"
        (error)="missing.set(true)"
      />
    } @else {
      <div
        class="photo photo--empty"
        [class.photo--fill]="fill()"
        role="img"
        [attr.aria-label]="photo().alt"
        [style.aspect-ratio]="fill() ? null : photo().ratio"
      ></div>
    }
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }

    .photo {
      display: block;
      width: 100%;
      border-radius: var(--landing-radius-photo);
      object-fit: cover;
    }

    // Ocupa toda la altura de su columna (la foto de Cómo empezar).
    .photo--fill {
      height: 100%;
      min-height: 380px;
    }

    // Baja la saturación de una foto más intensa que el resto, para que entone con la página.
    .photo--tinted {
      filter: saturate(0.82) contrast(0.96) brightness(1.03);
    }

    .photo--empty {
      background: var(--arc-surface);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoSlot {
  readonly photo = input.required<Photo>();
  /** Estira la foto al alto de su contenedor en lugar de usar su proporción. */
  readonly fill = input(false, { transform: booleanAttribute });
  protected readonly missing = signal(false);
}
