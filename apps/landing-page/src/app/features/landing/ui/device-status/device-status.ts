import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Cámara perforada y barra de estado de Android: hora, señal (0 a 3 rayas), wifi y batería. */
@Component({
  selector: 'app-device-status',
  template: `
    <span class="device__punch"></span>
    <div class="device__status">
      <span>{{ time() }}</span>
      <span class="device__icons">
        <svg width="14" height="12" viewBox="0 0 14 12" focusable="false">
          <path d="M1 11h2V8H1z" [attr.fill]="bar(1)" />
          <path d="M5 11h2V6H5z" [attr.fill]="bar(2)" />
          <path d="M9 11h2V3H9z" [attr.fill]="bar(3)" />
          <path d="M12 11h1V1h-1z" fill="#94a3b8" />
        </svg>
        @if (wifi()) {
          <svg width="14" height="12" viewBox="0 0 14 12" focusable="false">
            <path d="M7 11L0.5 3.5A10 10 0 0 1 13.5 3.5z" fill="currentColor" />
          </svg>
        }
        <svg width="22" height="12" viewBox="0 0 22 12" focusable="false">
          <rect x="0.5" y="0.5" width="18" height="11" rx="3" fill="none" stroke="currentColor" />
          <rect x="2.5" y="2.5" [attr.width]="battery()" height="7" rx="1.5" fill="currentColor" />
          <rect x="19.5" y="4" width="2" height="4" rx="1" fill="currentColor" />
        </svg>
      </span>
    </div>
  `,
  styles: `
    :host {
      display: contents;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceStatus {
  readonly time = input.required<string>();
  readonly signal = input(3);
  readonly wifi = input(true);
  /** Ancho de la carga de la batería, de 1 a 14. */
  readonly battery = input(11);

  protected bar(level: number): string {
    return this.signal() >= level ? 'currentColor' : '#94a3b8';
  }
}
