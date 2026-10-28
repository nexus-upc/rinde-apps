import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CurrentUser } from '@features/iam/models/iam.models';
import { SHELL_ICONS, ShellIcon, initialsOf } from '../shell-icons';

type SectionId = 'profile' | 'security' | 'notices' | 'appearance' | 'company' | 'about';

interface Section {
  readonly label: string;
  readonly icon: ShellIcon;
  /** Las secciones con texto todavía no tienen pantalla y lo muestran como adelanto. */
  readonly soon?: string;
}

const SECTIONS: Record<SectionId, Section> = {
  profile: { label: 'Perfil', icon: 'person' },
  security: {
    label: 'Seguridad',
    icon: 'lock',
    soon: 'Podrás cambiar tu contraseña sin salir de Rinde. Mientras tanto, usa la recuperación desde la pantalla de acceso.',
  },
  notices: {
    label: 'Avisos',
    icon: 'bell',
    soon: 'Elegirás qué avisos recibir: asignaciones, vencimientos y gastos por revisar.',
  },
  appearance: {
    label: 'Apariencia',
    icon: 'palette',
    soon: 'Tema claro u oscuro y tamaño del texto.',
  },
  company: {
    label: 'Empresa',
    icon: 'company',
    soon: 'Los datos de tu empresa, su plan y sus usuarios, en un solo lugar.',
  },
  about: { label: 'Acerca de Rinde', icon: 'info' },
};

const MORPH_MS = 380;
const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

const GROUPS: readonly { label: string; items: readonly SectionId[] }[] = [
  { label: 'Tu cuenta', items: ['profile', 'security'] },
  { label: 'Preferencias', items: ['notices', 'appearance'] },
  { label: 'Organización', items: ['company'] },
];

const STATUS_LABELS: Readonly<Record<string, string>> = {
  ACTIVE: 'Activa',
  INVITED: 'Invitación pendiente',
  DISABLED: 'Deshabilitada',
  PENDING_VERIFICATION: 'Por verificar',
  SUSPENDED: 'Suspendida',
};

/** Ajustes de la cuenta como ventana modal: el perfil sale de IAM y el resto se anuncia como próximo. */
@Component({
  selector: 'app-account-settings',
  templateUrl: './account-settings.html',
  styleUrl: './account-settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSettings {
  readonly profile = input<CurrentUser | null>(null);
  readonly email = input('');
  readonly roleLabel = input('');
  /** Lo que se pulsó para abrir y a dónde vuelve al cerrar; sin ellos, crece desde el centro. */
  readonly openFrom = input<DOMRect | null>(null);
  readonly closeTo = input<(() => HTMLElement | null) | null>(null);
  readonly closed = output<void>();
  readonly signOut = output<void>();
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly rail = viewChild.required<ElementRef<HTMLElement>>('rail');
  private readonly thumb = viewChild.required<ElementRef<HTMLElement>>('thumb');
  private closing = false;
  protected readonly icons = SHELL_ICONS;
  protected readonly sections = SECTIONS;
  protected readonly groups = GROUPS;
  protected readonly current = signal<SectionId>('profile');
  protected readonly section = computed(() => SECTIONS[this.current()]);
  protected readonly initials = computed(() => initialsOf(this.profile()?.fullName, this.email()));
  protected readonly facts = computed(() => {
    const profile = this.profile();
    if (!profile) return [];
    return [
      { label: 'Rol', value: this.roleLabel() },
      { label: 'Estado de la cuenta', value: statusLabel(profile.status) },
      { label: 'Empresa', value: profile.tenant.tradeName },
      { label: 'RUC', value: profile.tenant.ruc },
      { label: 'Estado de la empresa', value: statusLabel(profile.tenant.status) },
    ];
  });

  constructor() {
    afterNextRender(() => {
      const dialog = this.dialog().nativeElement;
      dialog.showModal();
      this.placeThumb(false);
      this.morph(dialog, this.openFrom(), false);
    });
  }

  protected pick(id: SectionId): void {
    this.current.set(id);
    requestAnimationFrame(() => this.placeThumb(true));
  }

  /** Un clic sobre el fondo llega al propio dialog; dentro del panel llega a sus hijos. */
  protected onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  /** Esc también regresa al botón de cuenta en lugar de cerrarse de golpe. */
  protected onCancel(event: Event): void {
    event.preventDefault();
    this.close();
  }

  protected close(): void {
    if (this.closing) return;
    this.closing = true;
    const dialog = this.dialog().nativeElement;
    const target = this.closeTo()?.()?.getBoundingClientRect() ?? null;
    const animation = this.morph(dialog, target, true);
    if (!animation) {
      dialog.close();
      return;
    }
    const finish = () => dialog.close();
    animation.finished.then(finish, finish);
  }

  /** El gris de la sección elegida es una píldora que se desliza hasta ella. */
  private placeThumb(animate: boolean): void {
    const current = this.rail().nativeElement.querySelector<HTMLElement>(
      '.settings__tab.is-current',
    );
    const thumb = this.thumb().nativeElement;
    thumb.classList.toggle('is-moving', animate && !reducedMotion());
    thumb.style.opacity = current ? '1' : '0';
    if (!current) return;
    thumb.style.transform = `translateY(${current.offsetTop}px)`;
    thumb.style.height = `${current.offsetHeight}px`;
  }

  /**
   * La ventana crece desde el botón pulsado, o vuelve a él al cerrar, recortando su contorno.
   * El contenido no se deforma: solo cambia lo que deja ver el recorte.
   */
  private morph(dialog: HTMLElement, from: DOMRect | null, reverse: boolean): Animation | null {
    if (reducedMotion() || typeof dialog.animate !== 'function') return null;
    const box = dialog.getBoundingClientRect();
    const start = from
      ? `inset(${from.top - box.top}px ${box.right - from.right}px ${box.bottom - from.bottom}px ${from.left - box.left}px round 12px)`
      : `inset(${box.height / 2 - 40}px ${box.width / 2 - 80}px round 24px)`;
    const frames: Keyframe[] = [
      { clipPath: start, opacity: from ? 1 : 0 },
      { clipPath: 'inset(0 0 0 0 round 24px)', opacity: 1 },
    ];
    return dialog.animate(reverse ? frames.reverse() : frames, {
      duration: reverse ? MORPH_MS - 80 : MORPH_MS,
      easing: EASE,
      fill: reverse ? 'forwards' : 'none',
    });
  }
}

function reducedMotion(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}
