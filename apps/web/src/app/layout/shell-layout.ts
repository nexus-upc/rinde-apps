import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { ToastService } from '@core/feedback/toast.service';
import { SessionProfileStore } from '@features/iam/state/session-profile.store';
import { BrandMark } from '@shared/brand/brand-mark/brand-mark';

/** Composición del espacio de trabajo: sesión, navegación y pantallas de cada funcionalidad. */
@Component({
  selector: 'app-shell-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, BrandMark],
  templateUrl: './shell-layout.html',
  styleUrl: './shell-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellLayout {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);
  protected readonly user = this.auth.user;
  protected readonly roleLabel = this.auth.roleLabel;
  protected readonly isAdmin = computed(() => this.user()?.role === 'ADMINISTRATOR');
  protected readonly profile = inject(SessionProfileStore).profile;
  protected signOut(): void {
    this.auth.signOut();
    this.toasts.clear();
    void this.router.navigateByUrl('/sign-in');
  }
}
