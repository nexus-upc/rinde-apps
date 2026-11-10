import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FeatureItem } from '../../models/landing-content.models';

/** Lista compacta de funcionalidades: ícono en un círculo, título y descripción. */
@Component({
  selector: 'app-feature-grid',
  template: `
    <ul class="grid" [class.grid--stack]="stacked()">
      @for (item of items(); track item.id) {
        <li class="feature">
          <span class="feature__icon">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
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
      gap: 22px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .feature {
      display: flex;
      gap: 14px;
      min-width: 0;
    }

    .feature__icon {
      display: inline-flex;
      flex: none;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--arc-fill-soft);
      color: var(--arc-fill);
    }

    .feature__text {
      min-width: 0;
    }

    .feature__title {
      font-size: 16px;
      font-weight: 500;
      line-height: 24px;
      overflow-wrap: anywhere;
    }

    .feature__description {
      color: var(--arc-muted);
      font-size: 15px;
      line-height: 22px;
      overflow-wrap: anywhere;
    }

    @media (min-width: 768px) {
      .grid:not(.grid--stack) {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 32px;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureGrid {
  readonly items = input.required<readonly FeatureItem[]>();
  readonly stacked = input(false, { transform: booleanAttribute });
}
