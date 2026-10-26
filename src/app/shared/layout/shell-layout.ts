import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

/** Marco de las pantallas protegidas: barra lateral, barra superior y contenido. */
@Component({
  selector: 'app-shell-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell-layout.html',
  styleUrl: './shell-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellLayout {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly user = this.auth.user;
  protected readonly roleLabel = this.auth.roleLabel;

  protected signOut(): void {
    this.auth.signOut();
    this.router.navigateByUrl('/sign-in');
  }
}
