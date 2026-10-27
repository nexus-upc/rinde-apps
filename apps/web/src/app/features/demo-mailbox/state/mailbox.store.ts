import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { RequestAction } from '@core/async/request-action';
import { MailboxApi } from '../data-access/mailbox-api';
import { DemoMail, DemoMailDetail, MailPurpose } from '../models/mailbox.models';
@Injectable()
export class MailboxStore {
  private readonly api = inject(MailboxApi);
  private readonly destroy = inject(DestroyRef);
  readonly request = new RequestAction(this.destroy);
  readonly opening = new RequestAction(this.destroy);
  private readonly messagesState = signal<readonly DemoMail[]>([]);
  private readonly detailState = signal<DemoMailDetail | null>(null);
  private readonly selectedState = signal<string | null>(null);
  private readonly paginationState = signal({ page: 0, size: 20, total: 0 });
  private readonly readyState = signal(false);
  readonly messages = this.messagesState.asReadonly();
  readonly detail = this.detailState.asReadonly();
  readonly selected = this.selectedState.asReadonly();
  readonly pagination = this.paginationState.asReadonly();
  readonly ready = this.readyState.asReadonly();
  private search = '';
  private purpose: MailPurpose | '' = '';
  filter(search: string, purpose: MailPurpose | '') {
    if (this.request.pending() || this.opening.pending()) return;
    this.search = search.trim();
    this.purpose = purpose;
    this.close();
    this.load(0);
  }
  load(page = this.pagination().page) {
    if (this.request.pending() || this.opening.pending()) return;
    this.request.run(this.api.list(page, this.search, this.purpose), {
      onSuccess: (result) => {
        this.messagesState.set(result.items);
        const selected = this.selectedState();
        const detail = this.detailState();
        if (selected && detail) {
          const current = result.items.find((message) => message.id === selected);
          if (current)
            this.detailState.set({
              message: current,
              actionPath: current.state === 'ACTIVE' ? detail.actionPath : null,
            });
          else this.close();
        }
        this.paginationState.set({ page: result.page, size: result.size, total: result.total });
        this.readyState.set(true);
      },
      errorMessage: 'No se pudieron cargar los mensajes. Inténtalo de nuevo.',
    });
  }
  open(id: string) {
    if (this.opening.pending() || this.request.pending()) return;
    this.selectedState.set(id);
    this.detailState.set(null);
    this.opening.run(this.api.open(id), {
      onSuccess: (detail) => {
        this.detailState.set(detail);
        this.messagesState.update((rows) =>
          rows.map((row) => (row.id === id ? detail.message : row)),
        );
      },
      errorMessage: 'No se pudo abrir el mensaje. Inténtalo de nuevo.',
    });
  }
  close() {
    if (!this.opening.pending()) {
      this.selectedState.set(null);
      this.detailState.set(null);
      this.opening.clearError();
    }
  }
}
