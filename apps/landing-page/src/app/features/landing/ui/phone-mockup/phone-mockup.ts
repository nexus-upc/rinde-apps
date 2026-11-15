import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PhoneMockupContent } from '../../models/landing-content.models';
import { DeviceStatus } from '../device-status/device-status';

/** Pantalla "Registrar gasto" de la app Android, dentro de un marco de teléfono real. */
@Component({
  selector: 'app-phone-mockup',
  imports: [DeviceStatus],
  template: `
    <div class="device phone" role="img" [attr.aria-label]="content().ariaLabel">
      <span class="device__btn device__btn--power"></span>
      <span class="device__btn device__btn--volume"></span>
      <div class="device__bezel">
        <div class="device__screen screen" aria-hidden="true">
          <app-device-status time="11:08" [signal]="1" [wifi]="false" [battery]="7" />
          <div class="body">
            <span class="bar">{{ content().screenTitle }}</span>
            <span class="field">
              <span class="field__label">{{ content().amountLabel }}</span>
              <span class="field__value field__value--amount">{{ content().amount }}</span>
            </span>
            <span class="field">
              <span class="field__label">{{ content().categoryLabel }}</span>
              <span class="field__value">{{ content().category }}</span>
            </span>
            <span class="photo">
              <span class="photo__thumb"></span>
              <span class="photo__caption">{{ content().photoCaption }}</span>
            </span>
            <span class="status">{{ content().statusLabel }}</span>
            <span class="action">{{ content().buttonLabel }}</span>
          </div>
          <span class="device__nav"></span>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      max-width: 100%;
    }

    .phone {
      width: 278px;
      max-width: 100%;
      margin-inline: auto;
    }

    .screen {
      min-height: 540px;
      font-size: 14px;
      line-height: 20px;
    }

    .body {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 14px;
      padding: 8px 16px 0;
    }

    .bar {
      padding-bottom: 12px;
      border-bottom: 1px solid var(--arc-border);
      font-size: 17px;
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
      width: 44px;
      height: 44px;
      border-radius: 6px;
      background: #dbeafe;
    }

    .photo__caption {
      color: var(--arc-muted);
    }

    .status {
      align-self: flex-start;
      padding: 6px 12px;
      border-radius: var(--arc-radius-pill);
      background: var(--arc-fill-soft);
      color: var(--arc-fill);
      font-size: 13px;
      font-weight: 500;
    }

    .action {
      margin-top: auto;
      padding: 12px;
      border-radius: 10px;
      background: var(--arc-ink);
      color: var(--arc-on-fill);
      font-weight: 500;
      text-align: center;
    }

    // Al entrar en pantalla, el teléfono se endereza.
    @supports (animation-timeline: view()) {
      @media (prefers-reduced-motion: no-preference) {
        .phone {
          animation: phone-settle linear both;
          animation-timeline: view();
          animation-range: entry 0% cover 50%;
        }
      }
    }

    @keyframes phone-settle {
      from {
        opacity: 0.3;
        transform: translateY(80px) rotate(-8deg);
      }

      to {
        opacity: 1;
        transform: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhoneMockup {
  readonly content = input.required<PhoneMockupContent>();
}
