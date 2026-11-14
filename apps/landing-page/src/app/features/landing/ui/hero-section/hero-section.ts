import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UiButton } from '../../../../shared/ui/ui-button/ui-button';
import { HeroContent } from '../../models/landing-content.models';
import { HeroVisual } from '../hero-visual/hero-visual';

/** Portada: propuesta de valor a la izquierda y la app del conductor a la derecha. */
@Component({
  selector: 'app-hero-section',
  imports: [UiButton, HeroVisual],
  template: `
    <section id="inicio" aria-labelledby="inicio-title" class="hero">
      <div class="landing-container hero__inner">
        <div class="hero__text">
          <h1 id="inicio-title" class="hero__title">{{ content().title }}</h1>
          <p class="hero__subtitle">{{ content().subtitle }}</p>
          <div class="hero__actions">
            <a uiButton class="landing-cta hero__cta" [href]="content().cta.href">
              {{ content().cta.label }}
            </a>
            <a class="hero__secondary" [href]="content().secondary.href">
              {{ content().secondary.label }}
            </a>
          </div>
        </div>
        <app-hero-visual [phone]="content().phone" [badge]="content().badge" />
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .hero {
      overflow: hidden;
      padding-block: 32px 0;
      scroll-margin-top: 72px;
      background: var(--landing-wash);
    }

    .hero__inner {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 36px;
    }

    .hero__text {
      min-width: 0;
    }

    .hero__title {
      max-width: 15ch;
      font-size: 38px;
      font-weight: 500;
      line-height: 42px;
      letter-spacing: -0.03em;
      overflow-wrap: anywhere;
    }

    .hero__subtitle {
      max-width: 44ch;
      margin-top: 20px;
      color: var(--arc-muted);
      font-size: 17px;
      line-height: 27px;
    }

    .hero__actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px 24px;
      margin-top: 28px;
    }

    .hero__cta {
      min-height: 48px;
      padding-inline: 24px;
      font-size: 16px;
    }

    .hero__secondary {
      display: inline-flex;
      align-items: center;
      min-height: 44px;
      color: var(--arc-ink);
      font-size: 16px;
      font-weight: 500;
      text-decoration: underline;
      text-decoration-color: var(--arc-border-strong);
      text-decoration-thickness: 1.5px;
      text-underline-offset: 5px;
    }

    @media (hover: hover) {
      .hero__secondary:hover {
        text-decoration-color: var(--arc-ink);
      }
    }

    // Al bajar, el texto de la portada se desvanece hacia arriba; el teléfono usa la misma línea.
    @supports (animation-timeline: view()) {
      .hero {
        view-timeline-name: --hero;
      }

      @media (prefers-reduced-motion: no-preference) {
        .hero__text {
          animation: hero-copy-out linear both;
          animation-timeline: --hero;
          animation-range: exit 0% exit 80%;
        }
      }
    }

    @keyframes hero-copy-out {
      to {
        opacity: 0.15;
        transform: translateY(-60px);
      }
    }

    @media (min-width: 900px) {
      .hero {
        padding-top: 24px;
      }

      .hero__inner {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        align-items: center;
        gap: 24px;
        min-height: 600px;
      }

      .hero__title {
        font-size: 56px;
        line-height: 60px;
      }

      .hero__subtitle {
        font-size: 18px;
        line-height: 28px;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroSection {
  readonly content = input.required<HeroContent>();
}
