import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-demo-mail-notice',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@if (enabled()) {
    <aside class="demo-mail-notice" aria-label="Correo de demostración">
      <p>
        En este entorno, los correos se consultan en un buzón de demostración. Solo el operador de
        Rinde puede abrirlos.
      </p>
      <a class="text-link" routerLink="/platform/mailbox" target="_blank" rel="noopener noreferrer"
        >Abrir buzón como operador</a
      >
    </aside>
  }`,
  styles: `
    .demo-mail-notice {
      display: grid;
      gap: 8px;
      margin-top: 24px;
      color: var(--arc-muted);
      max-width: 65ch;
      font-size: 14px;
      line-height: 20px;
    }
    .text-link {
      display: inline-flex;
      align-items: center;
      justify-self: start;
      min-height: 44px;
    }
  `,
})
export class DemoMailNotice {
  readonly enabled = input(false);
}
