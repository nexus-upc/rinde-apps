import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DemoModeService } from '@core/config/demo-mode.service';
import { ToastService } from '@core/feedback/toast.service';
import { WorkspaceTransition } from '@core/loading/workspace-transition';
import { Toasts } from '@shared/ui/toasts/toasts';
import { WorkspaceLoading } from '@shared/ui/workspace-loading/workspace-loading';

/** Composición raíz: rutas y avisos globales. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toasts, WorkspaceLoading],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  constructor() {
    inject(DemoModeService).load();
  }
  protected readonly toasts = inject(ToastService);
  protected readonly transition = inject(WorkspaceTransition);
}
