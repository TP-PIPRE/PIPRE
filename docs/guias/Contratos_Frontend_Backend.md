# Contratos vigentes entre frontend y backend

**Revisado contra el código el 30/10/2026.** [Estado actual](../ESTADO_ACTUAL.md) · [Roles](Clasificacion_Endpoints_Roles.md) · [Historial de correcciones](../historial/Informe_Contratos_Frontend_Backend.md).

## Sesión y transporte

El frontend usa Axios con `withCredentials: true`; el navegador gestiona `jwt` HttpOnly. Login responde `{ message, user }`, con `idUser` y rol, sin entregar al frontend un JWT para decodificar. Logout expira la cookie desde el servidor. 401 y 403 tienen tratamientos diferentes. [Autenticación](Guia_Migracion_Autenticacion.md).

Las colecciones paginadas se recorren al pedir todos sus elementos. No asumir que la primera página de 100 elementos contiene todo el currículo. Los modelos Java/TypeScript se consultan en [DTO/ comandos backend](../../backend/src/main/java/com/pipre/backend/application/commands) y [apiModels.ts](../../frontend/src/infrastructure/api/models/apiModels.ts).

## Actividad y tablero

| Campo o recurso | Contrato |
|---|---|
| `idLesson` | Lección real de un módulo/curso; el editor conserva su selección. |
| `environment` | `neonflow` o `tetrilogic`, compatible con la plantilla. |
| `levelTemplate` | Identidad de una configuración implementada y registrada en ambas capas. |
| `description`, `displayOrder`, `missions` | Se guardan y recargan; el orden, si se proporciona, es entero positivo. Los campos omitidos en actualización parcial se preservan. |
| `startingPosition`, `targetPosition`, misiones | Metadatos del contrato existente; no configuran por sí solos la geometría del simulador. |
| POST cursos/módulos/lecciones/actividades | Conservan respuestas 201 sin cuerpo donde están implementadas; recargar para recuperar los IDs. Registro de usuario tiene su propio contrato de respuesta. |
| `/simulador/:courseId?activity=:idActivity` | Comprueba pertenencia al curso y resuelve esa actividad. |

Las plantillas oficiales son `neonflow-v2-1`…`30` y `tetrilogic-v2-1`…`30`. Los alias/prototipos se detallan en el [estado actual](../ESTADO_ACTUAL.md) y no cuentan como otros retos. Una plantilla desconocida no recibe un tablero alternativo por defecto.

```text
GET /api/v1/neonflow/templates/{templateId}
GET /api/v1/tetrilogic/templates/{templateId}
→ { templateId, version, config }
```

Estos lectores requieren autenticación. Las plantillas v2 se contrastan con la configuración revisada del frontend; una ausencia/discrepancia muestra error recuperable. Una plantilla inexistente devuelve 404; no existe un endpoint de escritura de tableros. Las soluciones no aparecen en `config`.

## Intentos y acciones

`POST /api/v1/telemetry` conserva el cuerpo anterior y admite un `trace` opcional:

| Nivel | Campos |
|---|---|
| Cuerpo compatible | `studentId`, `game`, `result`, `tiempoResolucion`, `movimientos`, `reinicios`, `pistasIa`, `completedAt` |
| Contexto nuevo | `clientAttemptId`, `activityId` opcional, `levelTemplate`, `templateVersion`, `ruleset`, `startedAt` |
| Proceso | `initialState`, `finalState`, `droppedEvents`, `events` |
| Evento | `sequence`, `elapsedMs`, `type`, `data` con campos tipados admitidos |

Resultados admitidos: `SUCCESS`, `FAILED`, `ABANDONED`. Las reglas activas se identifican como `neonflow-raycast-v1` y `tetrilogic-counts-v1`; la versión de reglas no se confunde con la versión 2 del contenido. El flujo actual emite éxito/abandono; una comprobación fallida no cierra automáticamente un episodio.

El servidor verifica existencia, identidad, juego/plantilla, versión y correspondencia de actividad cuando existe. Acota secuencia, tiempos, coordenadas, giros y campos de los estados/eventos. Obtiene la dificultad de la actividad y añade recepción/huella y `clientReported=true`. La práctica independiente admite actividad y dificultad nulas.

El mismo estudiante/UUID de cliente/contenido se acepta idempotentemente, incluidos envíos simultáneos. Reutilizar ese identificador con contenido diferente se rechaza. Reintentar una traza ya aceptada funciona tras editar la actividad; una traza todavía no aceptada puede quedar incompatible si el docente cambió su plantilla.

Los clientes anteriores sin `trace` siguen aceptándose con contexto nulo; no se inventa su actividad ni se extiende retroactivamente la idempotencia nueva a esos requests. Las pistas estáticas llevan `source=STATIC` y no incrementan `pistasIa`. El campo heredado no prueba que una consulta IA haya ocurrido históricamente.

## Persistencia y límites

V17 amplía `telemetry_attempts`; no crea otra entidad de intento. Las FK y la compatibilidad histórica se documentan en [arquitectura](../sistema/02_Arquitectura_del_Sistema.md). Telemetría, resultados, simulaciones y progreso no son contratos equivalentes.

La cola por estudiante usa almacenamiento de sesión y envío de mejor esfuerzo. No garantiza entrega ante corte de luz/cierre sin conexión, no reanuda el tablero y no actualiza calificaciones. Datos de cliente no son una validación antifraude de la solución.

No modificar `data-science`, modelos, endpoints o proxy para completar este contrato sin autorización. [Informe y preparación ML](../informes/Integracion_TetriLogic_NeonFlow_ML.md) · [Consultas de inspección](../Consultas_Analitica_Intentos.sql).
