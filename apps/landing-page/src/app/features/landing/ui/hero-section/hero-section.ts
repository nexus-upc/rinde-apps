import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UiButton } from '../../../../shared/ui/ui-button/ui-button';
import { HeroContent } from '../../models/landing-content.models';

/** Sección principal: propuesta de valor y llamado a la acción. */
@Component({
  selector: 'app-hero-section',
  imports: [UiButton],
  template: `
    <section id="inicio" aria-labelledby="inicio-title" class="hero">
      <div class="landing-container hero__inner arc-entrance-stage">
        <p class="hero__eyebrow">{{ content().eyebrow }}</p>
        <h1 id="inicio-title" class="hero__title">{{ content().title }}</h1>
        <p class="hero__subtitle">{{ content().subtitle }}</p>
        <div class="hero__actions">
          <a uiButton class="hero__cta" [href]="content().cta.href">{{ content().cta.label }}</a>
        </div>
        <ul class="hero__highlights">
          @for (item of content().highlights; track item) {
            <li>{{ item }}</li>
          }
        </ul>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .hero {
      position: relative;
      padding-block: 40px 48px;
      scroll-margin-top: 72px;
      background: linear-gradient(180deg, var(--arc-fill-soft), var(--arc-bg) 70%);

      // Acento de marca: una franja fina con el degradado, única aparición en la página.
      &::before {
        position: absolute;
        top: 0;
        right: 0;
        left: 0;
        height: 3px;
        background: var(--arc-brand-gradient);
        content: '';
      }
    }

    .hero__inner {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
      max-width: 1120px;
    }

    .hero__eyebrow {
      color: var(--arc-fill);
      font-size: 14px;
      font-weight: 500;
      line-height: 20px;
    }

    .hero__title {
      max-width: 760px;
      font-size: 32px;
      line-height: 38px;
      overflow-wrap: anywhere;
    }

    .hero__subtitle {
      max-width: 640px;
      color: var(--arc-muted);
      font-size: 16px;
      line-height: 26px;
    }

    .hero__actions {
      margin-top: 8px;
    }

    .hero__cta {
      min-height: 48px;
      padding-inline: 24px;
      font-size: 16px;
    }

    .hero__highlights {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 8px 0 0;
      padding: 0;
      list-style: none;

      li {
        padding: 4px 12px;
        border: 1px solid var(--arc-border);
        border-radius: var(--arc-radius-pill);
        background: var(--arc-card);
        color: var(--arc-muted);
        font-size: 14px;
        line-height: 20px;
      }
    }

    @media (min-width: 768px) {
      .hero {
        padding-block: 96px 104px;
      }

      .hero__inner {
        gap: 20px;
      }

      .hero__title {
        font-size: 48px;
        line-height: 54px;
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
