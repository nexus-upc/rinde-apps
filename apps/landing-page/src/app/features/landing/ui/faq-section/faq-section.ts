import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { FaqContent } from '../../models/landing-content.models';
import { SectionIntro } from '../section-intro/section-intro';

/** Acordeón de preguntas frecuentes: una sola respuesta abierta a la vez. */
@Component({
  selector: 'app-faq-section',
  imports: [SectionIntro],
  template: `
    <section id="preguntas" aria-labelledby="preguntas-title" class="section">
      <div class="landing-container">
        <app-section-intro [intro]="content().intro" titleId="preguntas-title" />

        <div class="faq">
          @for (item of content().items; track item.id) {
            <div class="faq__item" [class.is-open]="openId() === item.id">
              <h3 class="faq__heading">
                <button
                  type="button"
                  class="faq__trigger arc-tap"
                  [id]="'faq-trigger-' + item.id"
                  [attr.aria-expanded]="openId() === item.id"
                  [attr.aria-controls]="'faq-panel-' + item.id"
                  (click)="toggle(item.id)"
                >
                  <span class="faq__question">{{ item.question }}</span>
                  <span class="faq__chevron" aria-hidden="true"></span>
                </button>
              </h3>
              <div
                class="faq__panel"
                role="region"
                [id]="'faq-panel-' + item.id"
                [attr.aria-labelledby]="'faq-trigger-' + item.id"
                [hidden]="openId() !== item.id"
              >
                <p class="faq__answer">{{ item.answer }}</p>
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      background: var(--arc-surface-soft);
    }

    .section {
      padding-block: 56px;
      scroll-margin-top: 72px;
    }

    .faq {
      max-width: 800px;
      margin-top: 32px;
      border-top: 1px solid var(--arc-border);
    }

    .faq__item {
      border-bottom: 1px solid var(--arc-border);
    }

    .faq__heading {
      font-size: 16px;
      line-height: 24px;
    }

    .faq__trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      width: 100%;
      min-height: 56px;
      padding: 12px 0;
      border: 0;
      background: none;
      color: var(--arc-ink);
      font-size: 16px;
      font-weight: 500;
      line-height: 24px;
      text-align: left;
    }

    .faq__question {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    .faq__chevron {
      flex: none;
      width: 10px;
      height: 10px;
      margin-right: 4px;
      border-right: 2px solid var(--arc-muted);
      border-bottom: 2px solid var(--arc-muted);
      transform: rotate(45deg);
      transition: transform var(--arc-dur-base) var(--arc-ease-out);
    }

    .is-open .faq__chevron {
      transform: rotate(-135deg);
    }

    .faq__answer {
      padding: 0 32px 16px 0;
      color: var(--arc-muted);
      font-size: 16px;
      line-height: 24px;
    }

    @media (min-width: 768px) {
      .section {
        padding-block: 80px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .faq__chevron {
        transition: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqSection {
  readonly content = input.required<FaqContent>();
  protected readonly openId = signal<string | null>(null);

  protected toggle(id: string): void {
    this.openId.update((current) => (current === id ? null : id));
  }
}
