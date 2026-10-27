import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Cabecera compartida; cada pantalla proyecta sus acciones y conserva su contenido. */
@Component({
  selector: 'app-page-header',
  template: `<header class="page-header">
    <div>
      <div class="page-header__heading">
        <h1 [attr.id]="titleId()">{{ title() }}</h1>
        @if (count()) {
          <span class="page-header__count">{{ count() }}</span>
        }
      </div>
      @if (description()) {
        <p>{{ description() }}</p>
      }
    </div>
    <ng-content />
  </header>`,
  styles: `
    :host {
      display: block;
    }
    .page-header {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 16px;
    }
    .page-header__heading {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 12px;
    }
    h1 {
      margin: 0;
      font-size: var(--arc-page-title-size);
      font-weight: 600;
      line-height: var(--arc-page-title-line);
      letter-spacing: -0.02em;
    }
    p {
      margin: 8px 0 0;
      color: var(--arc-muted);
    }
    .page-header__count {
      color: var(--arc-muted);
      font-variant-numeric: tabular-nums;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly titleId = input<string | null>(null);
  readonly description = input('');
  readonly count = input('');
}
