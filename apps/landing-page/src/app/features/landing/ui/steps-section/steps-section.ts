import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { StepsContent } from '../../models/landing-content.models';
import { PhotoSlot } from '../photo-slot/photo-slot';
import { SectionIntro } from '../section-intro/section-intro';

/** Cómo empezar: una secuencia real, por eso va numerada. La foto ocupa el alto de la lista. */
@Component({
  selector: 'app-steps-section',
  imports: [SectionIntro, PhotoSlot],
  template: `
    <section id="empezar" aria-labelledby="empezar-title" class="section">
      <div class="landing-container layout">
        <div class="layout__text">
          <app-section-intro [intro]="content().intro" titleId="empezar-title" />
          <ol class="steps">
            @for (step of content().steps; track $index) {
              <li class="step">
                <span class="step__number">{{ $index + 1 }}</span>
                <span>{{ step }}</span>
              </li>
            }
          </ol>
        </div>
        <app-photo-slot class="layout__photo" fill [photo]="content().photo" />
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .section {
      padding-block: 0 64px;
      scroll-margin-top: 72px;
    }

    .layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 40px;
    }

    .layout__text {
      min-width: 0;
    }

    .steps {
      margin: 32px 0 0;
      padding: 0;
      border-top: 1px solid var(--arc-border);
      list-style: none;
    }

    .step {
      display: flex;
      gap: 20px;
      padding-block: 16px;
      border-bottom: 1px solid var(--arc-border);
    }

    .step__number {
      flex: none;
      width: 24px;
      color: var(--arc-fill);
      font-weight: 600;
    }

    @media (min-width: 900px) {
      .section {
        padding-bottom: 112px;
      }

      // La foto se estira al alto de la columna de texto: arriba con el título, abajo con el paso 5.
      .layout {
        grid-template-columns: minmax(0, 6fr) minmax(0, 5fr);
        align-items: stretch;
        gap: 80px;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepsSection {
  readonly content = input.required<StepsContent>();
}
