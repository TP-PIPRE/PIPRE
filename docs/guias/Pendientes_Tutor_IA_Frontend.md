# Pendientes del tutor contextual en frontend

**Estado:** vigente, correcciones aplicadas localmente; piloto aún no habilitado.
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
| TUTOR-FE-001 | P1 | Corregido | Fallback y doble `HELP` |
| TUTOR-FE-002 | P1 | Corregido | Recibos y revisiones obsoletas |
| TUTOR-FE-003 | P1 | Corregido | Alcance del piloto |
| TUTOR-FE-004 | P2 | Parcial | Cobertura de pruebas de integración |

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

### Corrección aplicada

- `requestHint()` distingue `DELIVERED`, `FALLBACK_ALLOWED`, `PENDING` y `STALE`.
- Los reintentos de red conservan `requestId`; los reintentos de acción conservan `hintId` y secuencia.
- Una entrega incierta no activa el fallback estático.
- `hintBusy` deshabilita el botón durante la consulta contextual.
- La ruta estática solo se ejecuta una vez por resultado que autoriza fallback.
- Un guard síncrono evita dos fallbacks estáticos en el mismo ciclo de eventos.
- Una sesión desmontada invalida la respuesta pendiente y no envía nuevas acciones.
- El botón de retry puede presentar y registrar la pista contextual confirmada.

## TUTOR-FE-002: recibos pendientes de revisiones antiguas

### Ubicación

- [`RequestGameHintService.java`](../../backend/src/main/java/com/pipre/backend/application/useCases/RequestGameHintService.java), conteo de solicitudes pendientes.
- [`GameSessionHintRepositoryPort.java`](../../backend/src/main/java/com/pipre/backend/application/ports/output/GameSessionHintRepositoryPort.java), `countPending()`.
- [`GameSessionHintRepositoryAdapter.java`](../../backend/src/main/java/com/pipre/backend/adapters/out/persistence/GameSessionHintRepositoryAdapter.java), consulta SQL.
- [`validatedGameSession.ts`](../../frontend/src/infrastructure/store/validatedGameSession.ts), comprobación de revisión y reintento.

### Problema

El backend cuenta recibos no consumidos por `sessionId` y revisión. Una solicitud creada en la revisión `0` queda sin posibilidad de consumo cuando la partida avanza a la revisión `1`, porque `GameSessionsService` la rechaza como `HINT_STALE`; al solicitar una nueva pista se limpian esos recibos obsoletos.

El frontend también valida la revisión de la sesión antes de encolar la acción, pero no comprueba de forma independiente que `hint.revision` coincida con la revisión capturada para esa solicitud.

La eliminación automática de recibos pendientes después de 30 segundos también puede romper la idempotencia documentada para un reintento del mismo `requestId`.

### Comportamiento esperado

- Un recibo pendiente de otra revisión no bloquea una solicitud para la revisión actual.
- Una respuesta cuyo `revision` no coincide se descarta sin crear `HELP`.
- Un reintento de red de la misma solicitud conserva su recibo y su `requestId`.
- Una acción obsoleta debe dejar la cola disponible para movimientos posteriores.

### Corrección aplicada

- `countPending()` recibe `sessionId` y `revision`.
- La consulta SQL filtra la revisión vigente.
- El frontend valida la revisión de la respuesta antes de encolar `HELP`.
- El mismo `requestId` se conserva durante fallos de red.
- Los recibos de revisiones anteriores se limpian cuando se solicita una pista nueva.
- Solo puede existir una solicitud pendiente por revisión; el mismo `requestId` permite reintentarla.
- Una solicitud pendiente devuelve `409` con código `HINT_PENDING`.

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

### Corrección aplicada

- El hook separa la sesión verificada de `contextualHintsEnabled`; no cambia el flujo de sesiones TetriLogic.
- El backend rechaza explícitamente `dailyChallengeId != null`.
- El consumo vuelve a verificar piloto habilitado, curso `c001`, actividad, plantilla canónica y pertenencia a un grupo permitido.
- La pertenencia verifica también la asignación explícita de `group_activities`.
- La configuración conserva la intersección de `allowedActivityIds` y `allowedGroupIds`; no usa pares específicos.
- Las pruebas cubren recibos fuera del grupo autorizado y sesiones diarias.

## TUTOR-FE-004: cobertura de pruebas pendiente

La implementación ahora tiene pruebas del caso positivo, locale, idempotencia básica, timeout, reintento de acción, respuesta obsoleta, revisión pendiente, sesión diaria y alcance de grupo. Continúa pendiente una comprobación E2E contra el endpoint real y una prueba específica de doble clic desde el navegador.

## Hallazgos adicionales corregidos

- Recibos inexistentes ahora devuelven error sin avanzar la revisión; recibos de otra sesión devuelven acceso denegado.
- `hintId` solo puede acompañar `HELP`; las ayudas estáticas deben declarar `source=STATIC`.
- Una repetición idempotente se rechaza si la sesión ya no está `ACTIVE`.
- `revision` es obligatoria y `maxHints` debe ser al menos 1.
- La persistencia de recibos usa SQL portable y la migración V29 añade el índice de solicitudes pendientes.
- El diagnóstico y la comprobación de victoria Neon Flow comparten el mismo recorrido de raycast.

### Frontend

- [ ] Dos clics rápidos con una solicitud contextual rechazada comprobados desde una prueba de navegador dedicada.
- [x] Timeout durante `POST /hints`: no duplicar `HELP` y reutilizar `requestId`.
- [x] Respuesta del hint perdida después de crear el recibo: reconciliar antes del fallback.
- [x] Fallo al enviar la acción con `hintId`: reintentar la misma secuencia y el mismo `hintId`.
- [x] Respuesta con revisión antigua después de un movimiento local: descartar sin `HELP` contextual obsoleto.
- [x] Solicitud durante una partida diaria o de práctica: conservar únicamente la ayuda estática.
- [x] Botón `Pista` deshabilitado durante una solicitud activa.

### Backend

- [x] Un recibo pendiente de la revisión anterior no bloquea la revisión actual.
- [x] Un recibo de revisión incorrecta no puede consumirse.
- [x] Una solicitud repetida con el mismo `requestId` devuelve el mismo recibo.
- [x] Una solicitud con el mismo `requestId` y contenido distinto se rechaza.
- [x] Las sesiones diarias, prácticas, no oficiales, no activas o de otro estudiante no reciben pistas contextuales.
- [x] La actividad y el grupo se validan según la política aprobada del piloto.
- [x] Una acción contextual rechazada deja avanzar la secuencia sin incrementar `helps`.

### Verificación final

Después de corregir los pendientes, ejecutar desde los directorios correspondientes:

```powershell
pnpm tsc -b
pnpm vitest run
.\mvnw.cmd -q test
.\mvnw.cmd -q compile
```

Registrar en el informe de implementación la fecha, los comandos y los resultados reales. No reutilizar resultados históricos como evidencia de una nueva ejecución.

## Validación restante

1. Añadir la prueba E2E del flujo pista, movimiento y victoria contra el endpoint real.
2. Añadir la prueba de doble clic desde el componente montado.
3. Ejecutar el piloto únicamente después de revisar autorización, retención y resultados con docentes.

## Referencias

- [Propuesta y contrato del tutor](Tutor_IA_Simulador.md)
- [Contratos vigentes frontend/backend](Contratos_Frontend_Backend.md)
- [Neon Flow y sus reglas](../simuladores/NeonFlow.md)
- [Pruebas integrales](Pruebas_Integrales.md)
