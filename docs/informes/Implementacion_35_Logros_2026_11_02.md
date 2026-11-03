# Implementación de los 35 logros — 02/11/2026

**Entrega local validada**, sobre `Feature/Tetrilogic-avances`, partiendo de `8fc2936`. No incluye commit, push ni despliegue de producción. Se conservaron las modificaciones de la auditoría anterior que ya estaban en el árbol de trabajo. [Estado actual](../ESTADO_ACTUAL.md) · [Contrato y reglas](../guias/Sistema_35_Logros.md) · [Archivos del avance](Archivos_Logros_2026_11_02.md).

## Diagnóstico y decisión

El catálogo anterior tenía diez logros; guardar telemetría no los evaluaba. Los simuladores confirmaban éxito local, mientras que los resultados académicos aceptaban un score del cliente. No existían un diario funcional, mejores estrellas por nivel ni un registro de tiempo de servidor suficiente para L33. La consulta de perfil dependía de una membresía y el historial podía sustituirse por resultados locales compartidos entre usuarios.

Se añadió un canal de sesiones verificadas mediante puertos/adaptadores, sin convertir telemetría o scores antiguos en progreso. El servidor conserva tablero, acciones, inicio, fin y reglas, verifica la solución y adjudica estrellas/logros dentro de la misma transacción. Se reutilizaron configuraciones y soluciones comprobadas de los **30 Neon Flow + 30 TetriLogic**, sin añadir actividades ni modificar sus geometrías.

## Resultado implementado

| Función | Comportamiento entregado |
|---|---|
| L01–L30 | Una victoria de cada juego del mismo número, en cualquier orden/fecha; progreso individual persistente y sin duplicados. |
| L31/L34 | Diario con calendario `America/Lima`; cinco/diez fechas consecutivas, una finalización por estudiante/fecha, racha actual y mejor. |
| L32/L35 | Mejor resultado de tres estrellas en los treinta niveles de cada juego; una partida posterior inferior no lo reduce. |
| L33 | N, N+1, N+2 del mismo juego en menos de 180 segundos de servidor; examina victorias e inicios intercalados. Los reintentos del siguiente nivel esperado mantienen el tiempo transcurrido. |
| Estrellas | Rúbrica versionada `game-stars-v1`, basada en acciones, reinicios, ayudas y comprobaciones fallidas; no concede tres estrellas automáticamente. |
| XP | Una recompensa por logro, con libro de movimientos y saldo global; no se multiplica por grupos ni por reintentos. Se conserva el saldo anterior. |
| Compatibilidad | Diez logros antiguos inactivos, sin borrar ni reinterpretar sus desbloqueos; puntos, posiciones y orden del ranking conservados. |
| Perfil | 35 tarjetas por categoría, condición, fecha Lima, contador x/35 y progreso de 60 niveles; notificación/actualización sólo tras confirmación. |
| Investigación | JSON autenticado y SQL de sólo lectura con L01–L35, binario actual y binario nuevo dentro del periodo inclusivo. Los 16 días no limitan el uso. |

TetriLogic sigue completándose sólo por geometría y conteos de filas/columnas, incluidos ceros. Permite excesos intermedios y no recupera orden, contactos, bloqueos ni giros históricos exigidos. Neon Flow conserva raycast, color y detención en receptores. La gamificación no crea notas académicas, tutor IA ni reglas adicionales de colocación.

El presupuesto de tres estrellas es `4 × inventario` en TetriLogic y `2 × (ancho + alto)` en Neon Flow, sin ayudas/reinicios/comprobaciones fallidas. Los giros de preparación no cuestan movimientos; la colocación final confirma orientación absoluta. La guía detalla dos/una estrellas y recompensas. Esta rúbrica es una decisión técnica reproducible, pendiente de validación pedagógica; no mide por sí misma aprendizaje ni optimalidad.

## Migraciones y seguridad de datos

- **V18__achievements_35_and_progress.sql:** catálogo activo, cuenta global, progreso, mejores estrellas, diario, victorias y ledger de XP. Conserva los diez anteriores como inactivos y el máximo de XP/nivel de las membresías, sin sumarlas ni sobrescribirlas.
- **V19__verified_game_sessions.sql:** sesiones/acciones, recibos idempotentes, una sola partida activa por estudiante y vínculos de integridad.
- V1…V17 y los catálogos congelados no se editaron. **V18/V19 ya se aplicaron localmente y también quedan inmutables.** Otro entorno debe respaldarse y aplicar las migraciones pendientes con Flyway.
- Antes de actualizar se creó un respaldo SQL privado fuera del repositorio. La base local tenía diez logros y cero desbloqueos antiguos. El escenario con desbloqueos previos se comprobó además en PostgreSQL aislado.
- Después del lote y de limpiar los fixtures propios se conservaron **193 filas previas en 15 tablas**, comprobadas por ID/huella de sus campos anteriores. Los únicos cambios de catálogo histórico son los campos nuevos de actividad/condición; no se modificó su contenido original.
- **73 archivos protegidos** conservaron su SHA-256: `data-science`, migraciones anteriores y catálogos congelados. El contenedor IA conservó ID, fecha de inicio y estado detenido.

Las escrituras bloquean primero al estudiante y después la sesión. Las restricciones únicas y los recibos persistidos impiden desbloqueos, finalizaciones diarias o XP duplicados. Sólo el estudiante propietario puede crear, actuar o confirmar una sesión. Docentes/administradores mantienen lectura autorizada y vista previa, sin adjudicarse progreso estudiantil. Los resultados y la telemetría anteriores no conceden L01–L35.

## Endpoints y consumidores

Todas las rutas siguientes tienen prefijo `/api/v1`:

| Ruta | Cambio |
|---|---|
| POST `/game-sessions` | Inicio idempotente con UUID de cliente, plantilla canónica y contexto opcional de actividad/diario. |
| POST `/game-sessions/{id}/actions` | Acción tipada/secuenciada; reproduce reglas y conserva el recibo original para reintentos. |
| POST `/game-sessions/{id}/complete` | Solución del estado servidor, estrellas, mejores estrellas, duración y nuevos logros; confirmación repetida devuelve el mismo recibo. |
| GET `/daily-challenges/today?studentId=...` | Fecha Lima, tablero diario y rachas. |
| GET `/profile/{id}/game-progress` | 60 estados con mejores estrellas y totales. |
| GET `/profile/{id}/achievements/export?from=...&to=...` | Estado actual y nuevos desbloqueos por periodo; lectura propia o de gestión. |
| GET `/profile/{id}`, `/achievements`, `/history` | Adaptación de perfil, catálogo activo e historial sin métricas inventadas. Los sufijos se refieren al mismo perfil. |
| Rankings existentes | Presentan XP/estrellas/racha globales y conservan su contrato de puntos/posición/orden. |

El frontend serializa el inicio y las acciones, conserva identificadores en reintentos y distingue preparando, pendiente, error y guardado. Una sesión abandonada no se reactiva reutilizando el UUID; permite iniciar otro intento. Reiniciar después de guardar crea una nueva sesión para mejorar estrellas. Una respuesta tardía de otro usuario/contexto no sustituye el perfil ni la partida actuales. No se añadió una dependencia de interfaz.

## Validación ejecutada

| Comprobación | Resultado real |
|---|---|
| Frontend, suite completa Vitest | **335/335**, 29 archivos. |
| Backend, suite completa Maven | **246/246**, sin fallos, errores ni omisiones. Maven 3.9.16 local, Java 25 con compilación release 21. |
| PostgreSQL aislado, `verify_achievements_postgres.py` | **29 comprobaciones**: instalación nueva y existente, desbloqueo histórico, XP de varias membresías, restricciones, ciclo de borrado y rollback ante colisión de código. |
| API real + PostgreSQL, `verify_achievements_http.py` | **227 comprobaciones**: los 60 niveles resueltos con reglas servidor, progreso/maestrías/XP, mejora y conservación de estrellas, diario, permisos, persistencia tras login y exportación. |
| Concurrencia real | Ocho confirmaciones simultáneas de la misma sesión: recibo idéntico, una victoria y una recompensa. |
| TypeScript + build Vite | Correctos. JS 741,39 kB / gzip 208,73 kB; sigue la advertencia de chunk mayor de 500 kB. |
| ESLint sobre archivos nuevos/modificados de interfaz | Correcto en el lote; no acredita lint global del repositorio. |
| Ajuste final de redacción del diario | 13/13 pruebas existentes de perfil/diario, nuevo build, ESLint del componente y reconstrucción Docker del frontend correctos. |
| Docker local | Backend/frontend reconstruidos y operativos, V1…V19 aplicadas correctamente. PostgreSQL no se recreó; IA no se inició/reconstruyó. |
| SQL de investigación | 35 filas; con un desbloqueo real de QA, periodo noviembre: actual 1/nuevo 1; ventana futura: actual 1/nuevo 0. |
| Integridad final | Conservación histórica y archivos protegidos, limpieza de fixtures, enlaces documentales, texto y JSON: ver cierre al final del informe. |

Comandos principales, desde sus carpetas correspondientes:

```text
frontend: npm exec vitest run -- --reporter=json --outputFile=...
frontend: npm run build
frontend: npm exec eslint <archivos de interfaz modificados>
backend:  mvn -B -e test
raíz:     python -B scripts/verify_achievements_postgres.py
raíz:     python -B scripts/verify_achievements_http.py
raíz:     python -B scripts/verify_source_integrity.py
```

Se utilizó el ejecutable Maven ya instalado porque el wrapper local de Windows presentaba un problema previo. Los scripts HTTP crean estudiantes con identificadores únicos y eliminan únicamente sus fixtures al finalizar; no fabrican progreso para usuarios reales. Los 227 checks HTTP son comprobaciones del script, no 227 pruebas JUnit adicionales.

### Cobertura de los veinte casos solicitados

| Casos del encargo | Evidencia |
|---|---|
| 1–5: un juego, ambos juegos, orden, repetición y correspondencia 1–30 | `AchievementRulesTest`, `GamificationServiceTest` y soluciones HTTP de los 60 niveles. |
| 6–8: rachas 5/10, interrupción, L31 junto a L34 | Reglas y servicio con `Clock` controlado; duplicado real del diario por HTTP. |
| 9–11: 29 frente a 30, ambas maestrías y mejora de estrellas | Reglas/servicio y HTTP, incluyendo mejora de una calificación inferior y conservación de la mejor. |
| 12–14: 179 frente a 180 segundos y secuencia inválida | Límites de instantes en `AchievementRulesTest`, orden, juegos mezclados, repetidos, reintentos y comienzos intercalados. |
| 15–17: nueva sesión, simultaneidad y falsificación/propiedad | HTTP con reautenticación, ocho requests concurrentes, propietario/ajeno/gestión y tablero incompleto con éxito/estrellas/fecha falsificados. |
| 18–19: catálogo exacto e historial existente | PostgreSQL nuevo/existente y API; prueba de catálogo anterior con desbloqueo, saldo y timestamp conservados. |
| 20: logros previos frente a nuevos del periodo | Servicio con límites Lima, HTTP y ejecución del SQL de sólo lectura sobre dos ventanas distintas. |

### Revisión en navegador

Con un estudiante temporal se verificó:

1. Login y perfil sin grupo: 35 logros bloqueados, categorías y condiciones visibles.
2. Catálogo → Neon Flow oficial 1 → Comprobar: victoria guardada, tres estrellas.
3. Catálogo → TetriLogic 1: seleccionar, girar y colocar tres piezas; coincidencia de ambos ejes, tres estrellas, **L01**, notificación y perfil **1/35**, fecha Lima, 6 estrellas y 100 XP.
4. Progreso por juego **2/60**, con mejores estrellas individuales.
5. Diario publicado para el 02/11: TetriLogic 30; tres piezas con giros, victoria guardada, “Completado hoy”, racha actual/mejor de un día.
6. Historial de las tres victorias con XP reales y sin nota académica inventada; cierre de sesión correcto.
7. Perfil/logros y tablero diario a **320, 390, 768 y 1440 px**, sin desbordamiento horizontal según medidas DOM; captura móvil/escritorio y revisión visual de tarjetas. Consola final sin advertencias/errores registrados.

Se guardaron capturas y reportes JSON/logs fuera de Git, en los artefactos locales de este avance. Las cuentas y partidas temporales se retiraron; no quedan sus filas en sesiones, progreso, diario, logros, XP o telemetría. La revisión de tres tableros en navegador complementa la validación HTTP de los sesenta; no se afirma haber jugado los sesenta manualmente.

## Límites y continuación

- Rachas de cinco/diez días y 179/180 segundos se comprobaron con reloj controlado en pruebas; no se esperaron diez días reales ni se alteró el reloj local.
- La cola de acciones en memoria permite reintentar durante la sesión, pero no reanuda el tablero después de recarga/corte. Un futuro guardado/reanudación requiere contrato propio.
- El servidor verifica acciones y reglas del tablero; eso no certifica identidad humana, ausencia de automatización ni aprendizaje. No prometer antifraude completo o efectos pedagógicos.
- La rúbrica de estrellas requiere piloto con docentes/estudiantes; no es una medida validada del pensamiento lógico. La vista previa y los prototipos no cuentan en las maestrías oficiales.
- Quedan la optimización del bundle, el lint general, lector de pantalla y dispositivo táctil físico, volumen persistente de PostgreSQL y revisión del despliegue público.
- `data-science`, proxy/endpoints IA, modelos y contenedor permanecen excluidos. El [plan ML](../guias/Plan_Implementacion_ML.md) distingue ahora victorias verificadas de observaciones declarativas; no se implementó entrenamiento ni extracción seudonimizada.
- No se entrega el SSD integral ni progreso de lecciones/notas derivado automáticamente de los juegos. No hay pendientes funcionales del lote L01–L35 conocidos tras las validaciones; los límites anteriores quedan documentados para los siguientes sprints.

## Cierre de integridad

Se comprobaron **677 archivos de texto**, sin NUL ni errores de codificación; **312 enlaces locales en 23 Markdown modificados**, sin destinos inexistentes; y **14 JSON estrictos**, sin errores. Los dos `tsconfig` con comentarios se validaron mediante el build TypeScript, no mediante un parser JSON estricto. `git diff --check` no encontró errores de espacios; Git sólo informó sus conversiones habituales LF/CRLF de Windows. No hay cambios preparados en el índice ni commit/push del lote.

Los archivos de este informe no sustituyen los reportes de ejecución ni modifican las cifras de entregas históricas.
