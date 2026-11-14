import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PlanCard, PlansContent } from '../../models/landing-content.models';
import { SectionIntro } from '../section-intro/section-intro';

/**
 * Planes en tarjetas de color pleno. El color se oscurece con la capacidad y el ícono dibuja un
 * camión por nivel. Los montos aún no están definidos: no se muestra ningún precio.
 */
@Component({
  selector: 'app-plans-section',
  imports: [SectionIntro],
  template: `
    <section id="planes" aria-labelledby="planes-title" class="section">
      <div class="landing-container">
        <app-section-intro centered [intro]="content().intro" titleId="planes-title" />

        <ul class="plans">
          @for (plan of content().plans; track plan.id) {
            <li class="plan" [class]="'plan plan--' + plan.tone">
              <div class="plan__body">
                <span class="plan__trucks" aria-hidden="true">
                  @for (truck of trucks(plan); track $index) {
                    <svg
                      viewBox="0 0 24 24"
                      width="28"
                      height="28"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      focusable="false"
                    >
                      <path d="M1 6h13v10H1z" />
                      <path d="M14 9h4l3 3v4h-7" />
                      <path d="M4 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0" />
                      <path d="M15 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0" />
                    </svg>
                  }
                </span>
                <h3 class="plan__name">{{ plan.name }}</h3>
                <p class="plan__tagline">{{ plan.tagline }}</p>
                <p class="plan__limit">Hasta {{ plan.unitLimit }} unidades</p>
                <p class="plan__price">{{ plan.priceLabel }}</p>
                <p class="plan__note">{{ plan.priceNote }}</p>
                <ul class="plan__highlights">
                  @for (item of plan.highlights; track item) {
                    <li>{{ item }}</li>
                  }
                </ul>
              </div>
              <a class="plan__cta" [href]="content().cardCtaHref">{{ content().cardCta }}</a>
            </li>
          }
        </ul>

        <div class="notes">
          @for (note of content().notes; track note) {
            <p>{{ note }}</p>
          }
        </div>
      </div>
    </section>
  `,
  styleUrl: './plans-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlansSection {
  readonly content = input.required<PlansContent>();

  protected trucks(plan: PlanCard): readonly number[] {
    return Array.from({ length: plan.trucks }, (_, index) => index);
  }
}
