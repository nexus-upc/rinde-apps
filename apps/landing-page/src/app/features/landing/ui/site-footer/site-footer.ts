import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BrandMark } from '../../../../shared/brand/brand-mark/brand-mark';
import { FooterContent, NavLink } from '../../models/landing-content.models';

/** Pie de página: logo en tono mono, firma, año y enlaces a las secciones. */
@Component({
  selector: 'app-site-footer',
  imports: [BrandMark],
  template: `
    <footer class="footer">
      <div class="landing-container footer__inner">
        <div class="footer__brand">
          <app-brand-mark [size]="24" tone="mono" />
          <p class="footer__tagline">{{ content().tagline }}</p>
        </div>
        <nav aria-label="Secciones del pie de página">
          <ul class="footer__links">
            @for (link of links(); track link.href) {
              <li>
                <a class="footer__link" [href]="link.href">{{ link.label }}</a>
              </li>
            }
          </ul>
        </nav>
      </div>
      <div class="landing-container footer__legal">
        <p>{{ content().signature }} · {{ year }}</p>
      </div>
    </footer>
  `,
  styles: `
    :host {
      display: block;
    }

    .footer {
      padding-block: 40px 24px;
      background: var(--arc-ink);
      color: var(--arc-border);
    }

    .footer__inner {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .footer__brand {
      display: flex;
      flex-direction: column;
      gap: 12px;
      color: var(--arc-on-fill);
    }

    .footer__tagline {
      max-width: 360px;
      color: var(--arc-faint);
      font-size: 14px;
      line-height: 20px;
    }

    .footer__links {
      display: flex;
      flex-wrap: wrap;
      gap: 0 16px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .footer__link {
      display: inline-flex;
      align-items: center;
      min-height: 44px;
      color: var(--arc-border);
      font-size: 16px;
      text-decoration: none;
    }

    .footer__legal {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--arc-muted);
      color: var(--arc-faint);
      font-size: 14px;
    }

    @media (hover: hover) {
      .footer__link:hover {
        color: var(--arc-on-fill);
      }
    }

    @media (min-width: 768px) {
      .footer__inner {
        flex-direction: row;
        align-items: flex-start;
        justify-content: space-between;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooter {
  readonly content = input.required<FooterContent>();
  readonly links = input.required<readonly NavLink[]>();
  protected readonly year = new Date().getFullYear();
}
