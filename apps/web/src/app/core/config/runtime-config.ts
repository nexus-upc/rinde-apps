/** Archivo de configuración que se genera al desplegar, junto a la aplicación. */
export const RUNTIME_CONFIG_PATH = 'config.json';

/** Devuelve la URL de la API sin barra final, o null si el valor no es válido. */
export function parseApiBaseUrl(value: unknown): string | null {
  if (typeof value !== 'object' || value === null || !('apiBaseUrl' in value)) return null;
  if (typeof value.apiBaseUrl !== 'string') return null;
  const normalized = value.apiBaseUrl.trim().replace(/\/+$/, '');
  try {
    const url = new URL(normalized);
    return url.protocol === 'https:' || url.protocol === 'http:' ? normalized : null;
  } catch {
    return null;
  }
}

/** Lee config.json sin caché; cualquier fallo devuelve null para que decida el arranque. */
export async function loadRuntimeConfig(fetcher: typeof fetch = fetch): Promise<string | null> {
  try {
    const response = await fetcher(RUNTIME_CONFIG_PATH, { cache: 'no-store' });
    if (!response.ok) return null;
    return parseApiBaseUrl(await response.json());
  } catch {
    return null;
  }
}

/** Muestra el aviso de configuración faltante en la página y lo registra en consola. */
export function showConfigurationError(doc: Document = document): void {
  console.error('No se pudo cargar config.json: falta o no es válido.');
  const message = doc.createElement('p');
  message.textContent =
    'No se encontró la configuración de la aplicación. Contacta al administrador.';
  doc.body.replaceChildren(message);
}
