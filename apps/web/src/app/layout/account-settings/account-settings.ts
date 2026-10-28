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

type SectionId = 'profile' | 'security' | 'notices' | 'appearance' | 'company';

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
};

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
  readonly closed = output<void>();
  readonly signOut = output<void>();
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
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
    afterNextRender(() => this.dialog().nativeElement.showModal());
  }

  protected pick(id: SectionId): void {
    this.current.set(id);
  }

  /** Un clic sobre el fondo llega al propio dialog; dentro del panel llega a sus hijos. */
  protected onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.dialog().nativeElement.close();
  }
}

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}
