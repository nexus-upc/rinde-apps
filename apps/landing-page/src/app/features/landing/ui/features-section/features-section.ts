import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FeaturesContent } from '../../models/landing-content.models';
import { FeatureGrid } from '../feature-grid/feature-grid';
import { SectionIntro } from '../section-intro/section-intro';

/** Funcionalidades de la aplicación web para administradores y operaciones. */
@Component({
  selector: 'app-features-section',
  imports: [SectionIntro, FeatureGrid],
  template: `
    <section id="funcionalidades" aria-labelledby="funcionalidades-title" class="section">
      <div class="landing-container">
        <app-section-intro [intro]="content().intro" titleId="funcionalidades-title" />
        <app-feature-grid class="grid" [items]="content().items" />
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

    .grid {
      margin-top: 32px;
    }

    @media (min-width: 768px) {
      .section {
        padding-block: 80px;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturesSection {
  readonly content = input.required<FeaturesContent>();
}
