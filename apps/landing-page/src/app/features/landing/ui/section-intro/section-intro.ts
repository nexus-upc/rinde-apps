import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SectionIntro as SectionIntroContent } from '../../models/landing-content.models';

/** Encabezado de una sección: título y párrafo introductorio, alineados a la izquierda o al centro. */
@Component({
  selector: 'app-section-intro',
  template: `
    <h2 class="landing-title scroll-rise" [id]="titleId()">{{ intro().title }}</h2>
    <p class="lead">{{ intro().lead }}</p>
  `,
  styles: `
    :host {
      display: block;
      max-width: 640px;
    }

    :host(.is-centered) {
      margin-inline: auto;
      text-align: center;
    }

    .lead {
      margin-top: 14px;
      color: var(--arc-muted);
      font-size: 17px;
      line-height: 27px;
    }
  `,
  host: { '[class.is-centered]': 'centered()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionIntro {
  readonly intro = input.required<SectionIntroContent>();
  readonly titleId = input.required<string>();
  readonly centered = input(false, { transform: booleanAttribute });
}
