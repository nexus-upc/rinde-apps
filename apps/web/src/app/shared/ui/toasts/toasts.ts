import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ToastMessage } from '../../feedback/toast-message';

/** Vista de avisos sin acceso a servicios ni estado global. */
@Component({
  selector: 'app-toasts',
  templateUrl: './toasts.html',
  styleUrl: './toasts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toasts {
  readonly messages = input<readonly ToastMessage[]>([]);
}
