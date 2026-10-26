/** Datos que pide POST /api/v1/tenants para registrar una empresa y su administrador. */
export interface RegisterTenantRequest {
  tradeName: string;
  ruc: string;
  administratorFullName: string;
  administratorEmail: string;
  password: string;
}

export interface Tenant {
  id: string;
  tradeName: string;
  ruc: string;
  status: string;
}

export type UserRole = 'ADMINISTRATOR' | 'OPERATIONS_MANAGER' | 'DRIVER';
export type UserStatus = 'INVITED' | 'ACTIVE' | 'DISABLED';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

/** Perfil del usuario con sesión, de GET /api/v1/users/me. */
export interface CurrentUser extends User {
  tenant: Tenant;
}

export interface InviteUserRequest {
  fullName: string;
  email: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  role?: UserRole;
  status?: UserStatus;
}

export const USER_STATUS_LABELS: Readonly<Record<string, string>> = {
  INVITED: 'Invitado',
  ACTIVE: 'Activo',
  DISABLED: 'Deshabilitado',
};

/** Roles que un administrador puede asignar al invitar o editar. */
export const ASSIGNABLE_ROLES: readonly UserRole[] = ['ADMINISTRATOR', 'OPERATIONS_MANAGER', 'DRIVER'];
