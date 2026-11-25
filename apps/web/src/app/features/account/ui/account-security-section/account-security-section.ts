import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Marco de cambio de contraseña dentro de ajustes de cuenta (S4-28). */
@Component({
  selector: 'app-account-security-section',
  template: `<section class="account-section" aria-labelledby="account-security-title">
    <h3 id="account-security-title" class="account-section__title">Cambio de contraseña</h3>
    <p class="account-section__note">
      Podrás actualizar tu contraseña actual desde esta sección en la siguiente iteración.
    </p>
  </section>`,
  styles: `
    .account-section {
      display: grid;
      gap: 8px;
      padding: 20px;
      border-radius: var(--arc-radius-row);
      background: var(--arc-surface-soft);
    }

    .account-section__title {
      margin: 0;
      color: var(--arc-ink);
      font-size: 16px;
      font-weight: 600;
      line-height: 24px;
    }

    .account-section__note {
      margin: 0;
      color: var(--arc-muted);
      font-size: 14px;
      line-height: 20px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSecuritySection {}
