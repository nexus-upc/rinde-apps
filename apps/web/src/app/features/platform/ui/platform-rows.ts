import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
export interface DisplayRow {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly status: string;
  readonly facts: readonly { readonly label: string; readonly value: string }[];
  readonly action?: string;
}
export interface RowChoice {
  readonly id: string;
  readonly trigger: HTMLButtonElement;
}
@Component({
  selector: 'app-platform-rows',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="rows" role="list">
    @for (row of rows(); track row.id) {
      <article class="row" role="listitem">
        <div class="row__heading">
          <div>
            <h2>{{ row.title }}</h2>
            <p>{{ row.subtitle }}</p>
          </div>
          @if (row.status) {
            <span class="row__status">{{ row.status }}</span>
          }
        </div>
        <dl>
          @for (fact of row.facts; track fact.label) {
            <div>
              <dt>{{ fact.label }}</dt>
              <dd>{{ fact.value }}</dd>
            </div>
          }
        </dl>
        @if (row.action) {
          <button
            #trigger
            type="button"
            class="text-link"
            (click)="choose.emit({ id: row.id, trigger })"
            [disabled]="disabled()"
          >
            {{ row.action }}
          </button>
        }
      </article>
    }
  </div>`,
  styleUrl: './platform-rows.scss',
})
export class PlatformRows {
  readonly rows = input.required<readonly DisplayRow[]>();
  readonly disabled = input(false);
  readonly choose = output<RowChoice>();
}
