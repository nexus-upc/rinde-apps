import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { filter, map } from 'rxjs';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { BrandMark } from '@shared/brand/brand-mark/brand-mark';
import { PlatformProfileStore } from '../features/platform/state/platform-profile.store';
@Component({
  selector: 'app-platform-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, BrandMark, FormsModule],
  providers: [PlatformProfileStore],
  template: `<div class="shell">
    <a class="shell__skip" href="#platform-content">Saltar al contenido</a>
    <aside class="shell__sidebar">
      <app-brand-mark class="shell__brand" />
      <nav class="shell__nav platform-nav" aria-label="Administración de Rinde">
        @for (item of links; track item.path) {
          <a
            class="shell__link arc-tap"
            [routerLink]="item.path"
            routerLinkActive="shell__link--active"
            [routerLinkActiveOptions]="{ exact: true }"
            ariaCurrentWhenActive="page"
            >{{ item.label }}</a
          >
        }
      </nav>
      <label class="platform-mobile" for="platform-navigation"
        >Administración de Rinde
        <select
          id="platform-navigation"
          class="field__input"
          [ngModel]="currentPath()"
          (ngModelChange)="navigate($event)"
        >
          @for (item of links; track item.path) {
            <option [value]="item.path">{{ item.label }}</option>
          }
        </select>
      </label>
    </aside>
    <div class="shell__main">
      <header class="shell__topbar">
        <div class="shell__session">
          <span class="shell__name">{{ profile.profile()?.fullName ?? auth.user()?.email }}</span
          ><span>Dueño de Rinde</span>
        </div>
        <button class="shell__signout text-link" type="button" (click)="signOut()">
          Cerrar sesión
        </button>
      </header>
      <main id="platform-content" class="shell__content" tabindex="-1"><router-outlet /></main>
    </div>
  </div>`,
  styleUrl: './platform-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlatformShell {
  protected readonly auth = inject(AuthService);
  protected readonly router = inject(Router);
  protected readonly currentPath = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects.split('?')[0] ?? '/platform'),
    ),
    { initialValue: this.router.url.split('?')[0] ?? '/platform' },
  );
  protected readonly profile = inject(PlatformProfileStore);
  protected readonly links = [
    { path: '/platform', label: 'Resumen' },
    { path: '/platform/companies', label: 'Empresas' },
    { path: '/platform/plans', label: 'Planes' },
    { path: '/platform/subscriptions', label: 'Suscripciones' },
    { path: '/platform/payments', label: 'Pagos de prueba' },
    { path: '/platform/audit', label: 'Auditoría' },
  ];
  constructor() {
    this.profile.load();
  }
  protected navigate(path: string) {
    void this.router.navigateByUrl(path);
  }
  protected signOut() {
    this.auth.signOut();
    void this.router.navigateByUrl('/platform/sign-in');
  }
}
