import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BrandMark } from '../../brand/brand-mark/brand-mark';

const MESSAGES = {
  screens: 'Descargando tus pantallas',
  fonts: 'Cargando las fuentes',
  opening: 'Abriendo tu espacio',
} as const;

export type WorkspaceLoadingStep = keyof typeof MESSAGES;
const ORDER: readonly WorkspaceLoadingStep[] = ['screens', 'fonts', 'opening'];

/** Carga de entrada sobre el degradado de marca: logo, avance y el paso que está ocurriendo. */
@Component({
  selector: 'app-workspace-loading',
  imports: [BrandMark],
  template: `
    <div class="workspace-loading" [class.is-leaving]="leaving()" role="status" aria-live="polite">
      <app-brand-mark tone="mono" [size]="48" />
      <span class="workspace-loading__bar" aria-hidden="true">
        <span [style.width.%]="progress()"></span>
      </span>
      <span class="workspace-loading__line">
        <span class="workspace-loading__ring" aria-hidden="true"></span>
        <span>{{ message() }}</span>
      </span>
    </div>
  `,
  styleUrl: './workspace-loading.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceLoading {
  /** Al terminar, la pantalla se desvanece antes de retirarse. */
  readonly leaving = input(false);
  readonly step = input<WorkspaceLoadingStep>('screens');
  protected readonly message = computed(() => MESSAGES[this.step()]);
  protected readonly progress = computed(
    () => ((ORDER.indexOf(this.step()) + 1) / ORDER.length) * 100,
  );
}
