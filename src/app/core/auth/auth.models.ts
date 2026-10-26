/** Credenciales que se envían a POST /api/v1/auth/sign-in. */
export interface SignInRequest {
  email: string;
  password: string;
}

/** Respuesta de IAM al iniciar sesión: el token y sus segundos de vigencia. */
export interface AuthenticationResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
}

/** Datos del usuario que el token lleva en sus claims. */
export interface SessionUser {
  email: string;
  role: string;
}

/** Nombres visibles de los roles que devuelve IAM. */
export const ROLE_LABELS: Readonly<Record<string, string>> = {
  ADMINISTRATOR: 'Administrador',
  OPERATIONS_MANAGER: 'Responsable de operaciones',
  DRIVER: 'Conductor',
};
