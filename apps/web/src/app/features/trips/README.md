# Viajes

Funcionalidad de viajes de la web. `trips-placeholder` es provisional y se reemplaza por las pantallas reales.

| Pantalla | Responsable | API por el gateway |
|---|---|---|
| Tablero y programación (US14 y US16) | Gabriel | `GET /api/v1/trips`, `POST /api/v1/trips` |
| Detalle y asignación (US15 y US17) | Andree | `GET /api/v1/trips/{id}`, `GET /api/v1/vehicles`, `GET /api/v1/drivers`, `PUT /api/v1/trips/{id}/assignment` |

Usar las carpetas `models`, `data-access`, `state`, `pages` y `ui` como en `features/subscriptions`. Las páginas no llaman a HttpClient: lo hace `data-access`. En este sprint el diseño visual no es obligatorio; sí lo es que pasen `npm run check:architecture` y `npm run build`.
