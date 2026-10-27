export interface ToastMessage {
  readonly id: number;
  readonly text: string;
  readonly tone: 'neutral' | 'danger';
}
