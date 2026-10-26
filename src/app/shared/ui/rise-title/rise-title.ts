import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Título de la entrada cuyas palabras suben y se enfocan una tras otra; quieto con movimiento reducido. */
@Component({
  selector: 'app-rise-title',
  template: `
    <h1 class="rise-title" [attr.id]="titleId()" [attr.aria-label]="text()">
      @for (word of words(); track $index) {
        <span class="arc-entrance-word" aria-hidden="true" [style.animation-delay.ms]="$index * 70">{{ word }}</span>{{ ' ' }}
      }
    </h1>
  `,
  styles: `
    .rise-title {
      font-size: var(--arc-entrance-title-size);
      font-weight: 600;
      line-height: var(--arc-entrance-title-line);
      letter-spacing: -0.02em;
      text-wrap: balance;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RiseTitle {
  readonly text = input.required<string>();
  readonly titleId = input<string | null>(null);
  protected readonly words = computed(() => this.text().split(' ').filter(Boolean));
}
