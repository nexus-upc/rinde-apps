import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Pagination } from '@shared/ui/pagination/pagination';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatePanel } from '@shared/ui/state-panel/state-panel';
import { StatusBadge } from '@shared/ui/status-badge/status-badge';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import {
  NOTIFICATION_ACTION_LABELS,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPES,
  NotificationItem,
  NotificationType,
  formatNotificationDate,
} from '../../models/notification.models';
import { NotificationCenterStore } from '../../state/notification-center.store';

interface TypeOption {
  readonly value: NotificationType | null;
  readonly label: string;
}

/** Solo se navega a rutas internas de la web; un enlace externo no se sigue desde el aviso. */
function isInternalLink(link: string): boolean {
  return link.startsWith('/') && !link.startsWith('//');
}

/** Centro de notificaciones de la empresa: lista, filtros, paginación y marcado de avisos (C6). */
@Component({
  selector: 'app-notifications-page',
  imports: [PageHeader, StatePanel, StatusBadge, UiButton, Pagination],
  templateUrl: './notifications-page.html',
  styleUrl: './notifications-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsPage implements OnInit {
  protected readonly store = inject(NotificationCenterStore);
  private readonly router = inject(Router);

  protected readonly typeLabels = NOTIFICATION_TYPE_LABELS;
  protected readonly actionLabels = NOTIFICATION_ACTION_LABELS;
  protected readonly formatDate = formatNotificationDate;
  protected readonly typeOptions: readonly TypeOption[] = [
    { value: null, label: 'Todos' },
    ...NOTIFICATION_TYPES.map((type) => ({ value: type, label: NOTIFICATION_TYPE_LABELS[type] })),
  ];
  protected readonly unreadLabel = computed(() => {
    const count = this.store.unreadCount();
    return count > 0 ? `${count} sin leer` : '';
  });
  protected readonly emptyTitle = computed(() =>
    this.store.unreadOnly() ? 'No tienes avisos sin leer' : 'Sin notificaciones',
  );
  protected readonly emptyMessage = computed(() =>
    this.store.unreadOnly()
      ? 'Estás al día con gastos, incidencias y mantenimientos de tu flota. Puedes ver el historial completo cambiando el filtro.'
      : 'Cuando existan avisos operativos aparecerán en esta bandeja.',
  );

  ngOnInit(): void {
    this.store.load();
  }

  protected onUnreadToggle(event: Event): void {
    this.store.setUnreadOnly((event.target as HTMLInputElement).checked);
  }

  /** Marca el aviso como leído y lleva a su enlace interno. */
  protected open(item: NotificationItem): void {
    this.store.markAsRead(item);
    if (isInternalLink(item.link)) {
      void this.router.navigateByUrl(item.link);
    }
  }
}
