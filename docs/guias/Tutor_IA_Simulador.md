# Propuesta de tutor IA para el simulador

**Propuesta técnica del 08/11/2026.** Describe el alcance y los pasos de una implementación futura.

## Objetivo y alcance

Ayudar al estudiante a identificar qué observar y qué comprobar mientras resuelve un reto. Las pistas orientan el siguiente paso y dejan la decisión en manos del estudiante. El piloto evaluará si esta ayuda facilita continuar y resolver otro reto equivalente de forma autónoma.

La primera fase cubre **partidas verificadas de actividades oficiales de Neon Flow**. Compara la pista estática actual con pistas contextuales redactadas de antemano. La [segunda etapa](#segunda-etapa-tetrilogic) reutiliza ese flujo para diagnosticar los conteos de TetriLogic. La redacción generativa se evaluará por separado y requerirá autorización para conectar un proveedor. El ML propio queda fuera del alcance actual.

[Reglas y alcance de los simuladores](../ESTADO_ACTUAL.md) · [Contrato de partidas verificadas](Contratos_Frontend_Backend.md#sesiones-verificadas-logros-y-diario)

## Restricciones del piloto de Neon Flow

- Admitir sesiones `ACTIVE` de estudiantes propietarios, con una actividad oficial del curso `c001` y su plantilla canónica de Neon Flow. El backend cruza la actividad, el curso, el juego y la plantilla persistidos con el [catálogo oficial](../ESTADO_ACTUAL.md#catálogo-y-conexión). El piloto excluye práctica independiente, prototipos, retos diarios y pruebas de docentes o administradores. Esos flujos conservan la ayuda disponible en cada caso.
- Aplicar las reglas de raycast vigentes y utilizar solo los hechos del tablero confirmado. La ayuda puede orientar una comprobación. Los movimientos, la verificación de la victoria, la progresión, la fórmula de estrellas, los puntos y el XP conservan sus contratos.
- Mantener la opción de pista estática. La consulta contextual tiene un límite de tiempo, un [cupo configurable por intento](#cupo-de-ayuda-contextual) y una sola solicitud en curso por tablero. El piloto queda desactivado por defecto. El backend valida que esté habilitado para la sesión y, fuera del piloto, el botón usa la ayuda actual.
- Proteger las escrituras con sesión autenticada, autorización de propietario y CSRF. Validar en servidor los identificadores, la revisión, el idioma, el tipo de ayuda y las coordenadas. Registrar solo datos técnicos necesarios y aplicar la política de acceso y retención acordada para el piloto.
- El piloto usa Spring, PostgreSQL y el frontend existente. La integración de un proveedor, los cambios en `data-science` y la personalización mediante ML quedan fuera de esta etapa. Si la persistencia exige una migración, usar la siguiente versión Flyway disponible y preservar las migraciones publicadas.

## Flujo y fuente de verdad

1. El estudiante pulsa **Pista**. El frontend espera a que se confirmen los movimientos pendientes y vincula la solicitud a la revisión actual de la partida.
2. El backend autentica al usuario, comprueba que sea el estudiante propietario de una sesión activa de una actividad oficial de Neon Flow y recupera la plantilla y el estado persistidos. Usa los contadores del servidor si hacen falta.
3. El motor calcula un diagnóstico verificable y selecciona el grado de ayuda. Una plantilla redactada y revisada convierte el diagnóstico en un mensaje breve.
4. El frontend usa el componente de pistas existente. Si el jugador cambió el tablero, reinició o salió mientras esperaba, descarta la respuesta obsoleta. Los controles del tablero siguen disponibles durante la consulta.
5. Una pista entregada usa la cola existente de acciones verificadas para registrar una sola acción `HELP`. La solicitud de pista se mantiene separada de la escritura que cuenta para la rúbrica.

En una fase generativa, el modelo recibiría el diagnóstico mínimo, el idioma y el grado permitido. El motor conserva la autoridad sobre el diagnóstico, las referencias al tablero y la validación de victorias y desbloqueos. El servicio externo recibe datos del juego estrictamente necesarios para redactar la pista, sin identificadores de estudiante, sesión o actividad, texto libre, credenciales ni soluciones de prueba.

## Contrato propuesto

`POST /api/v1/game-sessions/{sessionId}/hints`

```json
{
  "requestId": "ff3b5119-d30b-44d7-a43f-891563f8e503",
  "revision": 8,
  "locale": "es"
}
```

El backend deriva la identidad de la sesión autenticada y el juego, la plantilla y la actividad de la sesión de juego. La escritura usa los controles de autenticación, autorización y CSRF del backend. Una revisión distinta de la solicitada produce una respuesta de revisión obsoleta y permite volver a pedir ayuda sobre el estado vigente.

Una respuesta de grado 2 podría ser:

```json
{
  "requestId": "ff3b5119-d30b-44d7-a43f-891563f8e503",
  "hintId": "f9d15a48-4c2c-4b05-bd1e-167bc4c66aa1",
  "revision": 8,
  "source": "RULE_BASED",
  "hintLevel": 2,
  "type": "COLOR_HINT",
  "message": "Observa el filtro donde se detuvo el haz, en la fila 2, columna 3.",
  "targetCell": { "x": 2, "y": 1 }
}
```

- La respuesta identifica la revisión que se analizó. Antes de presentarla, el frontend verifica que corresponda a la misma partida y que el jugador no haya hecho cambios locales sin confirmar.
- `targetCell` es opcional. El backend valida sus límites y su correspondencia con el diagnóstico. Las coordenadas del contrato empiezan en cero y los mensajes al jugador numeran filas y columnas desde uno.
- Repetir el mismo `requestId` en la sesión con el mismo contenido devuelve el mismo recibo. Reutilizarlo con un contenido distinto se rechaza. Aplicar límites por sesión y permitir una consulta pendiente por tablero.
- La autorización de la actividad, el grado y el tipo de pista, el destino y su relación con el estado se comprueban en el backend. El mensaje se presenta como texto. Una respuesta generativa futura debe ajustarse al diagnóstico y al grado permitido, o se sustituye por la plantilla contextual.

## Grados de ayuda

| Grado | Qué ofrece | Ejemplo para el mismo filtro |
|---|---|---|
| 1. Regla | Recuerda una regla del juego sin señalar una coordenada. | Los filtros dejan pasar el haz de su mismo color. |
| 2. Ubicación | Señala una zona o elemento comprobado, con coordenada cuando aporte valor. | Observa el filtro donde se detuvo el haz, en la fila 2, columna 3. |
| 3. Pregunta | Relaciona la observación con la regla y orienta una comprobación. | ¿Coincide el color del haz con el del filtro que lo detuvo? |

La primera solicitud empieza en el grado 1. El estudiante puede pedir más detalle hasta el grado 3. Si el diagnóstico cambia tras una acción, la ayuda vuelve a empezar por la regla relevante. Reintentar una solicitud por fallo de red conserva el grado y el identificador de la solicitud. El tutor evita secuencias completas de movimientos y soluciones de referencia.

## Diagnósticos por juego

**Neon Flow.** Empezar por hechos que se pueden reproducir, como un filtro incompatible, un obstáculo que detuvo el haz o un receptor que no se iluminó. Reutilizar las reglas del raycast para obtener la causa y la celda cuando existan. Una recomendación de giro o ruta alternativa exigiría comprobarla con el motor y queda fuera del piloto.

**TetriLogic.** En una etapa posterior, basar las pistas en los objetivos definidos de filas y columnas, incluidos los ceros, y en los límites, las colisiones y el inventario vigente. Superar temporalmente un conteo está permitido durante la exploración. Una pista válida podría preguntar cuántas celdas faltan en una fila concreta. Las condiciones históricas de celdas bloqueadas, contactos, orden y orientaciones exigidas quedan fuera del diagnóstico. [Reglas activas de TetriLogic](../simuladores/TetriLogic_Filas_Columnas.md)

## Registro y respaldo

Distinguir **solicitud**, **ayuda entregada** y **origen**. Las fuentes propuestas son `STATIC` para la pista de respaldo, `RULE_BASED` para la contextual redactada de antemano y `GENERATIVE` para una fase posterior. El piloto conserva la semántica de `pistasIa` y registra las fuentes por separado. Una solicitud fallida sin pista entregada y una respuesta descartada por obsoleta no generan `HELP`.

Una entrega contextual vigente cuenta como una sola `HELP` bajo la rúbrica actual. La propuesta vincula la acción a un `hintId` comprobado en la sesión y reutiliza la secuencia idempotente de la cola. El backend comprueba que la acción corresponda a la revisión analizada y que el recibo no se haya usado en otra acción. Un reintento no crea otra ayuda, ni cambia el grado ni vuelve a contabilizar el mismo recibo. Conservar la compatibilidad de las pistas estáticas existentes. [Contrato de trazas y sesiones](Contratos_Frontend_Backend.md#intentos-y-acciones) · [Rúbrica de estrellas](../../backend/src/main/java/com/pipre/backend/domain/entities/game/BoardRules.java#L189)

Si el servidor no dispone de un diagnóstico seguro o la consulta falla, usar la ayuda estática de Neon Flow cuando la partida siga vigente. El respaldo funciona sin coordenadas, por ejemplo «Sigue el haz desde el emisor y comprueba cómo lo afectan los espejos y filtros». Si en una fase posterior falla solo la redacción generativa, usar la plantilla contextual del diagnóstico. Registrar únicamente la ayuda que se entrega, incluso cuando se activa un respaldo.

### Cupo de ayuda contextual

El valor inicial propuesto de `max-hints` es **3 pistas contextuales confirmadas por intento**. Cada `HELP` contextual aceptado por el servidor consume una unidad del cupo de su `sessionId`. Las solicitudes sin entrega, los recibos sin consumir, los reintentos, los descartes y el respaldo estático no consumen cupo. Una pista estática entregada sigue registrándose como `HELP` para la rúbrica vigente.

El cupo se mantiene al recargar o restablecer el tablero dentro de la misma sesión. El backend busca primero el recibo de un reintento idéntico y verifica el cupo antes de emitir un recibo nuevo. Al aceptar el `HELP`, comprueba el cupo de nuevo en la misma transacción que consume el recibo. Si ya se agotó, acusa el descarte sin incrementar `helps` y permite continuar la secuencia. La interfaz informa del límite y permite al estudiante pedir la pista estática. La frecuencia y la concurrencia de las solicitudes se limitan por separado.

### Origen de la ayuda contextual

`RULE_BASED` es un dato del recibo emitido por el servidor. Para confirmar una pista contextual, el cliente envía una acción `HELP` con `sequence` y `hintId`, y omite `source`. El backend valida el recibo y toma de él el origen para el registro. Si el cliente declara `RULE_BASED` en una acción, el backend la rechaza. La acción que aplica `BoardRules` usa el `HELP` existente sin introducir un origen nuevo en su lista de valores admitidos. Las ayudas estáticas conservan `source=STATIC` y su contrato actual.

## Piloto y criterios de aceptación

Comparar pista estática y contextual en retos oficiales seleccionados. Definir antes del piloto qué cuenta como siguiente acción pertinente y usar después un reto equivalente sin ayuda. Medir por separado la acción pertinente, la resolución autónoma posterior y la frecuencia de fallos o respaldos. El registro de partidas y pistas permite observar el proceso. Atribuir una mejora de aprendizaje requiere un diseño de evaluación acordado con docentes.

Registrar los datos mínimos para esa evaluación, como fuente, tipo, grado, revisión y desenlace de la solicitud. Para una investigación con estudiantes, definir antes de la recopilación los permisos, el acceso y la retención. Trabajar con una exportación seudonimizada y excluir cuentas de prueba.

Antes del piloto, comprobar:

- El mensaje corresponde a un estado reproducible del tablero, respeta su grado y usa coordenadas válidas cuando las incluye.
- Una sesión ajena, finalizada o fuera del alcance no puede solicitar pistas contextuales.
- Cambiar el tablero, reiniciar o salir descarta las respuestas antiguas y conserva la jugabilidad.
- Una solicitud repetida, una respuesta obsoleta o una falla sin entrega producen los efectos de registro previstos. Una pista de respaldo entregada cuenta una vez para `HELP` y deja intacto el cupo contextual.
- La tercera entrega contextual agota el cupo inicial. Un reintento devuelve el mismo resultado y una nueva entrega contextual no incrementa el contador. Una acción con `RULE_BASED` declarado por el cliente se rechaza.
- El servidor sigue validando el resultado de la partida con las reglas y la rúbrica vigentes.

## Pasos de implementación en Neon Flow

### 1. Extraer el diagnóstico en el dominio del backend

En [`BoardRules`](../../backend/src/main/java/com/pipre/backend/domain/entities/game/BoardRules.java), extraer el recorrido que hoy usa la comprobación de victoria de Neon Flow. Compartir el recorrido entre la validación existente y el diagnóstico, de modo que los dos interpreten igual la detención, el color y los receptores. El diagnóstico devuelve un motivo tipado y, cuando corresponde, una celda relevante. Las plantillas de texto y la elección del grado quedan en la capa de aplicación. Verificar con los casos del catálogo que el cambio conserva las victorias válidas y que un tablero resuelto o sin diagnóstico fiable no recibe una causa inventada.

### 2. Añadir el caso de uso de solicitud

Exponer la ruta propuesta bajo [`GameSessionController`](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/GameSessionController.java). Reutilizar la resolución del estudiante autenticado, la comprobación de propiedad y la lectura de sesión y plantilla de [`GameSessionsService`](../../backend/src/main/java/com/pipre/backend/application/useCases/GameSessionsService.java). Mantener el orden de bloqueo existente, primero estudiante y luego sesión. Validar el alcance y la revisión antes de emitir una pista nueva. Si la misma solicitud ya produjo un recibo, devolver ese resultado al propietario. El frontend decide si aún puede usarlo.

Persistir un recibo por `(sessionId, requestId)` con la huella de la solicitud, la revisión, el diagnóstico, el grado y el identificador de pista. La base debe impedir duplicados incluso ante solicitudes simultáneas. El grado se calcula con las ayudas entregadas para el diagnóstico vigente, identificado por su motivo y elemento relevante. La revisión sirve para comprobar vigencia. Una acción `HELP` avanza la revisión sin cambiar ese diagnóstico ni reiniciar el grado. Emitir un recibo de solicitud todavía no modifica la revisión ni el contador de ayudas.

### 3. Integrar la entrega en la secuencia verificada

Ampliar el contrato de [`GameSessionAction`](../../backend/src/main/java/com/pipre/backend/application/commands/GameSessionAction.java) con `hintId` para la ayuda contextual. Usar la ruta existente `/actions`. Primero aplicar el manejo actual de reintentos por secuencia. En una acción contextual nueva, validar el recibo, su sesión, su revisión y su estado de uso. Consumir el recibo, aplicar `HELP` y guardar la respuesta de la acción en la misma transacción. Mantener compatible el `HELP` estático de clientes anteriores.

Si una ayuda previamente encolada llega obsoleta o con un recibo ya consumido, devolver un acuse explícito de descarte sin incrementar `helps`. Para esa acción bien formada, registrar el acuse en la secuencia y avanzar la revisión de la cola sin alterar el tablero. Así, una pista descartada no impide enviar el siguiente movimiento o confirmar la victoria. Rechazar recibos inexistentes o ajenos.

### 4. Conectar el botón de pista con la sesión del frontend

Añadir el método y los tipos de solicitud en [`gameProgressService`](../../frontend/src/infrastructure/api/gameProgressService.ts), usando el cliente autenticado existente. Exponer la operación en [`useValidatedGameSession`](../../frontend/src/ui/components/common/useValidatedGameSession.ts) y coordinarla en [`ValidatedGameSession`](../../frontend/src/infrastructure/store/validatedGameSession.ts). Esa capa conoce la última revisión confirmada, la cola de acciones pendientes y la finalización. Tomar la revisión cuando la cola esté al día. Mientras llega la pista, permitir acciones normales. Antes de aceptar el resultado, comprobar que la sesión siga activa y que no hayan ocurrido cambios locales desde la solicitud. Si la pista sigue vigente, encolar `HELP` mediante el mismo mecanismo que usan los movimientos.

Cambiar el `onHint` de [`NeonFlowStage`](../../frontend/src/ui/components/NeonFlow/NeonFlowStage.tsx) para llamar al flujo de sesión cuando el piloto aplique. Reutilizar el botón **Pista** y el aviso existente. Diferenciar el estado de consulta del de sincronización de movimientos. Ante un fallo, reutilizar una sola vez el respaldo estático si la partida sigue activa. Contar como ayuda verificada la acción confirmada por el servidor. Si se registra que el mensaje llegó a verse, tratar ese dato como una observación separada de la rúbrica.

### 5. Validar y habilitar el piloto

Ampliar [las pruebas de sesiones del backend](../../backend/src/test/java/com/pipre/backend/application/useCases/GameSessionsServiceTest.java) y [las pruebas del flujo de sesión en el frontend](../../frontend/tests/unit/ValidatedGameSession.test.tsx). Cubrir concurrencia, permisos, revisión obsoleta, consumo único, respuesta perdida, respaldo y continuidad de la cola. Añadir una comprobación E2E en el [entorno desechable](Pruebas_Integrales.md#aplicación-completa-aislada) que abra un reto oficial desde el catálogo, pida ayuda, siga jugando y compruebe la victoria y el registro de la ayuda. Verificar además que los flujos excluidos y el modo con el piloto apagado conservan su comportamiento.

Activar el piloto únicamente para el grupo y los retos acordados cuando pasen los criterios de aceptación. Revisar los resultados con docentes antes de habilitar la segunda etapa. Una futura llamada a un proveedor debe quedar fuera de las transacciones de juego y tener límites explícitos de latencia y consumo.

## Segunda etapa: TetriLogic

La ayuda guiará al estudiante para que interprete los conteos de las dos dimensiones antes de elegir dónde colocar, mover o devolver una pieza. La primera versión de esta etapa ofrecerá pistas redactadas a partir del tablero confirmado. Depende de que el flujo de sesión, recibos y ayudas de Neon Flow pase sus criterios técnicos y de que se revisen sus resultados con docentes.

### Diagnóstico y grados de ayuda

Comparar las celdas ocupadas con cada objetivo definido en `constraints`. Conservar por línea el eje, el índice, el objetivo y la ocupación. Un objetivo cero se evalúa como cualquier otro. Una línea sin objetivo se omite. Distinguir déficit, exceso y coincidencia. Si hay varias diferencias, elegir una con un criterio estable y cubrir ese desempate con pruebas. Con todos los objetivos satisfechos, no emitir una pista de corrección ni confirmar una victoria desde el tutor.

| Grado | Ejemplo con la fila 2 en 2/3 |
|---|---|
| 1. Regla | Compara las casillas ocupadas con el objetivo de cada fila y columna. |
| 2. Ubicación | A la fila 2 le falta ocupar una casilla. |
| 3. Pregunta | ¿Qué columnas de la fila 2 tienen casillas libres y todavía están por debajo de su objetivo? |

Para un exceso, el mensaje puede indicar «La columna 3 tiene una casilla ocupada de más. ¿Qué pieza podrías mover sin dejar corta una fila?». El tutor describe el estado y deja que el estudiante explore. Un exceso intermedio sigue siendo una jugada permitida.

### Pasos e integración

1. **Reutilizar el cálculo del backend.** En [`BoardRules`](../../backend/src/main/java/com/pipre/backend/domain/entities/game/BoardRules.java), compartir entre la comprobación `solvedTetri` y el diagnóstico el conteo de ocupación y la lectura de objetivos. Mantener la validación geométrica vigente. Usar [`lineGoals.ts`](../../frontend/src/application/usecases/tetrilogic/lineGoals.ts) y sus pruebas para contrastar los dos ejes y los objetivos cero. El servidor calcula la pista a partir de las piezas persistidas.
2. **Extender el caso de uso existente.** Reutilizar `POST /api/v1/game-sessions/{sessionId}/hints` con el mismo cuerpo. Seleccionar el diagnóstico según el juego persistido y admitir TetriLogic solo cuando la sesión pertenezca al piloto de `c002`. Añadir a la respuesta un `targetLine` opcional con `axis` (`row` o `column`) e `index` desde cero. Validar que la línea esté dentro del tablero y tenga objetivo definido. Los mensajes numeran desde uno y el contrato conserva `targetCell` para Neon Flow.
3. **Conectar el tablero activo.** Añadir el botón **Pista** a [`FreeTetriLogicStage`](../../frontend/src/ui/components/TetriLogic/FreeTetriLogicStage.tsx) cuando aplique el piloto. Reutilizar el cliente, el aviso y el control de revisión de `useValidatedGameSession`. Mantener disponibles el arrastre, el giro y la devolución de piezas. Si el estudiante modifica el tablero o cambia de partida mientras espera, descartar la respuesta. Ante un fallo con la partida aún vigente, usar un mensaje estático propio de TetriLogic, como «Compara cada indicador con su objetivo y revisa ambos ejes».
4. **Reutilizar el registro y la secuencia.** Registrar una sola acción `HELP` por entrega válida en la cola verificada. Mantener separados el origen de la pista y la métrica `pistasIa`. Antes de habilitar el piloto, informar al estudiante de que usar una pista puede influir en sus estrellas bajo la rúbrica vigente. Conservar los recibos idempotentes y los acuses de descarte para que una pista obsoleta no detenga los movimientos ni la confirmación automática.
5. **Validar y habilitar por separado.** Probar déficit, exceso, objetivo cero, línea sin objetivo y tablero resuelto. Comprobar el comportamiento ante reinicio, arrastre, respuesta tardía y reintento. Repetir las pruebas de solución de los 30 niveles y verificar en el entorno E2E que se puede pedir una pista, continuar y completar un reto oficial. Validar que Neon Flow y los flujos fuera del piloto conservan su comportamiento. Medir por separado la siguiente acción pertinente y la resolución autónoma posterior en TetriLogic.

### Restricciones de la segunda etapa

- Admitir partidas activas de estudiantes propietarios que correspondan a una actividad oficial de `c002` con su plantilla canónica `tetrilogic-v2-N`. Usar una habilitación independiente de Neon Flow, desactivada por defecto y limitada al grupo y a los retos acordados. Excluir prototipos, práctica independiente, diario y pruebas de docentes o administradores.
- Usar la geometría, el inventario y los objetivos del tablero persistido. Preservar límites, colisiones y libertad de manipulación. El tutor nunca añade bloqueos de celdas, orden, contactos, orientaciones obligatorias ni restricciones al movimiento. Mantener intactas las 30 plantillas v2 y sus migraciones publicadas.
- Limitar las primeras pistas a reglas, líneas y preguntas. Una futura sugerencia concreta de pieza, posición o giro requeriría validación previa con el motor y revisión de que no revele la solución. Mantener fuera del diagnóstico las soluciones de pruebas y las condiciones históricas.
- Conservar la autenticación, CSRF, límites de consulta, reglas de retención y revisión de tablero de la primera etapa. La pista no modifica el tablero, los requisitos de victoria, la fórmula de estrellas, los puntos, los desbloqueos ni el XP. La acción `HELP` de una partida nueva se evalúa mediante la rúbrica existente.
- Esta etapa reutiliza reglas y plantillas de mensajes. El ML, la conexión con un proveedor y los cambios en `data-science` quedan fuera de su alcance.
