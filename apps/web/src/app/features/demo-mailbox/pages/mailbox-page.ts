import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  Injector,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DemoModeService } from '@core/config/demo-mode.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatePanel } from '@shared/ui/state-panel/state-panel';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import { MailPurpose } from '../models/mailbox.models';
import { MailboxStore } from '../state/mailbox.store';
import { MailList, MailSelection } from '../ui/mail-list';
import { MailDetail } from '../ui/mail-detail';
@Component({
  selector: 'app-demo-mailbox-page',
  imports: [FormsModule, PageHeader, StatePanel, UiButton, MailList, MailDetail],
  providers: [MailboxStore],
  templateUrl: './mailbox-page.html',
  styleUrl: './mailbox-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MailboxPage {
  protected readonly mode = inject(DemoModeService);
  protected readonly store = inject(MailboxStore);
  protected readonly searchText = signal('');
  protected readonly purpose = signal<MailPurpose | ''>('');
  private readonly injector = inject(Injector);
  private trigger: HTMLButtonElement | null = null;
  constructor() {
    effect(() => {
      if (this.mode.ready() && this.mode.mailboxEnabled()) untracked(() => this.store.load(0));
    });
  }
  protected filter() {
    this.store.filter(this.searchText(), this.purpose());
  }
  protected open(value: MailSelection) {
    this.trigger = value.trigger;
    this.store.open(value.id);
  }
  protected close() {
    this.store.close();
    afterNextRender(() => this.trigger?.focus(), { injector: this.injector });
  }
}
