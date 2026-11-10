import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DriverContent } from '../../models/landing-content.models';
import { FeatureGrid } from '../feature-grid/feature-grid';
import { PhoneMockup } from '../phone-mockup/phone-mockup';
import { SectionIntro } from '../section-intro/section-intro';

/** Funcionalidades de la app Android para conductores, junto a una maqueta de su pantalla. */
@Component({
  selector: 'app-driver-section',
  imports: [SectionIntro, FeatureGrid, PhoneMockup],
  template: `
    <section id="conductores" aria-labelledby="conductores-title" class="section">
      <div class="landing-container layout">
        <div class="layout__text">
          <app-section-intro [intro]="content().intro" titleId="conductores-title" />
          <app-feature-grid class="features" stacked [items]="content().items" />
        </div>
        <div class="layout__visual">
          <app-phone-mockup [content]="content().mockup" />
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      background: var(--arc-surface-soft);
    }

    .section {
      padding-block: 56px;
      scroll-margin-top: 72px;
    }

    .layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 40px;
      align-items: center;
    }

    .features {
      margin-top: 28px;
    }

    .layout__visual {
      min-width: 0;
    }

    @media (min-width: 900px) {
      .section {
        padding-block: 80px;
      }

      .layout {
        grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
        gap: 64px;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriverSection {
  readonly content = input.required<DriverContent>();
}
