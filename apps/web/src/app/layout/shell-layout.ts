import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { ToastService } from '@core/feedback/toast.service';
import { SessionProfileStore } from '@features/iam/state/session-profile.store';
import { BrandMark } from '@shared/brand/brand-mark/brand-mark';
import { AccountSettings } from './account-settings/account-settings';
import { SHELL_ICONS, ShellIcon, initialsOf } from './shell-icons';

interface NavItem {
  readonly label: string;
  readonly icon: ShellIcon;
  /** Sin ruta, la sección todavía no existe y se muestra como "Pronto". */
  readonly path?: string;
}

interface NavGroup {
  readonly label: string;
  readonly items: readonly NavItem[];
}

const OPERATION: NavGroup = {
  label: 'Operación',
  items: [
    { label: 'Flota', icon: 'fleet' },
    { label: 'Conductores', icon: 'person' },
    { label: 'Liquidaciones', icon: 'settlements' },
    { label: 'Incidencias', icon: 'incidents' },
  ],
};

/** Composición del espacio de trabajo: menú lateral, cuenta y pantallas de cada funcionalidad. */
@Component({
  selector: 'app-shell-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, BrandMark, AccountSettings],
  templateUrl: './shell-layout.html',
  styleUrl: './shell-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'onKeydown($event)' },
})
export class ShellLayout {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);
  private readonly accountButton = viewChild<ElementRef<HTMLButtonElement>>('accountButton');
  protected readonly icons = SHELL_ICONS;
  protected readonly user = this.auth.user;
  protected readonly roleLabel = this.auth.roleLabel;
  protected readonly profile = inject(SessionProfileStore).profile;
  protected readonly menuOpen = signal(false);
  protected readonly settingsOpen = signal(false);
  /** Ajustes crece desde la opción pulsada y vuelve al botón de cuenta al cerrar. */
  protected readonly settingsFrom = signal<DOMRect | null>(null);
  protected readonly accountElement = () => this.accountButton()?.nativeElement ?? null;
  protected readonly initials = computed(() =>
    initialsOf(this.profile()?.fullName, this.user()?.email),
  );
  protected readonly groups = computed<readonly NavGroup[]>(() => {
    const today: NavGroup = {
      label: 'Hoy',
      items: [
        { label: 'Inicio', icon: 'home', path: '/home' },
        { label: 'Viajes', icon: 'trips', path: '/trips' },
        { label: 'Gastos', icon: 'expenses', path: '/expenses' },
      ],
    };
    if (this.user()?.role !== 'ADMINISTRATOR') return [today, OPERATION];
    return [
      today,
      OPERATION,
      {
        label: 'Empresa',
        items: [
          { label: 'Usuarios', icon: 'users', path: '/users' },
          { label: 'Suscripción', icon: 'subscription', path: '/subscription' },
        ],
      },
    ];
  });

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(returnFocus = false): void {
    this.menuOpen.set(false);
    if (returnFocus) this.accountButton()?.nativeElement.focus();
  }

  protected openSettings(event?: Event): void {
    const pressed = event?.currentTarget as HTMLElement | undefined;
    this.settingsFrom.set(
      pressed?.getBoundingClientRect() ??
        this.accountButton()?.nativeElement.getBoundingClientRect() ??
        null,
    );
    this.menuOpen.set(false);
    this.settingsOpen.set(true);
  }

  protected closeSettings(): void {
    this.settingsOpen.set(false);
    this.accountButton()?.nativeElement.focus();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.menuOpen()) {
      this.closeMenu(true);
    } else if (event.key === ',' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.openSettings();
    }
  }

  protected signOut(): void {
    this.menuOpen.set(false);
    this.settingsOpen.set(false);
    this.auth.signOut();
    this.toasts.clear();
    void this.router.navigateByUrl('/sign-in');
  }
}
