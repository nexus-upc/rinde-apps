/** Datos que pide POST /api/v1/tenants para registrar una empresa y su administrador. */
export interface RegisterTenantRequest {
  readonly tradeName: string;
  readonly ruc: string;
  readonly administratorFullName: string;
  readonly administratorEmail: string;
  readonly password: string;
}

export interface Tenant {
  readonly id: string;
  readonly tradeName: string;
  readonly ruc: string;
  readonly status: string;
}

export type UserRole = 'ADMINISTRATOR' | 'OPERATIONS_MANAGER' | 'DRIVER';
export type UserStatus = 'INVITED' | 'ACTIVE' | 'DISABLED';

export interface User {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
  readonly role: UserRole;
  readonly status: UserStatus;
}

/** Perfil del usuario con sesión, de GET /api/v1/users/me. */
export interface CurrentUser extends User {
  tenant: Tenant;
}

export interface InviteUserRequest {
  readonly fullName: string;
  readonly email: string;
  readonly role: UserRole;
}

export interface UpdateUserRequest {
  readonly role?: UserRole;
  readonly status?: UserStatus;
}

export const USER_STATUS_LABELS: Readonly<Record<string, string>> = {
  INVITED: 'Invitado',
  ACTIVE: 'Activo',
  DISABLED: 'Deshabilitado',
};

/** Roles que un administrador puede asignar al invitar o editar. */
export const ASSIGNABLE_ROLES: readonly UserRole[] = [
  'ADMINISTRATOR',
  'OPERATIONS_MANAGER',
  'DRIVER',
];
