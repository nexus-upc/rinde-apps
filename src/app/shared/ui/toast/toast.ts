import { ChangeDetectionStrategy, Component, Injectable, inject, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  text: string;
  tone: 'neutral' | 'danger';
}

/** Avisos breves que confirman una acción resuelta en el sitio, como en Arcadia. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  readonly messages = signal<ToastMessage[]>([]);

  show(text: string, tone: ToastMessage['tone'] = 'neutral'): void {
    const message = { id: this.nextId++, text, tone };
    this.messages.update((list) => [...list.slice(-2), message]);
    setTimeout(() => this.dismiss(message.id), 4000);
  }

  dismiss(id: number): void {
    this.messages.update((list) => list.filter((message) => message.id !== id));
  }
}

@Component({
  selector: 'app-toasts',
  template: `
    <div class="toasts" role="status" aria-live="polite">
      @for (message of toasts.messages(); track message.id) {
        <p class="toast" [class.toast--danger]="message.tone === 'danger'">{{ message.text }}</p>
      }
    </div>
  `,
  styles: `
    .toasts {
      position: fixed;
      bottom: 24px;
      left: 50%;
      z-index: 50;
      display: grid;
      justify-items: center;
      gap: 8px;
      transform: translateX(-50%);
      pointer-events: none;
    }
    .toast {
      margin: 0;
      padding: 12px 16px;
      border-radius: var(--arc-radius-pill);
      background: var(--arc-band);
      color: var(--arc-on-band);
      font-size: 14px;
      line-height: 20px;
      box-shadow: 0 8px 24px color-mix(in srgb, var(--arc-shadow) 18%, transparent);
      animation: toast-in var(--arc-dur-base) var(--arc-ease-emphasis) backwards;
    }
    .toast--danger {
      background: var(--arc-danger-bg);
      color: var(--arc-danger);
    }
    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .toast {
        animation: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toasts {
  protected readonly toasts = inject(ToastService);
}
