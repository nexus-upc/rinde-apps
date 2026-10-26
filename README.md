# rinde-web

Aplicación web de RINDE by NEXUS para el administrador y el responsable de operaciones. Consume la API a través del gateway (`rinde-gateway`, puerto 8000). Está hecha con Angular 22, componentes standalone y SCSS.

Este repositorio contiene el primer avance del Sprint 2: pantalla de ingreso (US09), marco de la aplicación con barra lateral y barra superior, y sesión con JWT. La página "Tablero de viajes" es provisional y se completa en la tarea S2-11.

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
    features/auth/     Pantalla de ingreso (sign-in).
    features/trips/    Tablero de viajes provisional (protegido).
    shared/layout/     Marco de la aplicación: barra lateral, barra superior y cierre de sesión.
    app.routes.ts      Rutas públicas y protegidas.
```

## Sesión

- Al ingresar, `POST /api/v1/auth/sign-in` devuelve `accessToken`. El token se guarda en `sessionStorage` bajo la clave `rinde.accessToken`, así que la sesión dura lo que dura la pestaña.
- El interceptor agrega `Authorization: Bearer <token>` a las peticiones dirigidas a `apiBaseUrl`.
- El guard lleva a `/sign-in` a quien no tenga un token vigente. Un token vencido se descarta al cargar la aplicación.
- La interfaz lee el correo y el rol del payload del token para mostrarlos. No verifica la firma, porque esa comprobación la hacen el gateway y los servicios.
- Los errores del ingreso muestran el campo `detail` del ProblemDetails del backend, por ejemplo "El correo o la contraseña son incorrectos.".

## Estilo

Se usa el estilo Arcadia, tema claro Piedra. Los tokens están en `src/styles/_tokens.scss` con el prefijo `--arc-`, y los componentes solo los usan: ningún color hexadecimal fuera de ese archivo. La fuente es DM Sans Variable, servida desde el paquete `@fontsource-variable/dm-sans` (sin CDN). Los títulos pesan 600 y el resto, 500 como máximo.

Desde 1100 px, el acceso tiene dos columnas, con una vista decorativa del Inicio que no recibe foco y no se monta en pantallas menores. El menú lateral va sobre el mismo fondo que la página (`--arc-bg`), sin línea divisoria, y el rojo `--arc-danger` se reserva para los errores.
