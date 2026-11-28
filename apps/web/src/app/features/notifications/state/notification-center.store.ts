import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastService } from '@core/feedback/toast.service';
import { problemMessage } from '@core/http/problem-message';
import { Subscription } from 'rxjs';
import { NotificationApi } from '../data-access/notification-api';
import {
  NOTIFICATION_PAGE_SIZE,
  NotificationItem,
  NotificationType,
} from '../models/notification.models';

export type NotificationLoadState = 'idle' | 'loading' | 'ready' | 'error';

/** Intervalo de actualización del contador de la campana. */
export const UNREAD_REFRESH_INTERVAL_MS = 60_000;

const LOAD_ERROR =
  'Ocurrió un error al consultar el centro de notificaciones. Reintenta en unos segundos.';
const MARK_ERROR = 'No fue posible marcar el aviso como leído.';
const MARK_ALL_ERROR = 'No fue posible marcar los avisos como leídos.';

/**
 * Estado del centro de notificaciones: la página con sus filtros y el contador de no leídas
 * que comparten la campana y la página. Se crea una sola vez para toda la sesión.
 */
@Injectable({ providedIn: 'root' })
export class NotificationCenterStore {
  private readonly api = inject(NotificationApi);
  private readonly toasts = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly unreadState = signal(0);
  private readonly loadState = signal<NotificationLoadState>('idle');
  private readonly errorState = signal('');
  private readonly itemsState = signal<readonly NotificationItem[]>([]);
  private readonly pageState = signal(0);
  private readonly totalPagesState = signal(0);
  private readonly totalItemsState = signal(0);
  private readonly typeState = signal<NotificationType | null>(null);
  private readonly unreadOnlyState = signal(false);
  private readonly markingState = signal<ReadonlySet<string>>(new Set());
  private readonly markingAllState = signal(false);

  readonly unreadCount = this.unreadState.asReadonly();
  readonly state = this.loadState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly items = this.itemsState.asReadonly();
  readonly page = this.pageState.asReadonly();
  readonly totalPages = this.totalPagesState.asReadonly();
  readonly totalItems = this.totalItemsState.asReadonly();
  readonly typeFilter = this.typeState.asReadonly();
  readonly unreadOnly = this.unreadOnlyState.asReadonly();
  readonly markingAll = this.markingAllState.asReadonly();
  readonly pageSize = NOTIFICATION_PAGE_SIZE;
  readonly hasUnread = computed(() => this.unreadState() > 0);

  private listRequest?: Subscription;
  private countRequest?: Subscription;
  private refreshTimer?: ReturnType<typeof setInterval>;
  private watchOwner: object | null = null;

  /** Carga la página actual con los filtros vigentes; una carga anterior se cancela. */
  load(): void {
    this.listRequest?.unsubscribe();
    this.loadState.set('loading');
    this.errorState.set('');
    const type = this.typeState();

    this.listRequest = this.api
      .getNotifications({
        unreadOnly: this.unreadOnlyState(),
        type: type ? [type] : undefined,
        page: this.pageState(),
        size: NOTIFICATION_PAGE_SIZE,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.itemsState.set(page.items);
          this.pageState.set(page.page);
          this.totalPagesState.set(page.totalPages);
          this.totalItemsState.set(page.totalItems);
          this.loadState.set('ready');
        },
        error: (err) => {
          this.errorState.set(problemMessage(err, LOAD_ERROR));
          this.loadState.set('error');
        },
      });
  }

  retry(): void {
    this.load();
  }

  /** Cambiar un filtro vuelve a la primera página. */
  setTypeFilter(type: NotificationType | null): void {
    if (this.typeState() === type) return;
    this.typeState.set(type);
    this.pageState.set(0);
    this.load();
  }

  setUnreadOnly(unreadOnly: boolean): void {
    if (this.unreadOnlyState() === unreadOnly) return;
    this.unreadOnlyState.set(unreadOnly);
    this.pageState.set(0);
    this.load();
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPagesState() || page === this.pageState()) return;
    this.pageState.set(page);
    this.load();
  }

  isMarking(id: string): boolean {
    return this.markingState().has(id);
  }

  /** Marca un aviso y baja el contador sin recargar la lista. */
  markAsRead(item: NotificationItem): void {
    if (item.readAt !== null || this.markingState().has(item.id)) return;
    this.markingState.update((ids) => new Set(ids).add(item.id));

    this.api
      .markAsRead(item.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.releaseMarking(item.id);
          this.itemsState.update((items) =>
            items.map((current) =>
              current.id === item.id && current.readAt === null
                ? { ...current, readAt: new Date().toISOString() }
                : current,
            ),
          );
          this.unreadState.update((count) => Math.max(0, count - 1));
        },
        error: (err) => {
          this.releaseMarking(item.id);
          this.toasts.show(problemMessage(err, MARK_ERROR), 'danger');
        },
      });
  }

  /** Marca todos los avisos de la empresa; con el filtro "solo no leídas" recarga la lista. */
  markAllAsRead(): void {
    if (this.markingAllState() || !this.hasUnread()) return;
    this.markingAllState.set(true);

    this.api
      .markAllAsRead()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const readAt = new Date().toISOString();
          this.markingAllState.set(false);
          this.unreadState.set(0);
          this.itemsState.update((items) =>
            items.map((item) => (item.readAt === null ? { ...item, readAt } : item)),
          );
          if (this.unreadOnlyState()) this.load();
        },
        error: (err) => {
          this.markingAllState.set(false);
          this.toasts.show(problemMessage(err, MARK_ALL_ERROR), 'danger');
        },
      });
  }

  /** Consulta el contador de no leídas; si falla, conserva el último valor sin avisar. */
  refreshUnreadCount(): void {
    this.countRequest?.unsubscribe();
    this.countRequest = this.api
      .getUnreadCount()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ count }) => this.unreadState.set(count),
        error: () => undefined,
      });
  }

  /**
   * Refresca el contador al iniciar y cada 60 s mientras la pestaña esté visible.
   * El temporizador se detiene cuando se destruye el propietario que lo inició.
   */
  watchUnreadCount(owner: DestroyRef): void {
    this.stopWatching();
    const token = {};
    this.watchOwner = token;
    this.refreshUnreadCount();
    this.refreshTimer = setInterval(() => {
      if (document.visibilityState === 'visible') this.refreshUnreadCount();
    }, UNREAD_REFRESH_INTERVAL_MS);

    owner.onDestroy(() => {
      if (this.watchOwner === token) this.stopWatching();
    });
  }

  private stopWatching(): void {
    clearInterval(this.refreshTimer);
    this.refreshTimer = undefined;
    this.watchOwner = null;
  }

  private releaseMarking(id: string): void {
    this.markingState.update((ids) => {
      const next = new Set(ids);
      next.delete(id);
      return next;
    });
  }
}
