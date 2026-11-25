import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatePanel } from '@shared/ui/state-panel/state-panel';

/** Página marco del centro de notificaciones (S4-25). */
@Component({
  selector: 'app-notifications-page',
  imports: [PageHeader, StatePanel],
  template: `<section class="notifications-page">
    <app-page-header
      title="Notificaciones"
      description="Avisos operativos sobre gastos por revisar, mantenimientos, incidencias y liquidaciones."
    />
    <app-state-panel
      title="Sin notificaciones"
      message="Cuando existan avisos operativos aparecerán en esta bandeja."
    />
  </section>`,
  styles: `
    .notifications-page {
      display: grid;
      gap: 24px;
      max-width: 1120px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsPage {}
