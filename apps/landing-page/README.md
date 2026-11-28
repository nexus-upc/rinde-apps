# RINDE Landing Page

Landing pública de RINDE (US01 a US07). Es una aplicación Angular independiente dentro del
workspace `rinde-landing-page`, con la misma configuración, tokens y reglas de arquitectura de `apps/web`.

## Uso

Desde la raíz de `rinde-apps`:

- `npm ci`
- `npm start --workspace=rinde-landing-page`: abre la landing en http://localhost:4300.
- `npm run check --workspace=rinde-landing-page`: arquitectura, pruebas y build de producción, en ese orden.

El formulario de demostración envía `POST /api/v1/public/demo-requests` al gateway
(`http://localhost:8000` en desarrollo, según `src/environments/environment.ts`; en producción la URL llega en `config.json`, ver «Despliegue en Azure Static Web Apps»). El resto de la página es contenido.

## Estructura

| Carpeta | Contenido |
|---|---|
| `src/app/features/landing/models` | Tipos del contenido y de la solicitud de demostración. |
| `src/app/features/landing/data-access` | Cliente HTTP de la solicitud de demostración. |
| `src/app/features/landing/state` | Estado del envío: pendiente, enviado y errores por campo. |
| `src/app/features/landing/pages` | Página única y sus textos (`landing-content.ts`). |
| `src/app/features/landing/ui` | Encabezado, secciones, planes, preguntas frecuentes, formulario y pie. |
| `src/app/shared` | Copias de `brand-mark`, `ui-button` y `field-errors` de `apps/web`. |

## Historias

| Historia | Dónde |
|---|---|
| US01 Propuesta de valor | `ui/hero-section`, `ui/hero-visual` |
| US02 Funcionalidades para operaciones | `ui/about-section`, `ui/features-section` |
| US03 Funcionalidades para el conductor | `ui/driver-section`, `ui/phone-mockup` |
| US04 Navegación por secciones | `ui/site-header`, `ui/site-footer` |
| US05 Preguntas frecuentes | `ui/faq-section` |
| US06 Solicitud de demostración | `ui/demo-request-form`, `state`, `data-access` |
| US07 Diseño adaptable | Estilos de cada componente y `.landing-container` |

Los planes (Chasqui, Qhapaq y Apu) muestran nombre y límite de unidades. El precio queda como
"Por definir" hasta que el equipo lo fije.

## Diseño

- Teléfonos: la interfaz Android es simulada; el marco (`.device` en `styles.scss`) imita un teléfono
  Android real, con cámara perforada, botones, barra de estado (`ui/device-status`) y barra de gestos.
- Animaciones ligadas al scroll con CSS `animation-timeline`: encabezado, portada, títulos, fotos,
  planes, teléfono de conductores y pie. Solo en navegadores que lo soportan y sin movimiento reducido;
  en los demás la página queda estática.

## Imágenes

Generadas con IA y convertidas a WebP en `public/images/`. Si falta un archivo, `ui/photo-slot`
muestra un recuadro neutro con la misma proporción.

| Archivo | Dónde |
|---|---|
| `about-office.webp` | Lo que hoy está repartido |
| `ops-trips.webp`, `ops-expenses.webp`, `ops-settlements.webp` | Funcionalidades |
| `route-banner.webp` | Banner entre secciones |
| `steps-driver.webp` | Cómo empezar |
| `footer-andes.webp` | Pie (WebP animado en bucle) |

## Despliegue en Azure Static Web Apps

1. Compilar la aplicación: `npm run build`. La salida queda en `dist/rinde-landing-page/browser`.
2. Generar la configuración con la URL del gateway: `RINDE_API_BASE_URL=https://<gateway> npm run config:runtime`.
   En PowerShell: `$env:RINDE_API_BASE_URL = "https://<gateway>"; npm run config:runtime`. Sin la variable, o con una URL que no sea https (salvo localhost o 127.0.0.1), el comando termina con error.
3. Publicar la carpeta `dist/rinde-landing-page/browser` en Azure Static Web Apps.

`config.json` contiene solo `apiBaseUrl`. Se genera en la carpeta de salida, no se versiona (está en `.gitignore`) y no debe tener secretos. `public/staticwebapp.config.json` viaja con la compilación: define el respaldo de rutas, las cabeceras de seguridad y la política `no-store` de `config.json`.
