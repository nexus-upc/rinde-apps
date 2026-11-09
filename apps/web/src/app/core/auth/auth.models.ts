/** Credenciales que se envían a POST /api/v1/auth/sign-in. */
export interface SignInRequest {
  readonly email: string;
  readonly password: string;
}

/** Respuesta de IAM al iniciar sesión: el token y sus segundos de vigencia. */
export interface AuthenticationResponse {
  readonly accessToken: string;
  readonly tokenType: string;
  readonly expiresInSeconds: number;
}

/** Datos del usuario que el token lleva en sus claims. */
export interface SessionUser {
  readonly scope: 'TENANT' | 'PLATFORM';
  readonly email: string;
  readonly role: string;
}

/** Nombres visibles de los roles que devuelve IAM. */
export const ROLE_LABELS: Readonly<Record<string, string>> = {
  PLATFORM_OWNER: 'Dueño de Rinde',
  ADMINISTRATOR: 'Administrador',
  OPERATIONS_MANAGER: 'Responsable de operaciones',
  DRIVER: 'Conductor',
};

/** Roles de empresa que ven y abren flota, conductores, liquidaciones e incidencias. */
export const OPERATION_ROLES: readonly string[] = ['ADMINISTRATOR', 'OPERATIONS_MANAGER'];
