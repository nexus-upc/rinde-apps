import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Marco de consulta y edición del perfil de empresa dentro de ajustes (S4-28). */
@Component({
  selector: 'app-company-profile-section',
  template: `<section class="account-section" aria-labelledby="account-company-title">
    <h3 id="account-company-title" class="account-section__title">Datos de la empresa</h3>
    <p class="account-section__note">
      @if (canEdit()) {
        La consulta y edición del nombre comercial, teléfono y dirección estarán disponibles próximamente.
      } @else {
        La consulta de los datos registrados de la empresa estará disponible próximamente.
      }
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
export class CompanyProfileSection {
  readonly canEdit = input(false);
}
