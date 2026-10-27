export type MailPurpose = 'EMAIL_VERIFICATION' | 'INVITATION' | 'PASSWORD_RESET';
export type MailState = 'ACTIVE' | 'USED' | 'EXPIRED' | 'INVALID';
export interface DemoMail {
  readonly id: string;
  readonly recipient: string;
  readonly recipientName: string;
  readonly companyName: string;
  readonly purpose: MailPurpose;
  readonly subject: string;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly readAt: string | null;
  readonly state: MailState;
}
export interface DemoMailDetail {
  readonly message: DemoMail;
  readonly actionPath: string | null;
}
export interface MailPage {
  readonly items: readonly DemoMail[];
  readonly page: number;
  readonly size: number;
  readonly total: number;
}
export const MAIL_STATE_LABELS: Readonly<Record<MailState, string>> = {
  ACTIVE: 'Enlace disponible',
  USED: 'Enlace utilizado',
  EXPIRED: 'Enlace vencido',
  INVALID: 'Enlace no disponible',
};
export const MAIL_PURPOSE_LABELS: Readonly<Record<MailPurpose, string>> = {
  EMAIL_VERIFICATION: 'Verificación',
  INVITATION: 'Invitación',
  PASSWORD_RESET: 'Recuperación',
};
