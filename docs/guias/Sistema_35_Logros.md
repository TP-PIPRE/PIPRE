# Sistema de 35 logros

**Implementado y validado localmente el 02/11/2026.** Esta guía describe el contrato vigente. El [informe de entrega](../informes/Implementacion_35_Logros_2026_11_02.md) distingue pruebas automatizadas, revisión en navegador y límites. [Estado actual](../ESTADO_ACTUAL.md) · [Contratos](Contratos_Frontend_Backend.md).

## Alcance y origen de los datos

El catálogo nuevo contiene exactamente **35 logros activos**, con códigos L01–L35. Los diez anteriores permanecen en la base como historial inactivo, con sus desbloqueos y XP conservados; no se reinterpretan como logros nuevos. No se importan victorias desde scores antiguos ni desde la telemetría declarada por el navegador.

Cada victoria puntuable nace de una sesión persistida: el servidor determina juego, nivel, plantilla oficial, inicio y final, reproduce acciones y valida la solución con las reglas actuales. El progreso se identifica por estudiante, juego y nivel 1–30; los alias compatibles apuntan al mismo nivel y los prototipos anteriores no cuentan de nuevo.

TetriLogic conserva límites, colisiones y todos los conteos definidos de filas/columnas, incluidos ceros. Permite excesos intermedios y no recupera contactos, orden, bloqueos u orientaciones históricas. Neon Flow conserva trayectoria, color y detención del haz en receptores. Las estrellas califican una partida confirmada; no cambian las reglas para manipular o resolver el tablero.

## Condiciones del catálogo

| Código | Categoría | Condición |
|---|---|---|
| L01…L30 | Progreso | Para cada N, completar satisfactoriamente el nivel N de **ambos** juegos. No exige el mismo día ni un orden entre juegos. |
| L31 | Constancia | Completar el reto diario durante 5 fechas calendario consecutivas. |
| L32 | Maestría | Tener mejor calificación de 3 estrellas en cada uno de los 30 TetriLogic. |
| L33 | Velocidad | Tres victorias consecutivas del mismo juego N, N+1 y N+2, con menos de 180 segundos entre el inicio servidor de la primera y la finalización de la tercera; sin intercalar niveles ajenos a esa secuencia. |
| L34 | Constancia | Completar el reto diario durante 10 fechas consecutivas; también corresponde L31. |
| L35 | Maestría | Tener mejor calificación de 3 estrellas en cada uno de los 30 Neon Flow. |

Repetir una victoria no duplica progreso, logro ni XP. Una calificación inferior conserva la mejor anterior. Las calificaciones individuales de los dos juegos se guardan aunque el logro conjunto siga bloqueado.

## Rúbrica de estrellas implementada

No existía una rúbrica integrada y verificable para los simuladores. La versión nueva `game-stars-v1` usa acciones y contadores de la sesión del servidor:

| Estrellas | Condición sobre una solución válida |
|---|---|
| 3 | Sin reinicios, ayudas ni comprobaciones fallidas; coste dentro del presupuesto base. |
| 2 | Hasta dos reinicios y dos ayudas; coste dentro del doble del presupuesto base, cuando no cumple tres estrellas. |
| 1 | Cualquier otra solución válida. |

Presupuesto base: TetriLogic `4 × cantidad de piezas del inventario`; Neon Flow `2 × (ancho + alto)`. El coste suma colocaciones, rotaciones de piezas colocadas y devoluciones confirmadas. Los giros de previsualización en bandeja o con `source=DRAFT` no mueven una pieza colocada ni aumentan ese coste; la colocación final valida el giro absoluto. Las acciones rechazadas se cuentan aparte, sin penalizar estrellas. Un conteo intermedio excesivo de TetriLogic no es un fallo. Es una regla de gamificación reproducible, no una medida validada de aprendizaje ni un óptimo matemático.

El sistema no concede automáticamente tres estrellas por cualquier finalización ni acepta estrellas, éxito o duración enviados como autoridad por el cliente. No se conceden notas de curso, XP por repetir un nivel ni progreso de lecciones de forma implícita.

## Sesiones e idempotencia

Contrato del canal verificado, separado de `POST /telemetry`:

```text
POST /api/v1/game-sessions
  studentId, clientSessionId, game, levelTemplate, activityId?, dailyChallengeId?
  → sessionId, game, levelNumber, levelTemplate, ruleset, startedAt, status, state, revision

POST /api/v1/game-sessions/{sessionId}/actions
  sequence, type, datos tipados de la acción
  → sesión y revisión actualizadas

POST /api/v1/game-sessions/{sessionId}/complete
  sin resultado, estrellas o fechas del cliente
  → stars, bestStars, completedAt, durationMs, newAchievements, daily
```

Sólo un estudiante puede crear o modificar su propia sesión; la vista previa docente/administrador no concede progreso. `clientSessionId` es un UUID, `sequence` empieza en 1 y los tipos admitidos son `PLACE`, `ROTATE`, `RETURN`, `RESET`, `HELP`, `CHECK` y `REJECT`. Los datos de acción son campos planos (`pieceId`, `x`, `y`, `rotation`, `component`, `color`, `source`), según el juego. No se acepta un tablero final como sustituto de acciones.

Una secuencia repetida con el mismo contenido devuelve la respuesta original; contenido distinto no reemplaza una acción aceptada. Iniciar otra partida abandona la activa anterior sin convertirla en victoria. Reutilizar el UUID de una partida terminada/abandonada no la reactiva. Una confirmación repetida devuelve el mismo recibo y no vuelve a entregar XP. Una comprobación de finalización con tablero incompleto registra el fallo y devuelve 400; no concede victoria.

El bloqueo por estudiante y las restricciones únicas de base serializan confirmación, mejor calificación y desbloqueos. Los tiempos proceden del servidor y se conservan con su sesión, aunque se cierre el navegador. Una pérdida de red no se presenta como progreso confirmado; el cliente mantiene un estado explícito y permite reintentar con el mismo identificador/secuencia. No hay reanudación del tablero tras recargar ni entrega garantizada de acciones aún en memoria. Tras una victoria guardada, se puede seguir explorando localmente; Restablecer/Reiniciar abre un intento nuevo para mejorar estrellas.

Para L33 se revisan también los inicios persistidos entre las tres victorias. Se permiten reintentos del siguiente nivel esperado; su tiempo queda incluido en los 180 segundos. Iniciar un juego o nivel ajeno rompe la secuencia, aunque se abandone sin victoria. La comparación usa instantes, sin redondear a segundos enteros.

## Reto diario y calendario

El servidor publica un reto identificable para cada fecha en **`America/Lima`**, reutilizando el catálogo oficial con solución comprobada. No acepta una fecha arbitraria del navegador. Sólo una finalización por estudiante y fecha cuenta para la racha.

La racha actual continúa si la última fecha completada es hoy o ayer; un día omitido la interrumpe. La mejor racha conserva el máximo histórico. Abrir la plataforma no equivale a completar un reto. Una victoria después de la medianoche puede conservar el progreso del nivel, pero no se traslada automáticamente al reto diario de otra fecha.

```text
GET /api/v1/daily-challenges/today?studentId=...
GET /api/v1/profile/{idStudent}/game-progress
```

El diario no depende de que se haya creado una actividad académica nueva ni inventa un ID de actividad. El acceso del estudiante resuelve la plantilla oficial del día y la sesión conserva su identidad diaria.

La asignación es determinista: `floorMod(fecha.toEpochDay(), 60)` recorre primero los 30 Neon Flow y después los 30 TetriLogic; el nivel es `índice % 30 + 1`. Se persiste por fecha y reutiliza tableros comprobados. No requiere IA ni genera geometrías nuevas.

## Perfil, XP y compatibilidad

El perfil muestra los 35 logros activos, categorías, condiciones, estado y fecha confirmada. Los desbloqueos nuevos notifican y actualizan el perfil sólo después de responder el backend. Un usuario nuevo puede consultar sus logros bloqueados sin pertenecer a un grupo.

El saldo de XP es global por estudiante; pertenecer a varios grupos no multiplica la recompensa. Se conserva el saldo histórico sin sumar membresías duplicadas. Los puntos y posiciones del ranking existente mantienen su contrato. Las recompensas nuevas se conceden una sola vez por logro: L01–L30 100 XP cada uno, L31 100, L33 150, L34 200 y maestrías 300 cada una. Los valores y desbloqueos del catálogo retirado se mantienen como antecedentes.

El historial distingue datos antiguos de resultados verificados y no convierte un score antiguo en nuevas estrellas o XP. El frontend no usa un historial local compartido entre usuarios como sustituto de registros del servidor.

## Consulta para la investigación

La plataforma continúa funcionando fuera de los **16 días calendario** de observación. No borrar ni reiniciar historial para medir la intervención.

```text
GET /api/v1/profile/{idStudent}/achievements/export?from=YYYY-MM-DD&to=YYYY-MM-DD
```

La consulta debe devolver para L01–L35 el estado binario actual y el estado binario de desbloqueo **dentro del periodo**, además de ambas cantidades. Las fechas inclusivas de Lima se traducen al intervalo de instantes `[inicio del primer día, inicio del día siguiente al último)`. Un logro anterior permanece desbloqueado pero no cuenta como nuevo durante la intervención. Acceso propio o docente/administrador autorizado; ningún endpoint permite asignar un logro arbitrario.

La [consulta SQL de sólo lectura](../Consultas_35_Logros.sql) permite obtener esas 35 filas desde una conexión de base de datos autorizada. Se parametriza por estudiante y fechas; no exporta nombres ni correos. Un usuario inexistente devolverá el catálogo bloqueado en esa consulta administrativa, mientras que la API valida su existencia. El registro nuevo `unlocked_at_verified` conserva el instante del servidor; no asignar una zona inventada al timestamp de un desbloqueo histórico.

Ejemplo desde una sesión autenticada: consultar `/api/v1/profile/ID/achievements/export?from=2026-11-01&to=2026-11-16` y guardar el JSON recibido. Para SQL: `psql -v student_id=ID -v from_date=2026-11-01 -v to_date=2026-11-16 -f docs/Consultas_35_Logros.sql`. `binary` indica el estado actual; `periodBinary` cuenta sólo el desbloqueo dentro de esa ventana.

## Migraciones y conservación

V18 añade el catálogo activo, progreso, mejores estrellas, rachas, victorias verificadas, cuenta global y libro de XP. Retira del catálogo los diez logros anteriores sin borrarlos. Conserva el máximo histórico de XP/nivel entre membresías, evitando sumar el mismo saldo por cada grupo; las filas originales de membresía no se sobrescriben.

V19 añade sesiones y acciones, recibos idempotentes, una sola sesión activa por estudiante y vínculos de integridad de las victorias. **V1…V19 ya se aplicaron en la base local y quedan congeladas.** Para otro entorno, respaldar y dejar que Flyway aplique las versiones pendientes; no volver a ejecutar los SQL manualmente ni regenerar las migraciones del catálogo.

## Aceptación del lote

- [x] Catálogo activo exacto L01–L35; diez anteriores inactivos y desbloqueos conservados.
- [x] Victoria verificada en los 60 tableros con reglas activas, sin atribuir certeza a la telemetría histórica.
- [x] Progreso conjunto, mejor estrella y maestría con 29 frente a 30 niveles.
- [x] Rachas de 5 y 10 fechas, interrupción, duplicado diario y medianoche Lima: pruebas con reloj controlado, sin cambiar la fecha de la base local.
- [x] L33 en 179 segundos frente a 180, orden, juego, repetición e intercalación.
- [x] Reintentos y confirmaciones simultáneas sin doble progreso, logro ni XP.
- [x] Permisos propios/ajenos y rechazo de éxito, estrellas y fechas falsificados.
- [x] Perfil, notificación, diario y simuladores conectados; revisión responsive en navegador.
- [x] Migraciones nuevas verificadas con historial existente y respaldo local previo.
- [x] Exportación distingue logros previos de nuevos en la ventana de tesis.

`data-science`, modelos, endpoints y proxy de IA permanecen excluidos. No se entregan modelos ML ni se atribuye a las estrellas una validación pedagógica.
