# Pendientes del tutor contextual en frontend

**Estado:** vigente, pendiente de corrección.  
**Fecha de revisión:** 09/11/2026.  
**Alcance:** integración frontend del tutor contextual de Neon Flow y los contratos backend que afectan su entrega.  
**Rama revisada:** `feature/neonflow-contextual-tutor`.

Esta guía registra errores encontrados durante la auditoría de la primera implementación del tutor contextual. No acredita que el piloto esté listo ni sustituye la especificación funcional de [`Tutor_IA_Simulador.md`](Tutor_IA_Simulador.md).

## Alcance vigente

La primera fase debe limitarse a partidas verificadas de estudiantes propietarios, con una actividad oficial de Neon Flow del curso `c001`, plantilla canónica, estado `ACTIVE`, locale `es` y piloto habilitado. Debe excluir práctica independiente, retos diarios, prototipos y partidas de docentes o administradores.

La pista contextual y la ayuda estática tienen ciclos distintos:

- Una pista contextual emitida por el servidor debe confirmarse mediante una sola acción `HELP` con `hintId`.
- Una pista estática usa `source=STATIC` y puede servir de respaldo cuando no existe una entrega contextual segura.
- Una solicitud fallida, una respuesta obsoleta o una respuesta cuya entrega no se puede confirmar no deben crear una segunda ayuda accidental.
- Un reintento de la misma solicitud debe conservar `requestId` y devolver el mismo recibo cuando el servidor ya lo creó.

## Resumen de hallazgos

| ID | Severidad | Estado | Área |
|---|---|---|---|
| TUTOR-FE-001 | P1 | Pendiente | Fallback y doble `HELP` |
| TUTOR-FE-002 | P1 | Pendiente | Recibos y revisiones obsoletas |
| TUTOR-FE-003 | P1 | Pendiente | Alcance del piloto |
| TUTOR-FE-004 | P2 | Pendiente | Cobertura de pruebas de integración |

## TUTOR-FE-001: doble `HELP` después de un timeout

### Ubicación

- [`validatedGameSession.ts`](../../frontend/src/infrastructure/store/validatedGameSession.ts), `requestHint()` y `drain()`.
- [`NeonFlowStage.tsx`](../../frontend/src/ui/components/NeonFlow/NeonFlowStage.tsx), callback `onHint`.
- [`ControlPanel.tsx`](../../frontend/src/ui/components/common/ControlPanel.tsx), botón `Pista`.
- [`GameSessionsService.java`](../../backend/src/main/java/com/pipre/backend/application/useCases/GameSessionsService.java), aplicación de acciones `HELP`.

### Problema

`requestHint()` devuelve `null` ante cualquier error de red o fallo de sincronización. `NeonFlowStage` interpreta siempre ese valor como permiso para encolar una ayuda estática.

Si el backend ya creó el recibo contextual, pero la respuesta se perdió, la cola puede conservar el `HELP` contextual con `hintId`. El fallback estático se agrega antes de que ese comando sea reconciliado. Al reintentar pueden llegar dos acciones:

1. `HELP` contextual con `hintId`.
2. `HELP` estático con `source=STATIC`.

Además, dos clics rápidos comparten la promesa `hintWorking`, pero cada callback puede ejecutar su propio fallback estático. El botón solo se deshabilita cuando la partida deja de estar en estado `PLAYING`; no conoce el estado de la consulta contextual.

### Comportamiento esperado

- Una entrega contextual confirmada produce una sola acción `HELP`.
- Un fallo con entrega incierta no activa inmediatamente el fallback estático.
- El reintento usa el mismo `requestId` y no crea otro recibo.
- Un rechazo explícito que confirma que no hubo entrega puede activar una sola ayuda estática.
- Dos clics concurrentes producen una sola solicitud lógica y, como máximo, una acción `HELP`.

### Corrección pendiente

- Reemplazar el resultado nullable de `requestHint()` por un resultado explícito que distinga `DELIVERED`, `FALLBACK_ALLOWED`, `PENDING`, `STALE` y `REJECTED`.
- Mantener el `requestId` de la solicitud lógica mientras se reintenta por red.
- Conservar el `hintId` cuando la respuesta llegó pero la confirmación de la acción falló.
- No activar fallback si existe un recibo o una acción contextual pendiente de reconciliación.
- Exponer un estado de consulta al botón `Pista` y bloquear clics concurrentes.
- Hacer que el fallback estático sea idempotente dentro de una solicitud de ayuda.

## TUTOR-FE-002: recibos pendientes de revisiones antiguas

### Ubicación

- [`RequestGameHintService.java`](../../backend/src/main/java/com/pipre/backend/application/useCases/RequestGameHintService.java), conteo de solicitudes pendientes.
- [`GameSessionHintRepositoryPort.java`](../../backend/src/main/java/com/pipre/backend/application/ports/output/GameSessionHintRepositoryPort.java), `countPendingSince()`.
- [`GameSessionHintRepositoryAdapter.java`](../../backend/src/main/java/com/pipre/backend/adapters/out/persistence/GameSessionHintRepositoryAdapter.java), consulta SQL.
- [`validatedGameSession.ts`](../../frontend/src/infrastructure/store/validatedGameSession.ts), comprobación de revisión y reintento.

### Problema

El backend cuenta recibos no consumidos por `sessionId` y fecha, pero no por revisión. Una solicitud creada en la revisión `0` queda sin posibilidad de consumo cuando la partida avanza a la revisión `1`, porque `GameSessionsService` la rechaza como `HINT_STALE`. Sin embargo, el mismo recibo continúa bloqueando nuevas solicitudes durante la ventana de 30 segundos.

El frontend también valida la revisión de la sesión antes de encolar la acción, pero no comprueba de forma independiente que `hint.revision` coincida con la revisión capturada para esa solicitud.

La eliminación automática de recibos pendientes después de 30 segundos también puede romper la idempotencia documentada para un reintento del mismo `requestId`.

### Comportamiento esperado

- Un recibo pendiente de otra revisión no bloquea una solicitud para la revisión actual.
- Una respuesta cuyo `revision` no coincide se descarta sin crear `HELP`.
- Un reintento de red de la misma solicitud conserva su recibo y su `requestId`.
- Una acción obsoleta debe dejar la cola disponible para movimientos posteriores.

### Corrección pendiente

- Cambiar `countPendingSince(sessionId, since)` por una operación que también reciba `revision`.
- Filtrar la consulta SQL por `session_id`, `revision`, `consumed_at IS NULL` y la ventana de concurrencia.
- Validar `hint.revision` antes de aceptar la respuesta en el frontend.
- Reutilizar el mismo `requestId` durante reintentos de red.
- Revisar la purga por TTL para no contradecir la idempotencia del contrato. Si se conserva una política de retención, debe documentarse como una limitación explícita.

## TUTOR-FE-003: alcance incompleto del piloto

### Ubicación

- [`useValidatedGameSession.ts`](../../frontend/src/ui/components/common/useValidatedGameSession.ts), cálculo de `enabled`.
- [`RequestGameHintService.java`](../../backend/src/main/java/com/pipre/backend/application/useCases/RequestGameHintService.java), autorización del piloto.
- [`TutorPilotProperties.java`](../../backend/src/main/java/com/pipre/backend/infrastructure/configuration/TutorPilotProperties.java), listas de actividades y grupos.
- [`TutorPilotAccessAdapter.java`](../../backend/src/main/java/com/pipre/backend/adapters/out/persistence/TutorPilotAccessAdapter.java), pertenencia del estudiante.
- [`GameSessionsService.java`](../../backend/src/main/java/com/pipre/backend/application/useCases/GameSessionsService.java), consumo del recibo.

### Problemas

1. El frontend habilita el controlador de sesión para cualquier plantilla oficial y estudiante, incluso cuando no existe `activityId` o existe `dailyChallengeId`. El backend termina rechazando varias de esas solicitudes, pero el cliente realiza una petición contextual innecesaria antes de volver al flujo estático.
2. El servicio valida curso, ambiente, plantilla, actividad, grupo, propiedad, estado y locale, pero no expresa de forma explícita el rechazo de retos diarios. La exclusión depende actualmente de que la sesión diaria no tenga una actividad compatible.
3. La configuración usa listas independientes de actividades y grupos. Eso permite cualquier combinación entre una actividad permitida y un grupo permitido. Debe confirmarse si el piloto necesita pares concretos actividad-grupo.
4. El recibo se autoriza al emitirse. El consumo posterior no vuelve a comprobar toda la configuración del piloto. Si se retira la actividad, el grupo o la habilitación mientras el recibo está pendiente, la acción podría seguir intentando consumirse.

### Comportamiento esperado

- El frontend usa el flujo contextual solo para Neon Flow oficial con `activityId` y sin `dailyChallengeId`.
- El backend rechaza explícitamente sesiones diarias, de práctica, ajenas, finalizadas, fuera de `c001`, con plantilla no canónica o fuera del grupo habilitado.
- El botón estático sigue disponible en los flujos excluidos.
- La política de combinación actividad-grupo queda definida antes de activar el piloto.
- Un recibo fuera de la política vigente no debe convertirse en una ayuda contextual aceptada.

### Corrección pendiente

- Restringir `enabled` en el hook a Neon Flow, actividad presente, reto no diario y plantilla oficial.
- Añadir una validación backend explícita para `dailyChallengeId != null`.
- Añadir pruebas de práctica, diario, actividad no habilitada, grupo no habilitado, actividad/grupo cruzados, plantilla no canónica y sesión no activa.
- Decidir si la configuración continuará como intersección de listas o pasará a pares actividad-grupo.
- Evaluar una reautorización al consumir recibos si la configuración puede cambiar durante una partida.

## TUTOR-FE-004: cobertura de pruebas pendiente

La implementación tiene pruebas del caso positivo, locale, idempotencia básica y flujo contextual exitoso. Todavía faltan pruebas enfocadas en los fallos de esta guía.

### Frontend

- Dos clics rápidos con una solicitud contextual rechazada: una sola ayuda estática.
- Timeout durante `POST /hints`: no duplicar `HELP` y reutilizar `requestId`.
- Respuesta del hint perdida después de crear el recibo: reconciliar antes del fallback.
- Fallo al enviar la acción con `hintId`: reintentar la misma secuencia y el mismo `hintId`.
- Respuesta con revisión antigua después de un movimiento local: descartar sin `HELP` contextual obsoleto.
- Solicitud durante una partida diaria o de práctica: conservar únicamente la ayuda estática.
- Botón `Pista` deshabilitado durante una solicitud activa.

### Backend

- Un recibo pendiente de la revisión anterior no bloquea la revisión actual.
- Un recibo de revisión incorrecta no puede consumirse.
- Una solicitud repetida con el mismo `requestId` devuelve el mismo recibo.
- Una solicitud con el mismo `requestId` y contenido distinto se rechaza.
- Las sesiones diarias, prácticas, no oficiales, no activas o de otro estudiante no reciben pistas contextuales.
- La actividad y el grupo se validan según la política aprobada del piloto.
- Una acción contextual rechazada deja avanzar la secuencia sin incrementar `helps`.

### Verificación final

Después de corregir los pendientes, ejecutar desde los directorios correspondientes:

```powershell
pnpm tsc -b
pnpm vitest run
.\mvnw.cmd -q test
.\mvnw.cmd -q compile
```

Registrar en el informe de implementación la fecha, los comandos y los resultados reales. No reutilizar resultados históricos como evidencia de una nueva ejecución.

## Orden recomendado de corrección

1. Corregir la clasificación de resultados y el fallback del frontend para impedir el doble `HELP`.
2. Preservar `requestId` y `hintId` en reintentos y validar la revisión de la respuesta.
3. Filtrar recibos pendientes por revisión y resolver la política de retención.
4. Cerrar el alcance de práctica, diario y actividad en frontend y backend.
5. Definir la política actividad-grupo y aplicarla con pruebas.
6. Ejecutar la suite completa y realizar una prueba E2E del flujo pista, movimiento y victoria.

## Referencias

- [Propuesta y contrato del tutor](Tutor_IA_Simulador.md)
- [Contratos vigentes frontend/backend](Contratos_Frontend_Backend.md)
- [Neon Flow y sus reglas](../simuladores/NeonFlow.md)
- [Pruebas integrales](Pruebas_Integrales.md)
