import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FeaturesContent } from '../../models/landing-content.models';
import { FeatureGrid } from '../feature-grid/feature-grid';
import { PhotoSlot } from '../photo-slot/photo-slot';
import { SectionIntro } from '../section-intro/section-intro';

/** Funcionalidades de la web para operaciones: tres momentos con foto y el resto en una fila. */
@Component({
  selector: 'app-features-section',
  imports: [SectionIntro, FeatureGrid, PhotoSlot],
  template: `
    <section id="funcionalidades" aria-labelledby="funcionalidades-title" class="section">
      <div class="landing-container">
        <app-section-intro centered [intro]="content().intro" titleId="funcionalidades-title" />

        <ul class="showcase">
          @for (item of content().showcase; track item.id) {
            <li class="feature">
              <app-photo-slot [photo]="item.photo" />
              <div class="feature__head">
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
                <h3 class="feature__title">{{ item.title }}</h3>
              </div>
              <p class="feature__text">{{ item.description }}</p>
            </li>
          }
        </ul>

        <app-feature-grid class="more" [items]="content().items" />
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

    .showcase {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 40px 24px;
      margin: 40px 0 0;
      padding: 0;
      list-style: none;
    }

    .feature {
      min-width: 0;
    }

    .feature__head {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 20px;
      color: var(--arc-fill);
    }

    .feature__title {
      color: var(--arc-ink);
      font-size: 22px;
      font-weight: 500;
      line-height: 28px;
      letter-spacing: -0.01em;
    }

    .feature__text {
      margin-top: 8px;
      color: var(--arc-muted);
      font-size: 16px;
      line-height: 25px;
    }

    .more {
      margin-top: 48px;
      padding-top: 32px;
      border-top: 1px solid var(--arc-border);
    }

    @media (min-width: 768px) {
      .showcase {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }

    @media (min-width: 900px) {
      .section {
        padding-block: 0 112px;
      }

      .showcase {
        margin-top: 56px;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturesSection {
  readonly content = input.required<FeaturesContent>();
}
