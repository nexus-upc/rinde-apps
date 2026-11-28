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
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0" />
    </svg>
    <span class="visually-hidden">Avisos</span>
    @if (badge(); as text) {
      <span class="notification-bell__count" aria-hidden="true">{{ text }}</span>
    }
  </a>`,
  styles: `
    :host {
      display: inline-flex;
    }

    // Botón redondo de 40 px, solo con el icono; el contador se apoya en su esquina.
    .notification-bell {
      position: relative;
      display: flex;
      flex: none;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 20px;
      color: var(--arc-ink);
      text-decoration: none;

      svg {
        flex: none;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.75;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      &:hover {
        background: var(--arc-surface);
      }

      &.is-active,
      &.is-active:hover {
        background: var(--arc-surface);
      }
    }

    .notification-bell__count {
      position: absolute;
      top: 2px;
      right: 2px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      border-radius: var(--arc-radius-pill);
      background: var(--arc-fill);
      color: var(--arc-on-fill);
      box-shadow: 0 0 0 2px var(--arc-bg);
      font-size: 10px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
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
