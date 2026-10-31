import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { RequestAction } from '@core/async/request-action';
import { ROLE_LABELS } from '@core/auth/auth.models';
import { AuthService } from '@core/auth/auth.service';
import { DemoModeService } from '@core/config/demo-mode.service';
import { ToastService } from '@core/feedback/toast.service';
import { IamApi } from '../data-access/iam-api';
import { InviteUserRequest, UpdateUserRequest, User, UserRole } from '../models/iam.models';

/** Una instancia por página; concentra las consultas y las mutaciones de usuarios. */
@Injectable()
export class UsersStore {
  private readonly api = inject(IamApi);
  private readonly demoMode = inject(DemoModeService);
  private readonly auth = inject(AuthService);
  private readonly toasts = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly loadAction = new RequestAction(this.destroyRef);
  private readonly updateAction = new RequestAction(this.destroyRef);
  readonly inviteAction = new RequestAction(this.destroyRef);
  private readonly usersState = signal<readonly User[]>([]);
  private readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  private readonly invitingState = signal(false);
  private readonly busyIdState = signal<string | null>(null);
  readonly users = this.usersState.asReadonly();
  readonly state = this.loadState.asReadonly();
  readonly error = this.loadAction.error;
  readonly inviting = this.invitingState.asReadonly();
  readonly busyId = this.busyIdState.asReadonly();
  readonly currentEmail = computed(() => this.auth.user()?.email ?? '');
  readonly countLabel = computed(() =>
    this.usersState().length === 1 ? '1 usuario' : `${this.usersState().length} usuarios`,
  );

  load(): void {
    this.loadState.set('loading');
    this.loadAction.run(this.api.listUsers(), {
      onSuccess: (users) => {
        this.usersState.set(users);
        this.loadState.set('ready');
      },
      onError: () => this.loadState.set('error'),
      errorMessage: 'Revisa tu conexión e inténtalo otra vez.',
    });
  }
  openInvite(): void {
    this.inviteAction.clearError();
    this.invitingState.set(true);
  }
  closeInvite(): void {
    if (!this.inviteAction.pending()) this.invitingState.set(false);
  }
  invite(request: InviteUserRequest): void {
    this.inviteAction.run(this.api.inviteUser(request), {
      onSuccess: (user) => {
        this.usersState.update((users) => [...users, user]);
        this.invitingState.set(false);
        this.toasts.show(
          this.demoMode.mailboxEnabled()
            ? `Invitación preparada para ${user.email} en el buzón de demostración.`
            : `Invitación creada para ${user.email}.`,
        );
      },
      errorMessage: 'No se pudo enviar la invitación. Intente nuevamente.',
    });
  }
  changeRole(user: User, role: UserRole): void {
    if (role !== user.role)
      this.update(user, { role }, `${user.fullName} ahora es ${ROLE_LABELS[role] ?? role}.`);
  }
  disable(user: User): void {
    if (user.status === 'DISABLED') return;
    this.update(user, { status: 'DISABLED' }, `${user.fullName} ya no puede iniciar sesión.`);
  }
  private update(user: User, change: UpdateUserRequest, message: string): void {
    if (this.updateAction.pending()) return;
    this.busyIdState.set(user.id);
    this.updateAction.run(this.api.updateUser(user.id, change), {
      onSuccess: (updated) => {
        this.usersState.update((users) =>
          users.map((value) => (value.id === updated.id ? updated : value)),
        );
        this.busyIdState.set(null);
        this.toasts.show(message);
      },
      onError: (detail) => {
        this.busyIdState.set(null);
        this.toasts.show(detail, 'danger');
      },
      errorMessage: 'No se pudo actualizar el usuario.',
    });
  }
}
