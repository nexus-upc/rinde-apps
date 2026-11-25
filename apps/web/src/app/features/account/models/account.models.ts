export type CompanyProfileStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED';

export type AccountUserRole = 'ADMINISTRATOR' | 'OPERATIONS_MANAGER' | 'DRIVER';

export type AccountUserStatus = 'INVITED' | 'ACTIVE' | 'DISABLED';

/** Perfil de empresa devuelto por GET y PATCH /api/v1/tenants/current (contrato C7). */
export interface CompanyProfile {
  readonly id: string;
  readonly tradeName: string;
  readonly ruc: string;
  readonly status: CompanyProfileStatus;
  readonly phone: string | null;
  readonly address: string | null;
}

export interface UpdateCompanyProfileRequest {
  readonly tradeName?: string;
  readonly phone?: string | null;
  readonly address?: string | null;
}

export interface AccountTenantSummary {
  readonly id: string;
  readonly tradeName: string;
  readonly ruc: string;
  readonly status: CompanyProfileStatus;
}

/** Perfil del usuario devuelto por PATCH /api/v1/users/me (contrato C7). */
export interface AccountUserProfile {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
  readonly role: AccountUserRole;
  readonly status: AccountUserStatus;
  readonly tenant: AccountTenantSummary;
}

export interface UpdateAccountProfileRequest {
  readonly fullName: string;
}

export interface ChangePasswordRequest {
  readonly currentPassword: string;
  readonly newPassword: string;
}
