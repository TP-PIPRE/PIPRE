# Contratos vigentes entre frontend y backend

**Revisado contra el código el 05/11/2026.** [Estado actual](../ESTADO_ACTUAL.md) · [Roles](Clasificacion_Endpoints_Roles.md) · [Historial de correcciones](../historial/Informe_Contratos_Frontend_Backend.md).

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

## Sesiones verificadas, logros y diario

El canal anterior conserva su naturaleza declarativa. Desde el 02/11 existe además un canal de juego autorizado que reproduce acciones y verifica la solución en el servidor:

| Método / ruta bajo `/api/v1` | Contrato |
|---|---|
| POST `/game-sessions` | Estudiante propio, UUID de cliente, juego, plantilla, actividad/diario opcionales; devuelve inicio UTC, estado y revisión. |
| POST `/game-sessions/{id}/actions` | Acción tipada, secuencia creciente y campos planos; reintento idéntico devuelve el recibo original. |
| POST `/game-sessions/{id}/complete` | Valida el tablero persistido; devuelve estrellas, mejor resultado, tiempo, logros nuevos y estado diario. No recibe éxito ni calificación autoritativos. |
| GET `/daily-challenges/today?studentId=...` | Fecha servidor en Lima, tablero oficial del día, finalización y rachas. |
| GET `/daily-challenges/today/set?studentId=...` | Conjunto persistido de cinco ejercicios procedurales; progreso confirmado 0–100 y finalización únicamente al validar 5/5. |
| GET `/profile/{id}/game-progress` | Mejor estrella y estado de los 60 niveles, totales y rachas. |
| GET `/profile/{id}/achievements` | Exactamente 35 logros activos, condición, estado y fecha; excluye el catálogo histórico. |
| GET `/profile/{id}/achievements/export?from=...&to=...` | 35 estados binarios actuales y nuevos dentro del periodo inclusivo en Lima. |

Las tres escrituras de sesión sólo admiten al estudiante propietario. Las lecturas admiten propietario o docente/administrador. Ninguna ruta permite asignar un logro arbitrario. Ver campos, errores, rúbrica e idempotencia en [Sistema de 35 logros](Sistema_35_Logros.md); los DTO TypeScript están en [gameProgressModels.ts](../../frontend/src/infrastructure/api/models/gameProgressModels.ts).

El historial conserva las métricas desconocidas como `null`: `score` y `efficiency` no se inventan para una victoria verificada. `dateAttempted` es una cadena ISO; los registros verificados incluyen `Z`, los anteriores conservan su fecha local sin atribuir una zona nueva. Las estrellas y XP nuevos proceden del recibo/ledger servidor. El ranking conserva puntos, posición y orden anteriores, y presenta XP/estrellas/racha globales sin multiplicarlos por membresías.

## Validación y errores HTTP — revisión del 05/11/2026

Las peticiones válidas conservan sus rutas, JSON y respuestas anteriores. Actividades validan `logicLevel` opcional entre 1 y 3, también en PUT parcial; resultados requieren estudiante/actividad y no admiten score/intentos negativos; progreso requiere estudiante/módulo y limita porcentaje opcional a 0–100; asignaciones requieren grupo/estudiante. Omitir los campos opcionales conserva sus reglas actuales. Los estados académicos y una escala máxima de score siguen pendientes de definición funcional.

| Situación | Respuesta |
|---|---|
| JSON ilegible, tipos incorrectos, parámetros obligatorios ausentes o reglas de negocio inválidas | 400 con `message`; validaciones de campos añaden `errors` |
| Referencia curricular, estudiante, grupo o actividad inexistente al guardar en los adaptadores revisados | 404; no se guarda una referencia nula como sustitución |
| Conflicto de integridad de datos | 409 con mensaje genérico |
| Fallo interno inesperado | 500 con mensaje genérico; detalle en el registro del servidor |

Se preservan los tratamientos existentes de autenticación/autorización, 405 y bloqueo de cuenta. La retirada de una pertenencia a grupo continúa devolviendo 204 al repetirse, incluido un grupo ausente, y reordena las posiciones restantes en una transacción. Repetir la asignación de una pertenencia ya existente conserva su historial y responde 201 vacío. No se impone una deduplicación de resultados declarativos por actividad, pues representan intentos distintos.

Ver [auditoría y pruebas](../informes/Auditoria_Backend_2026_11_05.md) y [pendientes de implementación](Pendientes_Implementacion_Backend.md).

## Persistencia y límites

V17 amplía `telemetry_attempts`; no crea otra entidad de intento. Las FK y la compatibilidad histórica se documentan en [arquitectura](../sistema/02_Arquitectura_del_Sistema.md). Telemetría, resultados, simulaciones y progreso no son contratos equivalentes.

V18/V19 añaden progreso/logros y sesiones verificadas sin convertir trazas antiguas en victorias. V20/V21 añaden conjuntos diarios y el inicio de cada ejercicio. V1…V21 ya se aplicaron localmente y no se reescriben. La sesión persistida no implica reanudación del tablero en el navegador.

La cola por estudiante usa almacenamiento de sesión y envío de mejor esfuerzo. No garantiza entrega ante corte de luz/cierre sin conexión, no reanuda el tablero y no actualiza calificaciones. Datos de cliente no son una validación antifraude de la solución.

No modificar `data-science`, modelos, endpoints o proxy para completar este contrato sin autorización. [Informe y preparación ML](../informes/Integracion_TetriLogic_NeonFlow_ML.md) · [Consultas de inspección](../Consultas_Analitica_Intentos.sql).
