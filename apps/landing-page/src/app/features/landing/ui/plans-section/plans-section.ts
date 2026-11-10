import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UiButton } from '../../../../shared/ui/ui-button/ui-button';
import { PlansContent } from '../../models/landing-content.models';
import { SectionIntro } from '../section-intro/section-intro';

/** Planes por límite de unidades. Los montos aún no están definidos: no se muestra ningún precio. */
@Component({
  selector: 'app-plans-section',
  imports: [SectionIntro, UiButton],
  template: `
    <section id="planes" aria-labelledby="planes-title" class="section">
      <div class="landing-container">
        <app-section-intro [intro]="content().intro" titleId="planes-title" />

        <ul class="plans">
          @for (plan of content().plans; track plan.id) {
            <li class="plan" [class.plan--featured]="plan.featured">
              <div class="plan__head">
                <h3 class="plan__name">{{ plan.name }}</h3>
                @if (plan.badge) {
                  <span class="plan__badge">{{ plan.badge }}</span>
                }
              </div>
              <p class="plan__tagline">{{ plan.tagline }}</p>
              <p class="plan__limit">
                Hasta <strong>{{ plan.unitLimit }}</strong> unidades
              </p>
              <p class="plan__price">{{ plan.priceLabel }}</p>
              <ul class="plan__highlights">
                @for (item of plan.highlights; track item) {
                  <li>{{ item }}</li>
                }
              </ul>
              <a uiButton variant="secondary" block [href]="content().cardCtaHref">
                {{ content().cardCta }}
              </a>
            </li>
          }
        </ul>

        <div class="model">
          <h3 class="model__title">{{ content().modelTitle }}</h3>
          <ul class="model__points">
            @for (point of content().modelPoints; track point) {
              <li>{{ point }}</li>
            }
          </ul>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .section {
      padding-block: 56px;
      scroll-margin-top: 72px;
    }

    .plans {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 16px;
      margin: 32px 0 0;
      padding: 0;
      list-style: none;
    }

    .plan {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 0;
      padding: 24px;
      border: 1px solid var(--arc-border);
      border-radius: var(--arc-radius-card);
      background: var(--arc-card);
    }

    .plan--featured {
      border-color: var(--arc-accent);
      box-shadow: 0 0 0 3px var(--arc-focus-ring);
    }

    .plan__head {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }

    .plan__name {
      font-size: 20px;
      line-height: 28px;
    }

    .plan__badge {
      padding: 2px 10px;
      border-radius: var(--arc-radius-pill);
      background: var(--arc-fill-soft);
      color: var(--arc-fill);
      font-size: 13px;
      font-weight: 500;
      line-height: 20px;
    }

    .plan__tagline {
      color: var(--arc-muted);
      font-size: 16px;
      line-height: 24px;
    }

    .plan__limit {
      font-size: 16px;
      line-height: 24px;

      strong {
        font-weight: 600;
      }
    }

    .plan__price {
      padding: 10px 12px;
      border-radius: var(--arc-radius-control);
      background: var(--arc-surface);
      color: var(--arc-muted);
      font-size: 14px;
      font-weight: 500;
      line-height: 20px;
    }

    .plan__highlights {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 8px;
      margin: 0 0 8px;
      padding: 0;
      color: var(--arc-ink);
      font-size: 16px;
      line-height: 24px;
      list-style: none;

      li {
        position: relative;
        padding-left: 24px;
        overflow-wrap: anywhere;

        &::before {
          position: absolute;
          top: 6px;
          left: 4px;
          width: 6px;
          height: 11px;
          border-right: 2px solid var(--arc-fill);
          border-bottom: 2px solid var(--arc-fill);
          transform: rotate(45deg);
          content: '';
        }
      }
    }

    .model {
      margin-top: 32px;
      padding: 24px;
      border-radius: var(--arc-radius-card);
      background: var(--arc-surface-soft);
    }

    .model__title {
      font-size: 18px;
      line-height: 26px;
    }

    .model__points {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 8px 32px;
      margin: 12px 0 0;
      padding-left: 20px;
      color: var(--arc-muted);
      font-size: 16px;
      line-height: 24px;
    }

    @media (min-width: 768px) {
      .section {
        padding-block: 80px;
      }

      .model__points {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (min-width: 900px) {
      .plans {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlansSection {
  readonly content = input.required<PlansContent>();
}
