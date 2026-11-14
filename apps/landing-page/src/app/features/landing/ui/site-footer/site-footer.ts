import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BrandMark } from '../../../../shared/brand/brand-mark/brand-mark';
import { FooterContent } from '../../models/landing-content.models';

/**
 * Pie de página: logo, frase y enlaces sobre el cielo; debajo, el valle andino animado sube por
 * detrás del texto y lleva la firma y el aviso sobre una franja oscura.
 */
@Component({
  selector: 'app-site-footer',
  imports: [BrandMark],
  template: `
    <footer class="footer">
      <div class="landing-container top">
        <div class="brand">
          <app-brand-mark [size]="38" />
          <p class="brand__tagline">{{ content().tagline }}</p>
        </div>
        <nav class="cols" aria-label="Enlaces del pie de página">
          @for (column of content().columns; track column.title) {
            <div>
              <h2 class="col__title">{{ column.title }}</h2>
              <ul class="col__links">
                @for (link of column.links; track link.href) {
                  <li>
                    <a class="col__link" [href]="link.href">{{ link.label }}</a>
                  </li>
                }
              </ul>
            </div>
          }
        </nav>
      </div>

      <div class="art">
        <img
          class="art__image"
          [src]="content().art.src"
          [alt]="content().art.alt"
          loading="lazy"
          decoding="async"
        />
        <div class="art__legal">
          <div class="landing-container legal">
            <p>© {{ year }} {{ content().signature }}</p>
            <p>{{ content().disclaimer }}</p>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: `
    :host {
      display: block;
    }

    .footer {
      overflow: hidden;
      background: var(--landing-wash);
    }

    .top {
      position: relative;
      z-index: 2;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 40px 48px;
      padding-block: 72px 40px;
    }

    .brand {
      max-width: 340px;
    }

    .brand__tagline {
      margin-top: 20px;
      color: #334155;
      font-size: 15px;
      line-height: 24px;
    }

    .cols {
      display: flex;
      flex-wrap: wrap;
      gap: 32px 72px;
    }

    .col__title {
      font-size: 14px;
      font-weight: 600;
      line-height: 20px;
    }

    .col__links {
      display: grid;
      margin: 10px 0 0;
      padding: 0;
      list-style: none;
    }

    .col__link {
      display: inline-flex;
      align-items: center;
      min-height: 36px;
      color: #334155;
      font-size: 15px;
      text-decoration: none;
    }

    @media (hover: hover) {
      .col__link:hover {
        color: var(--arc-fill);
      }
    }

    // El paisaje sube por detrás del texto; arriba se funde con el cielo y abajo se oscurece
    // para que la firma se lea en blanco.
    .art {
      position: relative;
      z-index: 0;
      margin-top: -13vw;
      aspect-ratio: 1896 / 830;
      min-height: 280px;

      &::before,
      &::after {
        position: absolute;
        right: 0;
        left: 0;
        z-index: 1;
        content: '';
        pointer-events: none;
      }

      &::before {
        top: 0;
        height: 32%;
        background: linear-gradient(180deg, var(--landing-wash) 10%, transparent);
      }

      &::after {
        bottom: 0;
        height: 160px;
        background: linear-gradient(0deg, rgb(15 23 42 / 55%), transparent);
      }
    }

    .art__image {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center bottom;
    }

    .art__legal {
      position: absolute;
      right: 0;
      bottom: 0;
      left: 0;
      z-index: 2;
      padding-bottom: 24px;
    }

    .legal {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 4px 24px;
      color: var(--arc-on-fill);
      font-size: 14px;
      line-height: 20px;
    }

    // Al llegar al final, el paisaje sube como un telón.
    @supports (animation-timeline: view()) {
      @media (prefers-reduced-motion: no-preference) {
        .art__image {
          animation: curtain-up linear both;
          animation-timeline: view();
          animation-range: entry 0% cover 60%;
        }
      }
    }

    @keyframes curtain-up {
      from {
        transform: translateY(16%) scale(1.06);
      }

      to {
        transform: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooter {
  readonly content = input.required<FooterContent>();
  protected readonly year = new Date().getFullYear();
}
