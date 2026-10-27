import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DemoModeService } from '@core/config/demo-mode.service';
import { ToastService } from '@core/feedback/toast.service';
import { Toasts } from '@shared/ui/toasts/toasts';

/** Composición raíz: rutas y avisos globales. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toasts],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  constructor() {
    inject(DemoModeService).load();
  }
  protected readonly toasts = inject(ToastService);
}
