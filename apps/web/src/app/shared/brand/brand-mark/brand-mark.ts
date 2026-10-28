import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RINDE_LOGO } from './rinde-logo';

let nextGradientId = 0;

/** Marca de Rinde: el logo horizontal es decorativo y el nombre se lee como texto. */
@Component({
  selector: 'app-brand-mark',
  templateUrl: './brand-mark.html',
  styleUrl: './brand-mark.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandMark {
  /** Alto del logo en píxeles; el ancho sigue su proporción. */
  readonly size = input(24);
  /** brand: símbolo con el degradado y nombre en tinta. mono: todo en el color del texto. */
  readonly tone = input<'brand' | 'mono'>('brand');
  protected readonly logo = RINDE_LOGO;
  protected readonly width = computed(() => Math.round(this.size() * RINDE_LOGO.ratio));
  protected readonly gradientId = `rinde-logo-gradient-${nextGradientId++}`;
  protected readonly symbolFill = computed(() =>
    this.tone() === 'brand' ? `url(#${this.gradientId})` : 'currentColor',
  );
}
