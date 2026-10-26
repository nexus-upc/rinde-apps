import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Marca de Rinde: símbolo y nombre. El símbolo es decorativo; el nombre es lo que se lee. */
@Component({
  selector: 'app-brand-mark',
  templateUrl: './brand-mark.html',
  styleUrl: './brand-mark.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandMark {
  /** Lado del símbolo en píxeles. Con 16 el nombre baja a 12. */
  readonly size = input(24);
  protected readonly nameSize = computed(() => (this.size() >= 24 ? 16 : 12));
}
