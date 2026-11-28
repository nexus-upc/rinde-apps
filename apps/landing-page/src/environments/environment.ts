/** Configuración del entorno local. La API se consume a través del gateway de RINDE. */
export const environment = {
  apiBaseUrl: 'http://localhost:8000',
  /** Desarrollo: sin config.json se usa apiBaseUrl. */
  requireRuntimeConfig: false,
};
