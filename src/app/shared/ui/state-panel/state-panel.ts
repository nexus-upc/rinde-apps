import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UiButton } from '../ui-button/ui-button';

/** Vacío o error recuperable. El icono y el contenido pertenecen a quien compone la pantalla. */
@Component({
  selector: 'app-state-panel',
  imports: [UiButton],
  template: `<div class="state-panel" [attr.role]="error() ? 'alert' : 'status'">
    <span class="state-panel__disc" aria-hidden="true"><ng-content /></span>
    <h2>{{ title() }}</h2>
    <p>{{ message() }}</p>
    @if (actionLabel()) {
      <button uiButton variant="secondary" type="button" (click)="action.emit()">
        {{ actionLabel() }}
      </button>
    }
  </div>`,
  styles: `
    :host {
      display: flex;
      flex: 1;
      min-height: 240px;
    }
    .state-panel {
      display: flex;
      flex: 1;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      text-align: center;
    }
    .state-panel__disc {
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--arc-surface);
    }
    .state-panel__disc:empty {
      display: none;
    }
    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      line-height: 24px;
    }
    p {
      margin: 0;
      max-width: 60ch;
      color: var(--arc-muted);
      overflow-wrap: anywhere;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatePanel {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly actionLabel = input('');
  readonly error = input(false);
  readonly action = output<void>();
}
