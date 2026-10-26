import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';

/** Página protegida provisional del tablero de viajes; el listado llega en la tarea S2-11. */
@Component({
  selector: 'app-trips-placeholder',
  templateUrl: './trips-placeholder.html',
  styleUrl: './trips-placeholder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TripsPlaceholder {
  private readonly auth = inject(AuthService);

  protected readonly user = this.auth.user;
  protected readonly roleLabel = this.auth.roleLabel;
}
