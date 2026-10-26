import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { ToastMessage } from '@shared/feedback/toast-message';

/** Cola global acotada de avisos. La vista no puede modificar su estado directamente. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  private readonly state = signal<readonly ToastMessage[]>([]);
  readonly messages = this.state.asReadonly();
  constructor() {
    inject(DestroyRef).onDestroy(() => this.clear());
  }
  show(text: string, tone: ToastMessage['tone'] = 'neutral'): void {
    while (this.state().length >= 3) {
      const oldest = this.state()[0];
      if (oldest) this.dismiss(oldest.id);
    }
    const message: ToastMessage = { id: this.nextId++, text, tone };
    this.state.update((messages) => [...messages, message]);
    this.timers.set(
      message.id,
      setTimeout(() => this.dismiss(message.id), 4000),
    );
  }
  dismiss(id: number): void {
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
    this.state.update((messages) => messages.filter((message) => message.id !== id));
  }
  clear(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this.state.set([]);
  }
}
