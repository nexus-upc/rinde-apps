import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { AutoFocus } from '@shared/forms/autofocus';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import { DemoMailDetail, MAIL_STATE_LABELS } from '../models/mailbox.models';
@Component({
  selector: 'app-demo-mail-detail',
  imports: [AutoFocus, UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<article class="mail-detail">
    <button class="text-link mail-detail__back" type="button" (click)="close.emit()">
      Volver a los mensajes
    </button>
    <header>
      <h2 appAutoFocus tabindex="-1">{{ mail().message.subject }}</h2>
      <p>{{ mail().message.companyName }}</p>
      <span class="mail-detail__state">{{ states[mail().message.state] }}</span>
    </header>
    <dl>
      <div>
        <dt>De</dt>
        <dd>Rinde, modo demostración</dd>
      </div>
      <div>
        <dt>Para</dt>
        <dd>{{ mail().message.recipient }}</dd>
      </div>
      <div>
        <dt>Creado</dt>
        <dd>{{ date(mail().message.createdAt) }}</dd>
      </div>
      <div>
        <dt>El enlace vence</dt>
        <dd>{{ date(mail().message.expiresAt) }}</dd>
      </div>
    </dl>
    <div class="mail-detail__body">
      <p>{{ greeting() }}</p>
      @switch (mail().message.purpose) {
        @case ('EMAIL_VERIFICATION') {
          <p>
            La cuenta de {{ mail().message.companyName }} está preparada. Confirma el correo para
            activar el acceso a tu empresa.
          </p>
        }
        @case ('INVITATION') {
          <p>
            Te han invitado a formar parte de {{ mail().message.companyName }}. Crea tu contraseña
            para aceptar la invitación e iniciar sesión.
          </p>
        }
        @case ('PASSWORD_RESET') {
          <p>
            Recibimos una solicitud para crear una contraseña nueva en
            {{ mail().message.companyName }}. Si no la solicitaste, puedes ignorar este mensaje.
          </p>
        }
      }
      @if (action(); as actionPath) {
        <a
          uiButton
          [href]="actionPath"
          target="_blank"
          rel="noopener noreferrer"
          referrerpolicy="no-referrer"
          >{{ actionLabel() }}</a
        >
        <p class="mail-detail__hint">
          Se abrirá en otra pestaña. El enlace solo se puede utilizar una vez.
        </p>
      } @else {
        <p class="mail-detail__notice" role="status">{{ unavailable() }}</p>
      }
    </div>
    <p class="mail-detail__footer">
      Mensaje de demostración guardado en Rinde. No se ha enviado a un servicio de correo externo.
    </p>
  </article>`,
  styleUrl: './mail-detail.scss',
})
export class MailDetail {
  readonly mail = input.required<DemoMailDetail>();
  readonly close = output<void>();
  protected readonly states = MAIL_STATE_LABELS;
  protected readonly greeting = computed(() =>
    this.mail().message.purpose === 'INVITATION'
      ? 'Hola, ' + this.mail().message.recipientName + '.'
      : 'Hola.',
  );
  protected readonly actionLabel = computed(
    () =>
      ({
        EMAIL_VERIFICATION: 'Verificar empresa',
        INVITATION: 'Aceptar invitación',
        PASSWORD_RESET: 'Crear nueva contraseña',
      })[this.mail().message.purpose],
  );
  protected readonly action = computed(() => {
    const value = this.mail().actionPath;
    if (!value || this.mail().message.state !== 'ACTIVE') return null;
    try {
      const url = new URL(value, 'https://rinde.invalid');
      return url.origin === 'https://rinde.invalid' &&
        ['/verify-email', '/accept-invitation', '/reset-password'].includes(url.pathname) &&
        url.searchParams.has('token')
        ? url.pathname + url.search
        : null;
    } catch {
      return null;
    }
  });
  protected readonly unavailable = computed(
    () =>
      ({
        USED: 'Este enlace ya se utilizó y no se puede reutilizar.',
        EXPIRED: 'El enlace venció. Solicita uno nuevo desde la pantalla de acceso.',
        INVALID: 'Este enlace ya no está disponible. Solicita uno nuevo.',
        ACTIVE: 'No se pudo preparar el enlace de este mensaje.',
      })[this.mail().message.state],
  );
  protected date(value: string) {
    return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(value),
    );
  }
}
