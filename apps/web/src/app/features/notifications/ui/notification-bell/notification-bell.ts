import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** Acceso al centro de notificaciones desde el marco lateral de la empresa. */
@Component({
  selector: 'app-notification-bell',
  imports: [RouterLink, RouterLinkActive],
  template: `<a
    class="notification-bell"
    routerLink="/notifications"
    routerLinkActive="is-active"
    ariaCurrentWhenActive="page"
    aria-label="Centro de notificaciones"
  >
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0" />
    </svg>
    <span class="notification-bell__label">Avisos</span>
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

    @media (pointer: coarse) {
      .notification-bell {
        min-height: 44px;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBell {}
