# Notificaciones

Centro de notificaciones de la web (contrato C6, tarea S4-25). Lo ven los roles administrador y responsable de operaciones.

| Acción | API por el gateway |
|---|---|
| Listar avisos (filtros `unreadOnly`, `type`, `page`, `size`) | `GET /api/v1/notifications` |
| Contar no leídas para la campana | `GET /api/v1/notifications/unread-count` |
| Marcar uno como leído | `PATCH /api/v1/notifications/{id}/read` |
| Marcar todos como leídos | `POST /api/v1/notifications/read-all` |

Capas: `models` (tipos, etiquetas en español y formato de fecha), `data-access` (llamadas HTTP), `state` (`NotificationCenterStore`, compartido por la página y la campana), `pages` (lista, filtros y paginación) y `ui` (campana con el contador, que recibe el número por entrada desde el marco).

El contador se consulta al entrar al marco y cada 60 s mientras la pestaña está visible; el temporizador se detiene cuando se destruye el marco. Marcar un aviso baja el contador sin recargar la lista.
