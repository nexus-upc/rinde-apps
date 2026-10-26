import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

export type UiButtonVariant = 'primary' | 'secondary' | 'ghost';

/** Botón píldora de Arcadia. Mientras carga conserva su ancho y muestra un aro en lugar del texto. */
@Component({
  selector: 'button[uiButton], a[uiButton]',
  template: `
    <span class="ui-button__label"><ng-content /></span>
    @if (loading()) {
      <span class="ui-button__spinner" aria-hidden="true"></span>
    }
  `,
  host: {
    class: 'ui-button arc-tap',
    '[class.ui-button--primary]': "variant() === 'primary'",
    '[class.ui-button--secondary]': "variant() === 'secondary'",
    '[class.ui-button--ghost]': "variant() === 'ghost'",
    '[class.ui-button--block]': 'block()',
    '[class.is-loading]': 'loading()',
    '[attr.aria-busy]': 'loading() || null',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiButton {
  readonly variant = input<UiButtonVariant>('primary');
  readonly block = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
}
