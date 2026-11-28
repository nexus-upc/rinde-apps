import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** Acceso al centro de notificaciones desde el marco lateral; el contador llega desde el marco. */
@Component({
  selector: 'app-notification-bell',
  imports: [RouterLink, RouterLinkActive],
  template: `<a
    class="notification-bell"
    routerLink="/notifications"
    routerLinkActive="is-active"
    ariaCurrentWhenActive="page"
    [attr.aria-label]="accessibleName()"
  >
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0" />
    </svg>
    <span class="notification-bell__label">Avisos</span>
    @if (badge(); as text) {
      <span class="notification-bell__count" aria-hidden="true">{{ text }}</span>
    }
  </a>`,
  styles: `
    :host {
      display: block;
    }

    .notification-bell {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 36px;
      padding: 0 12px;
      border-radius: 10px;
      color: var(--arc-muted);
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      transition:
        background-color var(--arc-dur-fast) ease,
        color var(--arc-dur-fast) ease;

      svg {
        flex: none;
        fill: none;
        stroke: var(--arc-subtle);
        stroke-width: 1.8;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      &:hover {
        background: var(--arc-surface);
        color: var(--arc-ink);
      }

      &.is-active,
      &.is-active:hover {
        background: var(--arc-fill-soft);
        color: var(--arc-fill);
        font-weight: 600;

        svg {
          stroke: var(--arc-fill);
        }
      }
    }

    .notification-bell__label {
      flex: 1;
      text-align: left;
    }

    .notification-bell__count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 22px;
      height: 22px;
      padding: 0 6px;
      border-radius: var(--arc-radius-pill);
      background: var(--arc-fill);
      color: var(--arc-on-fill);
      font-size: 11px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }

    @media (pointer: coarse) {
      .notification-bell {
        min-height: 44px;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBell {
  /** Avisos sin leer del usuario; el marco los obtiene del estado del centro. */
  readonly unreadCount = input(0);

  /** Oculto si no hay avisos sin leer; "99+" a partir de 100. */
  protected readonly badge = computed(() => {
    const count = this.unreadCount();
    if (count <= 0) return '';
    return count > 99 ? '99+' : String(count);
  });

  protected readonly accessibleName = computed(() => {
    const count = this.unreadCount();
    return count > 0 ? `Centro de notificaciones, ${count} sin leer` : 'Centro de notificaciones';
  });
}
