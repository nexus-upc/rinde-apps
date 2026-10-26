import { afterNextRender, ChangeDetectionStrategy, Component, computed, inject, Injector, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { ROLE_LABELS } from '../../../core/auth/auth.models';
import { problemMessage } from '../../../core/http/problem-message';
import { IamApi } from '../../../core/iam/iam-api';
import { ASSIGNABLE_ROLES, USER_STATUS_LABELS, User, UserRole } from '../../../core/iam/iam.models';
import { ToastService } from '../../../shared/ui/toast/toast';
import { UiButton } from '../../../shared/ui/ui-button/ui-button';

type LoadState = 'loading' | 'ready' | 'error';

/** Usuarios de la empresa (US11): invitar, cambiar el rol y deshabilitar, resuelto en el sitio. */
@Component({
  selector: 'app-users-page',
  imports: [ReactiveFormsModule, UiButton],
  templateUrl: './users-page.html',
  styleUrl: './users-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPage {
  private readonly iam = inject(IamApi);
  private readonly toasts = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly injector = inject(Injector);
  private readonly currentEmail = inject(AuthService).user()?.email ?? '';

  protected readonly roles = ASSIGNABLE_ROLES;
  protected readonly roleLabels = ROLE_LABELS;
  protected readonly statusLabels = USER_STATUS_LABELS;

  protected readonly state = signal<LoadState>('loading');
  protected readonly users = signal<User[]>([]);
  protected readonly busyId = signal<string | null>(null);
  protected readonly inviting = signal(false);
  protected readonly sending = signal(false);
  protected readonly inviteError = signal<string | null>(null);
  protected readonly countLabel = computed(() => {
    const total = this.users().length;
    return total === 1 ? '1 usuario' : `${total} usuarios`;
  });

  protected readonly inviteForm = this.fb.group({
    fullName: this.fb.control('', [Validators.required, Validators.maxLength(150)]),
    email: this.fb.control('', [Validators.required, Validators.email, Validators.maxLength(150)]),
    role: this.fb.control<UserRole>('DRIVER', [Validators.required]),
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.iam.listUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.state.set('ready');
      },
      error: () => this.state.set('error'),
    });
  }

  protected isSelf(user: User): boolean {
    return user.email.toLowerCase() === this.currentEmail.toLowerCase();
  }

  protected openInvite(): void {
    this.inviteForm.reset({ fullName: '', email: '', role: 'DRIVER' });
    this.inviteError.set(null);
    this.inviting.set(true);
    afterNextRender(() => document.getElementById('invite-name')?.focus(), { injector: this.injector });
  }

  protected closeInvite(): void {
    this.inviting.set(false);
  }

  protected sendInvite(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    const value = this.inviteForm.getRawValue();
    this.sending.set(true);
    this.inviteError.set(null);
    this.iam.inviteUser({ ...value, fullName: value.fullName.trim(), email: value.email.trim() }).subscribe({
      next: (user) => {
        this.sending.set(false);
        this.inviting.set(false);
        this.users.update((list) => [...list, user]);
        this.toasts.show(`Invitación enviada a ${user.email}.`);
      },
      error: (error: unknown) => {
        this.sending.set(false);
        this.inviteError.set(problemMessage(error, 'No se pudo enviar la invitación. Intente nuevamente.'));
      },
    });
  }

  protected changeRole(user: User, role: string): void {
    if (role === user.role) {
      return;
    }
    this.update(user, { role: role as UserRole }, `${user.fullName} ahora es ${ROLE_LABELS[role] ?? role}.`);
  }

  protected toggleStatus(user: User): void {
    const disabling = user.status !== 'DISABLED';
    this.update(
      user,
      { status: disabling ? 'DISABLED' : 'ACTIVE' },
      disabling ? `${user.fullName} ya no puede iniciar sesión.` : `${user.fullName} puede iniciar sesión de nuevo.`,
    );
  }

  protected isInvalid(name: 'fullName' | 'email'): boolean {
    const control = this.inviteForm.controls[name];
    return control.touched && control.invalid;
  }

  private update(user: User, change: Parameters<IamApi['updateUser']>[1], success: string): void {
    this.busyId.set(user.id);
    this.iam.updateUser(user.id, change).subscribe({
      next: (updated) => {
        this.busyId.set(null);
        this.users.update((list) => list.map((item) => (item.id === updated.id ? updated : item)));
        this.toasts.show(success);
      },
      error: (error: unknown) => {
        this.busyId.set(null);
        // Se vuelve a dibujar la fila para que el selector muestre el rol que sigue vigente.
        this.users.update((list) => [...list]);
        this.toasts.show(problemMessage(error, 'No se pudo actualizar el usuario.'), 'danger');
      },
    });
  }
}
