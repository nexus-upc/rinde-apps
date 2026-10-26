import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  viewChild,
} from '@angular/core';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatePanel } from '@shared/ui/state-panel/state-panel';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import { UsersStore } from '../../state/users.store';
import { InviteUserForm } from '../../ui/invite-user-form/invite-user-form';
import { UserList } from '../../ui/user-list/user-list';

/** Contenedor de usuarios: compone las vistas y delega el estado al servicio local. */
@Component({
  selector: 'app-users-page',
  providers: [UsersStore],
  imports: [PageHeader, StatePanel, UiButton, InviteUserForm, UserList],
  templateUrl: './users-page.html',
  styleUrl: './users-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPage {
  protected readonly store = inject(UsersStore);
  private readonly trigger = viewChild<UiButton, ElementRef<HTMLButtonElement>>('inviteTrigger', {
    read: ElementRef,
  });
  private readonly injector = inject(Injector);
  constructor() {
    this.store.load();
  }
  protected closeInvite(): void {
    this.store.closeInvite();
    afterNextRender(() => this.trigger()?.nativeElement.focus(), { injector: this.injector });
  }
}
