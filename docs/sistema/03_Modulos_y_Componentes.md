# 3. Módulos y componentes

**Actualizado: 30/10/2026.** [Manual](README.md) · [Estado actual](../ESTADO_ACTUAL.md).

## Autenticación y currículo

`AuthAdapter` consume `POST auth/login`, recibe datos del usuario y deja al navegador gestionar la cookie JWT HttpOnly. La prioridad del rol de navegación es administrador, docente, estudiante. Los permisos efectivos los aplica el backend; los metadatos visibles no los sustituyen.

El currículo conserva curso → módulo → lección → actividad. `DocenteRetosPage` permite elegir entorno y plantilla, crear estructura y guardar metadatos/misiones. Una actividad sin plantilla reconocida permanece explícitamente pendiente.

## Entrada al simulador

| Ruta o contexto | Comportamiento |
|---|---|
| `/simulador` | Práctica TetriLogic independiente, con selector de configuraciones. |
| `/simulador/:courseId?activity=:idActivity` | Lee actividades del curso, comprueba pertenencia y abre la plantilla de esa actividad. |
| Curso `c001` o `c002` | Sigue la resolución por actividad; no es un alias que omita el backend. |
| Alias `1`, `neonflow`, `logica` | Acceso compatible a práctica Neon Flow. |
| Alias `2`, `tetrilogic`, `patrones` | Acceso compatible a práctica TetriLogic. |
| Actividad inexistente, ajena o plantilla desconocida | Aviso específico; no reemplaza el tablero por otro. |

## Neon Flow

`NeonFlowStage`, `NeonBoard` y `ComponentTray` presentan componentes ópticos y controles. `raycast` calcula el recorrido; `neonSolved` verifica receptores y color. `PersistedNeonFlowStage` verifica las plantillas v2 descargadas. El contador y la pista estática no acreditan una consulta IA. [Mecánicas](../simuladores/NeonFlow.md).

## TetriLogic

`TetriLogicStage` abre `FreeTetriLogicStage`, cuyo nombre se conserva por compatibilidad. Usa `freePlayReducer`, `useFreePieceInteraction`, `Board`, `PieceTray` y `PieceSurface`. `lineGoalsMet` comprueba geometría y conteos exactos; la confirmación no bloquea nuevas manipulaciones.

El catálogo conserva condiciones históricas adicionales, pero el modo activo no las evalúa. `HistoricalTetriLogicStage` pertenece a las pruebas de compatibilidad; no representa la experiencia actual de las rutas. [Reglas](../simuladores/TetriLogic_Filas_Columnas.md).

## Telemetría y paneles

`useAttemptTrace` observa sólo sesiones estudiantiles válidas. `AttemptTrace` registra eventos semánticos, estado inicial/final y contexto; una cola por estudiante reintenta el mismo contenido. En el backend intervienen `TelemetryController`, `SaveAttemptService` y `TelemetryPersistenceAdapter`.

El contrato admite `SUCCESS`, `FAILED`, `ABANDONED`; el flujo actual cierra episodios por éxito o abandono. Una comprobación fallida no se convierte automáticamente en un episodio `FAILED`.

Las pantallas de resultados, ranking, perfil, métricas y ayuda conservan sus APIs académicas. Guardar telemetría no actualiza automáticamente esas APIs. Los datos históricos de demostración y las cuentas ficticias requieren separación antes de un análisis real. [Contratos y trazabilidad](../guias/Contratos_Frontend_Backend.md).
