# RINDE Landing Page

Landing pública de RINDE (US01 a US07). Es una aplicación Angular independiente dentro del
workspace `rinde-landing-page`, con la misma configuración, tokens y reglas de arquitectura de `apps/web`.

## Uso

Desde la raíz de `rinde-apps`:

- `npm ci`
- `npm start --workspace=rinde-landing-page`: abre la landing en http://localhost:4300.
- `npm run check --workspace=rinde-landing-page`: arquitectura, pruebas y build de producción, en ese orden.

El formulario de demostración envía `POST /api/v1/public/demo-requests` al gateway
(`http://localhost:8000`, configurable en `src/environments/environment.ts`). El resto de la página es contenido.

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
| US01 Propuesta de valor | `ui/hero-section` |
| US02 Funcionalidades para operaciones | `ui/features-section` |
| US03 Funcionalidades para el conductor | `ui/driver-section`, `ui/phone-mockup` |
| US04 Navegación por secciones | `ui/site-header` |
| US05 Preguntas frecuentes | `ui/faq-section` |
| US06 Solicitud de demostración | `ui/demo-request-form`, `state`, `data-access` |
| US07 Diseño adaptable | Estilos de cada componente y `.landing-container` |

Los planes muestran nombre y límite de unidades. Los precios quedan como "Precio mensual por definir"
hasta que el equipo los fije.
