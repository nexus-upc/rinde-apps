# rinde-web

Aplicación web de RINDE by NEXUS para el administrador y el responsable de operaciones. Consume la API a través del gateway (`rinde-gateway`, puerto 8000). Está hecha con Angular 22, componentes standalone y SCSS.

Incluye registro, verificación de correo, inicio de sesión, recuperación de contraseña e invitaciones
(de US08 a US11), administración de usuarios y la pantalla de suscripción (de US38 a US40).
La página "Tablero de viajes" es provisional y se completa en la tarea S2-11.

## Requisitos

- Node.js 22.22.3 o superior de la rama 22, 24.15.0 o superior de la rama 24, o 26 o superior (lo que exige Angular 22). El desarrollo se hizo con Node.js 26.12.1 y npm 11.
- Angular CLI 22. Puede instalarse de forma global con `npm install -g @angular/cli@22` o usarse con `npx ng`.
- El gateway en `http://localhost:8000` para que el ingreso funcione. El gateway necesita `rinde-iam-service` en el puerto 8081.

## Instalación

```
npm install
```

## Ejecución

Con el gateway en marcha, levantar la aplicación:

```
ng serve
```

La aplicación queda en `http://localhost:4200`. El gateway debe permitir ese origen en `CORS_ALLOWED_ORIGINS`, que por defecto ya lo hace.

La dirección de la API está en `src/environments/environment.ts` (`apiBaseUrl`, por defecto `http://localhost:8000`).

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm start` o `ng serve` | Servidor de desarrollo en el puerto 4200. |
| `npm run build` o `ng build` | Compilación de producción en `dist/rinde-web`. |
| `npm run watch` | Compilación en modo desarrollo, vigilando los cambios. |
| `npm test` o `ng test --watch=false` | Pruebas unitarias con Vitest. No necesitan navegador. |

## Estructura

```
src/
  environments/        Dirección de la API.
  app/
    core/auth/         AuthService, interceptor HTTP, guard de sesión y lectura de los claims del JWT.
    features/auth/     Registro, acceso, verificación, recuperación e invitaciones.
    features/users/    Administración de usuarios.
    features/subscriptions/  Planes, vigencia y checkout simulado.
    features/trips/    Tablero de viajes provisional (protegido).
    shared/layout/     Marco de la aplicación: barra lateral, barra superior y cierre de sesión.
    app.routes.ts      Rutas públicas y protegidas.
```

## Sesión

- Al ingresar, `POST /api/v1/auth/sign-in` devuelve `accessToken`. El token se guarda en `sessionStorage` bajo la clave `rinde.accessToken`, así que la sesión dura lo que dura la pestaña.
- El interceptor agrega `Authorization: Bearer <token>` a las peticiones dirigidas a `apiBaseUrl`.
- El guard lleva a `/sign-in` a quien no tenga un token vigente. Un token vencido se descarta al cargar la aplicación.
- La interfaz lee el rol del token y consulta `/api/v1/users/me` para mostrar el nombre y la empresa.
  La firma del token la verifican el gateway y los servicios.
- Los errores del ingreso muestran el campo `detail` del ProblemDetails del backend, por ejemplo "El correo o la contraseña son incorrectos.".

## Estilo

Se usa el estilo Arcadia, tema claro Piedra. Los tokens están en `src/styles/_tokens.scss` con el prefijo `--arc-`, y los componentes solo los usan: ningún color hexadecimal fuera de ese archivo. La fuente es DM Sans Variable, servida desde el paquete `@fontsource-variable/dm-sans` (sin CDN). Los títulos pesan 600 y el resto, 500 como máximo.

Desde 1100 px, el acceso tiene dos columnas, con una vista decorativa del Inicio que no recibe foco y no se monta en pantallas menores. El menú lateral va sobre el mismo fondo que la página (`--arc-bg`), sin línea divisoria, y el rojo `--arc-danger` se reserva para los errores.

## Suscripción

El administrador entra por `/subscription`. La página carga el catálogo y la suscripción actual
desde el gateway; no guarda el identificador de la suscripción en el navegador. Permite elegir
un plan, retomar un pago pendiente, revisar la vigencia y renovar. Los errores conservan el plan
ya guardado para que un reintento del checkout no cree otra suscripción.

Los pagos son simulados y no solicitan datos de tarjeta. El servidor decide si permite confirmar
o rechazar desde la interfaz mediante `RINDE_BILLING_SIMULATION_ENABLED=true`, únicamente en
el entorno de pruebas. Si no está habilitado, la página muestra el pago pendiente de confirmación.
La clave HMAC del webhook permanece en el servidor y nunca se envía a Angular.

El monolito necesita `RINDE_IAM_REMOTE_ENABLED=true` e `IAM_SERVICE_URL` para consultar la empresa
en IAM separado. Notifications recibe los eventos en segundo plano: todavía no hay un buzón
de avisos en la web ni un proveedor push real.
