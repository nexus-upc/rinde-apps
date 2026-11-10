import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PhoneMockupContent } from '../../models/landing-content.models';

/** Maqueta de la pantalla "Registrar gasto" de la app Android, dibujada con HTML y CSS. */
@Component({
  selector: 'app-phone-mockup',
  template: `
    <div class="phone" role="img" [attr.aria-label]="content().ariaLabel">
      <div class="phone__screen" aria-hidden="true">
        <div class="bar">
          <span class="bar__back"></span>
          <span class="bar__title">{{ content().screenTitle }}</span>
        </div>
        <div class="field">
          <span class="field__label">{{ content().amountLabel }}</span>
          <span class="field__value field__value--amount">{{ content().amount }}</span>
        </div>
        <div class="field">
          <span class="field__label">{{ content().categoryLabel }}</span>
          <span class="field__value">{{ content().category }}</span>
        </div>
        <div class="field">
          <span class="field__label">{{ content().photoLabel }}</span>
          <span class="photo">
            <span class="photo__thumb"></span>
            <span class="photo__caption">{{ content().photoCaption }}</span>
          </span>
        </div>
        <span class="status">
          <span class="status__dot"></span>
          {{ content().statusLabel }}
        </span>
        <span class="action">{{ content().buttonLabel }}</span>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      max-width: 100%;
    }

    .phone {
      width: 280px;
      max-width: 100%;
      margin-inline: auto;
      padding: 10px;
      border-radius: 36px;
      background: var(--arc-ink);
      box-shadow: 0 20px 40px color-mix(in srgb, var(--arc-shadow) 22%, transparent);
    }

    .phone__screen {
      display: flex;
      flex-direction: column;
      gap: 14px;
      min-height: 480px;
      padding: 20px 16px;
      border-radius: 28px;
      background: var(--arc-bg);
      color: var(--arc-ink);
      font-size: 14px;
      line-height: 20px;
    }

    .bar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--arc-border);
    }

    .bar__back {
      width: 10px;
      height: 10px;
      border-bottom: 2px solid var(--arc-muted);
      border-left: 2px solid var(--arc-muted);
      transform: rotate(45deg);
    }

    .bar__title {
      font-size: 16px;
      font-weight: 600;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .field__label {
      color: var(--arc-subtle);
      font-size: 12px;
      line-height: 16px;
    }

    .field__value {
      padding: 10px 12px;
      border: 1px solid var(--arc-border-strong);
      border-radius: var(--arc-radius-control);
      background: var(--arc-surface-soft);
    }

    .field__value--amount {
      font-size: 20px;
      font-weight: 500;
      line-height: 24px;
    }

    .photo {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      border: 1px dashed var(--arc-border-strong);
      border-radius: var(--arc-radius-control);
    }

    .photo__thumb {
      flex: none;
      width: 48px;
      height: 48px;
      border-radius: 6px;
      background: linear-gradient(160deg, var(--arc-fill-soft), var(--arc-border-strong));
    }

    .photo__caption {
      color: var(--arc-muted);
    }

    .status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      align-self: flex-start;
      padding: 6px 12px;
      border-radius: var(--arc-radius-pill);
      background: var(--arc-wait-bg);
      color: var(--arc-wait);
      font-size: 13px;
      font-weight: 500;
    }

    .status__dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--arc-wait);
    }

    .action {
      margin-top: auto;
      padding: 12px;
      border-radius: var(--arc-radius-control);
      background: var(--arc-fill);
      color: var(--arc-on-fill);
      font-weight: 500;
      text-align: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhoneMockup {
  readonly content = input.required<PhoneMockupContent>();
}
