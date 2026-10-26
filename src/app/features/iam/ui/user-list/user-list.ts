import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ROLE_LABELS } from '@core/auth/auth.models';
import { ASSIGNABLE_ROLES, USER_STATUS_LABELS, User, UserRole } from '../../models/iam.models';

/** Lista de presentación. Los cambios se comunican al contenedor mediante eventos tipados. */
@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserList {
  readonly users = input<readonly User[]>([]);
  readonly currentEmail = input('');
  readonly busyId = input<string | null>(null);
  readonly loading = input(false);
  readonly roleChange = output<{ user: User; role: UserRole }>();
  readonly statusToggle = output<User>();
  protected readonly roles = ASSIGNABLE_ROLES;
  protected readonly roleLabels = ROLE_LABELS;
  protected readonly statusLabels = USER_STATUS_LABELS;
  protected isSelf(user: User): boolean {
    return user.email.toLowerCase() === this.currentEmail().toLowerCase();
  }
  protected changeRole(user: User, event: Event): void {
    const value = event.target instanceof HTMLSelectElement ? event.target.value : '';
    const role = this.roles.find((role) => role === value);
    if (role && event.target instanceof HTMLSelectElement) {
      event.target.value = user.role;
      this.roleChange.emit({ user, role });
    }
  }
}
