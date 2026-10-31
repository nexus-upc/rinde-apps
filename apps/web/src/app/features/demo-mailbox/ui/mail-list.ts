import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DemoMail, MAIL_PURPOSE_LABELS, MAIL_STATE_LABELS } from '../models/mailbox.models';
export interface MailSelection {
  readonly id: string;
  readonly trigger: HTMLButtonElement;
}
@Component({
  selector: 'app-demo-mail-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ul class="mail-list" aria-label="Mensajes">
    @for (mail of messages(); track mail.id) {
      <li>
        <button
          #trigger
          type="button"
          class="mail-row"
          [class.is-selected]="selected() === mail.id"
          [class.is-unread]="!mail.readAt"
          [attr.aria-pressed]="selected() === mail.id"
          [disabled]="disabled()"
          (click)="choose.emit({ id: mail.id, trigger })"
        >
          <span class="mail-row__type"
            >{{ purposes[mail.purpose] }}
            @if (!mail.readAt) {
              <span class="mail-row__unread">Sin leer</span>
            }
          </span>
          <span class="mail-row__subject">{{ mail.subject }}</span>
          <span class="mail-row__recipient">{{ mail.recipient }}</span>
          <span class="mail-row__meta"
            ><span>{{ states[mail.state] }}</span
            ><time>{{ date(mail.createdAt) }}</time></span
          >
        </button>
      </li>
    }
  </ul>`,
  styleUrl: './mail-list.scss',
})
export class MailList {
  readonly messages = input.required<readonly DemoMail[]>();
  readonly selected = input<string | null>(null);
  readonly disabled = input(false);
  readonly choose = output<MailSelection>();
  protected readonly purposes = MAIL_PURPOSE_LABELS;
  protected readonly states = MAIL_STATE_LABELS;
  protected date(value: string) {
    return new Intl.DateTimeFormat('es-PE', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }
}
