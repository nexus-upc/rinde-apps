import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DriverContent } from '../../models/landing-content.models';
import { FeatureGrid } from '../feature-grid/feature-grid';
import { PhoneMockup } from '../phone-mockup/phone-mockup';
import { SectionIntro } from '../section-intro/section-intro';

/** Funcionalidades de la app Android para conductores, junto a la pantalla Registrar gasto. */
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
    }

    .section {
      padding-block: 64px;
      scroll-margin-top: 72px;
    }

    .layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 40px;
      align-items: center;
    }

    .features {
      margin-top: 32px;
    }

    .layout__text,
    .layout__visual {
      min-width: 0;
    }

    .layout__visual {
      padding-block: 48px;
      border-radius: var(--landing-radius-photo);
      background: var(--landing-wash);
    }

    @media (min-width: 900px) {
      .section {
        padding-block: 112px;
      }

      .layout {
        grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
        gap: 80px;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriverSection {
  readonly content = input.required<DriverContent>();
}
