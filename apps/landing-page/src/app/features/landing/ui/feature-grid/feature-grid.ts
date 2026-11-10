import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FeatureItem } from '../../models/landing-content.models';

/** Lista de funcionalidades: ícono, título y descripción. En columna o en cuadrícula. */
@Component({
  selector: 'app-feature-grid',
  template: `
    <ul class="grid" [class.grid--stack]="stacked()">
      @for (item of items(); track item.id) {
        <li class="feature">
          <span class="feature__icon">
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              @for (path of item.iconPaths; track $index) {
                <path [attr.d]="path" />
              }
            </svg>
          </span>
          <div class="feature__text">
            <h3 class="feature__title">{{ item.title }}</h3>
            <p class="feature__description">{{ item.description }}</p>
          </div>
        </li>
      }
    </ul>
  `,
  styles: `
    :host {
      display: block;
    }

    .grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 16px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .feature {
      display: flex;
      gap: 16px;
      min-width: 0;
      padding: 20px;
      border: 1px solid var(--arc-border);
      border-radius: var(--arc-radius-row);
      background: var(--arc-card);
    }

    .feature__icon {
      display: inline-flex;
      flex: none;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: var(--arc-radius-control);
      background: var(--arc-fill-soft);
      color: var(--arc-fill);
    }

    .feature__text {
      min-width: 0;
    }

    .feature__title {
      font-size: 16px;
      line-height: 24px;
      overflow-wrap: anywhere;
    }

    .feature__description {
      margin-top: 4px;
      color: var(--arc-muted);
      font-size: 16px;
      line-height: 24px;
      overflow-wrap: anywhere;
    }

    .grid--stack .feature {
      padding: 0;
      border: 0;
      background: none;
    }

    @media (min-width: 640px) {
      .grid:not(.grid--stack) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (min-width: 1024px) {
      .grid:not(.grid--stack) {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureGrid {
  readonly items = input.required<readonly FeatureItem[]>();
  readonly stacked = input(false, { transform: booleanAttribute });
}
