import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { IamApi } from '../../core/iam/iam-api';
import { CurrentUser } from '../../core/iam/iam.models';
import { BrandMark } from '../brand/brand-mark/brand-mark';
import { Toasts } from '../ui/toast/toast';

/** Marco de las pantallas protegidas: barra lateral, barra superior y contenido. */
@Component({
  selector: 'app-shell-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, BrandMark, Toasts],
  templateUrl: './shell-layout.html',
  styleUrl: './shell-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellLayout {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly user = this.auth.user;
  protected readonly roleLabel = this.auth.roleLabel;
  protected readonly isAdmin = computed(() => this.user()?.role === 'ADMINISTRATOR');
  /** Nombre y empresa de GET /users/me; mientras llegan se muestra el correo del token. */
  protected readonly profile = signal<CurrentUser | null>(null);

  constructor() {
    inject(IamApi)
      .currentUser()
      .subscribe({ next: (profile) => this.profile.set(profile), error: () => this.profile.set(null) });
  }

  protected signOut(): void {
    this.auth.signOut();
    this.router.navigateByUrl('/sign-in');
  }
}
