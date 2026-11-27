# Gastos

Funcionalidad de bandeja global y revisión de gastos de la web. Responsable: Farid (US23, US24, S4-12).

| Acción | API por el gateway |
|---|---|
| Bandeja global paginada con filtros | `GET /api/v1/expenses` |
| Leer el archivo de un comprobante | `GET /api/v1/expenses/{expenseId}/evidences/{evidenceId}/content` |
| Aprobar u observar un gasto | `PATCH /api/v1/expenses/{id}/status` |
| Catálogos para código de viaje y nombre de conductor (`userId`) | `GET /api/v1/trips`, `GET /api/v1/drivers` |
