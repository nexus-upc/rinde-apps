import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SectionIntro as SectionIntroContent } from '../../models/landing-content.models';

/** Encabezado de una sección: etiqueta, título y párrafo introductorio. */
@Component({
  selector: 'app-section-intro',
  template: `
    <p class="eyebrow">{{ intro().eyebrow }}</p>
    <h2 class="title" [id]="titleId()">{{ intro().title }}</h2>
    <p class="lead">{{ intro().lead }}</p>
  `,
  styles: `
    :host {
      display: block;
      max-width: 680px;
    }

    .eyebrow {
      margin-bottom: 8px;
      color: var(--arc-fill);
      font-size: 14px;
      font-weight: 500;
      line-height: 20px;
    }

    .title {
      font-size: 26px;
      line-height: 32px;
      overflow-wrap: anywhere;
    }

    .lead {
      margin-top: 12px;
      color: var(--arc-muted);
      font-size: 16px;
      line-height: 24px;
    }

    @media (min-width: 768px) {
      .title {
        font-size: 32px;
        line-height: 38px;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionIntro {
  readonly intro = input.required<SectionIntroContent>();
  readonly titleId = input.required<string>();
}
