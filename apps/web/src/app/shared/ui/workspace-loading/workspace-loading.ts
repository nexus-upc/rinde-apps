import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BrandMark } from '../../brand/brand-mark/brand-mark';

/** Carga de entrada: marca, aro y texto centrados sobre el fondo, mientras se prepara la app. */
@Component({
  selector: 'app-workspace-loading',
  imports: [BrandMark],
  template: `
    <div class="workspace-loading" [class.is-leaving]="leaving()" role="status" aria-live="polite">
      <app-brand-mark [size]="40" />
      <span class="workspace-loading__line">
        <span class="workspace-loading__ring" aria-hidden="true"></span>
        <span>Preparando tu espacio</span>
      </span>
    </div>
  `,
  styleUrl: './workspace-loading.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceLoading {
  /** Al terminar, la pantalla se desvanece antes de retirarse. */
  readonly leaving = input(false);
}
