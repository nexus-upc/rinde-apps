import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { BrandMark } from '../../../../shared/brand/brand-mark/brand-mark';
import { UiButton } from '../../../../shared/ui/ui-button/ui-button';
import { NavLink } from '../../models/landing-content.models';

/** Encabezado fijo: logo, enlaces a las secciones y menú desplegable en teléfono. */
@Component({
  selector: 'app-site-header',
  imports: [BrandMark, UiButton],
  template: `
    <header class="header">
      <div class="landing-container bar">
        <a class="brand" href="#inicio" aria-label="RINDE, ir al inicio" (click)="close()">
          <app-brand-mark [size]="26" />
        </a>

        <button
          type="button"
          class="toggle arc-tap"
          aria-controls="site-menu"
          [attr.aria-expanded]="menuOpen()"
          [attr.aria-label]="menuOpen() ? 'Cerrar el menú' : 'Abrir el menú'"
          (click)="toggle()"
        >
          <span class="toggle__icon" aria-hidden="true"></span>
        </button>

        <nav id="site-menu" class="menu" aria-label="Secciones" [class.is-open]="menuOpen()">
          <ul class="menu__list">
            @for (link of links(); track link.href) {
              <li>
                <a class="menu__link" [href]="link.href" (click)="close()">{{ link.label }}</a>
              </li>
            }
            <li class="menu__cta">
              <a uiButton [href]="cta().href" (click)="close()">{{ cta().label }}</a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  `,
  styles: `
    :host {
      position: sticky;
      top: 0;
      z-index: 50;
      display: block;
    }

    .header {
      border-bottom: 1px solid var(--arc-border);
      background: color-mix(in srgb, var(--arc-bg) 92%, transparent);
      backdrop-filter: blur(8px);
    }

    .bar {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      height: 64px;
    }

    .brand {
      display: inline-flex;
      align-items: center;
      min-height: 44px;
      border-radius: var(--arc-radius-control);
    }

    .toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      padding: 0;
      border: 1px solid var(--arc-border);
      border-radius: var(--arc-radius-control);
      background: var(--arc-bg);
      color: var(--arc-ink);
    }

    // Ícono de hamburguesa: tres barras que forman una equis con el menú abierto.
    .toggle__icon,
    .toggle__icon::before,
    .toggle__icon::after {
      display: block;
      width: 18px;
      height: 2px;
      border-radius: 1px;
      background: currentColor;
      transition:
        transform var(--arc-dur-base) var(--arc-ease-out),
        background-color var(--arc-dur-base) var(--arc-ease-out);
    }

    .toggle__icon {
      position: relative;
    }

    .toggle__icon::before,
    .toggle__icon::after {
      position: absolute;
      left: 0;
      content: '';
    }

    .toggle__icon::before {
      top: -6px;
    }

    .toggle__icon::after {
      top: 6px;
    }

    .toggle[aria-expanded='true'] .toggle__icon {
      background: transparent;
    }

    .toggle[aria-expanded='true'] .toggle__icon::before {
      transform: translateY(6px) rotate(45deg);
    }

    .toggle[aria-expanded='true'] .toggle__icon::after {
      transform: translateY(-6px) rotate(-45deg);
    }

    .menu {
      position: absolute;
      top: 100%;
      right: 0;
      left: 0;
      display: none;
      padding: 8px 16px 16px;
      border-bottom: 1px solid var(--arc-border);
      background: var(--arc-bg);
    }

    .menu.is-open {
      display: block;
    }

    .menu__list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .menu__link {
      display: flex;
      align-items: center;
      min-height: 44px;
      padding: 0 8px;
      border-radius: var(--arc-radius-control);
      color: var(--arc-ink);
      font-size: 16px;
      font-weight: 500;
      text-decoration: none;
    }

    .menu__cta {
      margin-top: 8px;

      a {
        display: flex;
        width: 100%;
        min-height: 44px;
      }
    }

    @media (hover: hover) {
      .menu__link:hover {
        background: var(--arc-surface);
      }
    }

    @media (min-width: 768px) {
      .toggle {
        display: none;
      }

      .menu,
      .menu.is-open {
        position: static;
        display: block;
        padding: 0;
        border: 0;
        background: none;
      }

      .menu__list {
        flex-direction: row;
        align-items: center;
        gap: 4px;
      }

      .menu__cta {
        margin: 0 0 0 12px;

        a {
          display: inline-flex;
          width: auto;
        }
      }

      .menu__link {
        font-size: 15px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .toggle__icon,
      .toggle__icon::before,
      .toggle__icon::after {
        transition: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'close()',
  },
})
export class SiteHeader {
  readonly links = input.required<readonly NavLink[]>();
  readonly cta = input.required<NavLink>();
  protected readonly menuOpen = signal(false);

  protected toggle(): void {
    this.menuOpen.update((open) => !open);
  }

  protected close(): void {
    this.menuOpen.set(false);
  }
}
