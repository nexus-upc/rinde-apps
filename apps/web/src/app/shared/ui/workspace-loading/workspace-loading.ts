import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BrandMark } from '../../brand/brand-mark/brand-mark';

const MESSAGES = {
  screens: 'Descargando tus pantallas',
  fonts: 'Cargando las fuentes',
  opening: 'Abriendo tu espacio',
} as const;

export type WorkspaceLoadingStep = keyof typeof MESSAGES;

/** Carga de entrada: logo, anillo y "Cargando…" sobre blanco; el paso actual se anuncia a lectores de pantalla. */
@Component({
  selector: 'app-workspace-loading',
  imports: [BrandMark],
  template: `
    <div class="workspace-loading" [class.is-leaving]="leaving()" role="status" aria-live="polite">
      <app-brand-mark tone="brand" [size]="40" />
      <span class="workspace-loading__line">
        <span class="workspace-loading__ring" aria-hidden="true"></span>
        <span>Cargando…</span>
      </span>
      <span class="visually-hidden">{{ message() }}</span>
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
}
