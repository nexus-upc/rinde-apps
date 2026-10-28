import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { WorkspaceTransition } from '@core/loading/workspace-transition';
import { AccessLayout } from '@shared/access/access-layout/access-layout';
import { AutoFocus } from '@shared/forms/autofocus';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import { PlatformAccessStore } from '../state/platform-access.store';
import { revealErrors, showError } from '@shared/forms/field-errors';
@Component({
  selector: 'app-platform-sign-in',
  imports: [ReactiveFormsModule, RouterLink, AccessLayout, AutoFocus, UiButton],
  providers: [PlatformAccessStore],
  template: `<app-access-layout
    ><div class="platform-access">
      <h1>Administración de Rinde</h1>
      <p>Accede al espacio de gestión de la plataforma.</p>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="field">
          <label class="field__label" for="owner-email">Correo</label
          ><input
            appAutoFocus
            id="owner-email"
            class="field__input"
            type="email"
            formControlName="email"
            autocomplete="username"
            maxlength="150"
            [attr.aria-invalid]="bad('email') || null"
            [attr.aria-describedby]="bad('email') ? 'owner-email-error' : null"
          />
          @if (bad('email')) {
            <p class="field__error" id="owner-email-error">Ingresa un correo válido.</p>
          }
        </div>
        <div class="field">
          <label class="field__label" for="owner-password">Contraseña</label
          ><input
            id="owner-password"
            class="field__input"
            type="password"
            formControlName="password"
            autocomplete="current-password"
            maxlength="72"
            [attr.aria-invalid]="bad('password') || null"
            [attr.aria-describedby]="bad('password') ? 'owner-password-error' : null"
          />
          @if (bad('password')) {
            <p class="field__error" id="owner-password-error">Ingresa tu contraseña.</p>
          }
        </div>
        @if (store.request.error()) {
          <p role="alert" class="field__error">{{ store.request.error() }}</p>
        }
        <button
          uiButton
          block
          type="submit"
          [loading]="store.request.pending()"
          [disabled]="store.request.pending()"
        >
          Ingresar a Rinde
        </button>
      </form>
      <a class="text-link" routerLink="/sign-in">Ir al acceso de empresas</a>
    </div></app-access-layout
  >`,
  styles: `
    .platform-access {
      display: grid;
      gap: 24px;
    }
    h1 {
      font-size: var(--arc-entrance-title-size);
      line-height: var(--arc-entrance-title-line);
      font-weight: 600;
      letter-spacing: -0.02em;
    }
    p {
      color: var(--arc-muted);
    }
    form {
      display: grid;
      gap: 24px;
    }
    .text-link {
      display: inline-flex;
      align-items: center;
      min-height: 44px;
      justify-self: start;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlatformSignIn {
  protected readonly store = inject(PlatformAccessStore);
  private readonly transition = inject(WorkspaceTransition);
  private readonly returnUrl = inject(ActivatedRoute).snapshot.queryParamMap.get('returnUrl');
  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    password: ['', [Validators.required, Validators.maxLength(72)]],
  });
  protected bad(field: 'email' | 'password') {
    return showError(this.form.controls[field]);
  }
  protected submit() {
    if (this.form.invalid) {
      revealErrors(this.form);
      return;
    }
    this.store.signIn(
      this.form.getRawValue(),
      () =>
        void this.transition.enter(
          this.returnUrl === '/platform/mailbox' ? '/platform/mailbox' : '/platform',
        ),
    );
  }
}
