import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AboutContent } from '../../models/landing-content.models';
import { PhotoSlot } from '../photo-slot/photo-slot';
import { SectionIntro } from '../section-intro/section-intro';

/** El problema que resuelve RINDE: dónde vive hoy la información de un viaje y adónde pasa. */
@Component({
  selector: 'app-about-section',
  imports: [PhotoSlot, SectionIntro],
  template: `
    <section id="conozca" aria-labelledby="conozca-title" class="section">
      <div class="landing-container layout">
        <app-photo-slot class="layout__photo" [photo]="content().photo" />
        <div class="layout__text">
          <app-section-intro [intro]="content().intro" titleId="conozca-title" />
          <ul class="points">
            @for (point of content().points; track point.id) {
              <li class="point">
                <svg
                  class="point__icon"
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
                  @for (path of point.iconPaths; track $index) {
                    <path [attr.d]="path" />
                  }
                </svg>
                <div>
                  <h3 class="point__title">{{ point.title }}</h3>
                  <p class="point__text">{{ point.description }}</p>
                </div>
              </li>
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
      padding-block: 64px;
      scroll-margin-top: 72px;
    }

    .layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 40px;
    }

    .points {
      margin: 28px 0 0;
      padding: 0;
      border-top: 1px solid var(--arc-border);
      list-style: none;
    }

    .point {
      display: flex;
      gap: 16px;
      padding-block: 16px;
      border-bottom: 1px solid var(--arc-border);
    }

    .point__icon {
      flex: none;
      margin-top: 2px;
      color: var(--arc-fill);
    }

    .point__title {
      font-size: 16px;
      font-weight: 500;
      line-height: 24px;
    }

    .point__text {
      color: var(--arc-muted);
      font-size: 15px;
      line-height: 22px;
    }

    @media (min-width: 900px) {
      .section {
        padding-block: 112px;
      }

      .layout {
        grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
        align-items: center;
        gap: 80px;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutSection {
  readonly content = input.required<AboutContent>();
}
