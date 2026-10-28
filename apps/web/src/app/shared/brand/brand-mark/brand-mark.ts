import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RINDE_LOGO } from './rinde-logo';

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
  protected readonly logo = RINDE_LOGO;
  protected readonly width = computed(() => Math.round(this.size() * RINDE_LOGO.ratio));
}
