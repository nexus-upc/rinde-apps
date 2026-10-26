import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Sobre de trazo fino y esquinas redondeadas, a juego con el símbolo de Rinde. */
@Component({
  selector: 'app-mail-icon',
  template: `
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2.75" y="4.75" width="18.5" height="14.5" rx="3.25" />
      <path d="m3.5 7.25 7.36 5.06a2 2 0 0 0 2.28 0l7.36-5.06" />
    </svg>
  `,
  host: { style: 'display: inline-flex' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MailIcon {}
