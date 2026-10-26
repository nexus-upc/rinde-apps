/** Claims del payload del JWT que usa la interfaz. */
export interface TokenClaims {
  email?: string;
  role?: string;
  exp?: number;
}

/**
 * Lee el payload del JWT sin verificar la firma: solo sirve para mostrar datos.
 * La verificación la hacen el gateway y los servicios.
 */
export function readTokenClaims(token: string): TokenClaims | null {
  const payload = token.split('.')[1];
  if (!payload) {
    return null;
  }
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const utf8 = Array.from(atob(padded), (char) => '%' + char.charCodeAt(0).toString(16).padStart(2, '0'));
    return JSON.parse(decodeURIComponent(utf8.join(''))) as TokenClaims;
  } catch {
    return null;
  }
}
