import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type StatusBadgeTone = 'neutral' | 'success' | 'wait' | 'danger';

/** Etiqueta de estado con texto obligatorio y par de color de los tokens. */
@Component({
  selector: 'app-status-badge',
  template: `<span class="status-badge" [class]="'status-badge status-badge--' + tone()">{{
    label()
  }}</span>`,
  styles: `
    :host {
      display: inline-flex;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 2px 10px;
      border-radius: var(--arc-radius-control);
      font-size: 12px;
      font-weight: 500;
      line-height: 16px;
      white-space: nowrap;
    }

    .status-badge--neutral {
      background: var(--arc-surface);
      color: var(--arc-muted);
    }

    .status-badge--success {
      background: var(--arc-success-bg);
      color: var(--arc-success);
    }

    .status-badge--wait {
      background: var(--arc-wait-bg);
      color: var(--arc-wait);
    }

    .status-badge--danger {
      background: var(--arc-danger-bg);
      color: var(--arc-danger);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadge {
  readonly tone = input<StatusBadgeTone>('neutral');
  readonly label = input.required<string>();
}
