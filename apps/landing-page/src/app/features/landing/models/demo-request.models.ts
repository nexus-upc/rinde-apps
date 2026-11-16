export interface DemoRequest {
  readonly fullName: string;
  readonly companyName: string;
  readonly email: string;
  readonly phone?: string;
  readonly fleetSize: number;
  readonly message?: string;
}

export interface DemoRequestReceipt {
  readonly id: string;
  readonly status: string;
  readonly receivedAt: string;
}

export type DemoRequestField = keyof DemoRequest;

export type DemoRequestFieldErrors = Readonly<Partial<Record<DemoRequestField, string>>>;
