import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Marco de edición del perfil del usuario dentro de ajustes de cuenta (S4-28). */
@Component({
  selector: 'app-account-profile-section',
  template: `<section class="account-section" aria-labelledby="account-profile-title">
    <h3 id="account-profile-title" class="account-section__title">Editar perfil</h3>
    <p class="account-section__note">
      @if (fullName()) {
        Nombre actual: {{ fullName() }}. La edición del nombre estará disponible próximamente.
      } @else {
        La edición del nombre estará disponible próximamente.
      }
    </p>
  </section>`,
  styles: `
    .account-section {
      display: grid;
      gap: 6px;
      padding: 16px 18px;
      border-radius: var(--arc-radius-row);
      background: var(--arc-surface-soft);
    }

    .account-section__title {
      margin: 0;
      color: var(--arc-ink);
      font-size: 15px;
      font-weight: 600;
      line-height: 20px;
    }

    .account-section__note {
      margin: 0;
      color: var(--arc-muted);
      font-size: 13px;
      line-height: 18px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountProfileSection {
  readonly fullName = input('');
}
