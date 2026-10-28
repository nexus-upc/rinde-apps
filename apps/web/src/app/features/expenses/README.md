# Gastos

Funcionalidad de gastos de la web. Responsable: Farid (US24).

| Acción | API por el gateway |
|---|---|
| Listar los gastos de un viaje | `GET /api/v1/trips/{tripId}/expenses` |
| Ver el detalle de un gasto | `GET /api/v1/expenses/{id}` |
| Aprobar u observar un gasto | `PATCH /api/v1/expenses/{id}/status` |

Usar las carpetas `models`, `data-access`, `state`, `pages` y `ui` como en `features/subscriptions`, y agregar la ruta en `app.routes.ts` dentro del espacio protegido. En este sprint el diseño visual no es obligatorio; sí lo es que pasen `npm run check:architecture` y `npm run build`.
