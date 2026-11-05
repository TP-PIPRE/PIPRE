# Implementación de cinco retos diarios — 04/11/2026

Entrega local sin commit, push ni despliegue. Conserva los cambios de seguridad anteriores del árbol de trabajo. [Contrato y límites funcionales](../guias/Retos_Diarios_Procedurales.md).

## Análisis y resultado

El diario anterior seleccionaba una plantilla oficial por fecha, guardaba finalización por estudiante/día y alimentaba las rachas. La generación no existía: era un recorrido determinista de los 60 niveles. Se reutilizaron `BoardRules`, las configuraciones v2, sus soluciones testigo, las sesiones/acciones verificadas, el bloqueo por estudiante, las rachas y los dos componentes de juego.

La implementación añade cinco variantes persistidas por estudiante y fecha. La selección aleatoria está separada de la construcción, con un puerto para sustituir posteriormente la política de selección por una política adaptativa. No contiene modelos ni llamadas externas de IA. Los snapshots completos se reutilizan en consultas posteriores; la API nunca devuelve las soluciones.

El generador traslada geometrías, soluciones y objetivos dentro de dimensiones ampliadas. Cada resultado pasa por las reglas reales del servidor antes de insertarse. El servicio verifica cinco resultados distintos y guarda el conjunto en una transacción. Los IDs diarios separan los resultados procedurales del progreso de los niveles base. La racha conserva una finalización por fecha, al completar cualquiera de los cinco.

La nueva ruta API es `GET /api/v1/daily-challenges/today/set?studentId=...`. La interfaz de Inicio/Perfil presenta cinco accesos y `/simulador?daily=true&challenge=ID` abre el snapshot correspondiente. El reloj servidor fija `America/Lima`; la interfaz renueva al vencer el día, vuelve a consultar al recuperar foco/visibilidad y reintenta periódicamente.

V20 crea tablas de conjuntos/retos y amplía el identificador diario de victorias para UUID. V1–V19 permanecen intactas. No se añadieron actividades académicas ni plantillas fijas: el catálogo sigue en **30 TetriLogic + 30 Neon Flow = 60 oficiales**.

## Validación y evidencias

La línea base anterior de este mismo chat tenía 335 pruebas frontend y 246 backend aprobadas, sobre el árbol con los parches de seguridad. Esta implementación añade pruebas del diario y adapta los tests del módulo al nuevo contrato.

- Suite frontend completa: **337/337**, 30 archivos, con `pnpm exec vitest run --maxWorkers=1`. El primer intento paralelo tuvo dos timeouts en pruebas TetriLogic existentes; se volvió a ejecutar completa con un trabajador, sin cambiar sus límites ni desactivar casos.
- Build TypeScript/Vite: correcto. Conserva la advertencia previa de chunk mayor de 500 kB.
- ESLint sobre archivos frontend nuevos/modificados del módulo: correcto en la comprobación ejecutada; no se desactivaron reglas.
- La prueba de generación recorre **180 variantes**: los 60 niveles con tres combinaciones de márgenes. Cada generación reproduce su testigo con `BoardRules` y exige victoria válida.
- Las pruebas de integración del diario usan JDBC, Flyway y servicios reales sobre H2 en modo PostgreSQL. Incluyen cinco elementos estables al recargar, solicitudes simultáneas (ocho consultas en cuatro hilos), medianoche de Lima, IDs de otro estudiante/día, finalización inválida, finalización válida, mejor estrella, recibo repetido y ausencia de progreso oficial por una variante.
- Las pruebas frontend nuevas verifican renovación por temporizador, consulta al recuperar foco, limpieza de temporizadores y descarte de respuestas tardías de otra cuenta. Los tests del módulo también comprueban selección de cinco accesos y rechazo de una configuración incompatible.

El primer intento backend detectó un constructor de prueba que necesitaba la nueva dependencia. Tras adaptarlo, la suite completa tuvo un único error del nuevo test al volver a sustituir el reloj Mockito: la corrección usa `doAnswer` para evitar ejecutar el stub anterior con el argumento nulo del matcher. No se modificó el reloj del equipo ni el de la aplicación en ejecución.

La última ejecución completa de `mvn -B -ntp test` terminó en **BUILD SUCCESS: 252/252 pruebas**, sin fallos, errores ni omisiones. Las seis ejecuciones nuevas del diario incluyen los tres lotes de variantes y los casos de concurrencia, medianoche y finalización persistida. Tras los ajustes finales frontend se ejecutaron también **87/87 pruebas** de perfil/diario, renovación y controles Neon Flow/TetriLogic; no se suman a las 337 como casos nuevos. El build final y ESLint de todos los archivos frontend modificados pasaron.

Se verificaron los 19 SQL publicados contra HEAD normalizando únicamente los finales de línea del checkout Windows, los dos catálogos oficiales y `data-science`: sin cambios. `git diff --check` y los enlaces locales nuevos son correctos.

Los logs de esta revisión quedan en `backend/target/daily-*.log`, ignorados por Git. No se aplicó V20 a la base de la aplicación en ejecución, no se reconstruyeron sus contenedores ni se modificaron datos reales. La instalación requiere arrancar el backend actualizado para que Flyway aplique V20 y publicar el frontend correspondiente.

## Límites preservados

No se ejecutó Cypress, revisión visual de navegador ni PostgreSQL real en este lote. La migración y la concurrencia se probaron en H2; no se presentan como pruebas PostgreSQL. La recarga conserva retos, completados y mejores estrellas, pero no reanuda las piezas de una partida parcial, función que tampoco existía anteriormente. No se otorgan notas académicas ni XP por repetir tableros. La dificultad es una clasificación inicial por nivel base, no una estimación de aprendizaje.

`data-science`, sus modelos, endpoints y proxy se conservan. No se reactivan reglas históricas de TetriLogic ni se cambia el catálogo oficial. Los cambios de seguridad de la tarea anterior continúan presentes y no se atribuyen a este módulo.

## Verificación posterior solicitada: Docker y ambos simuladores

También el 04/11/2026, después de la entrega inicial, se realizó la verificación en el Docker local. Esta sección actualiza los límites anteriores sobre PostgreSQL/despliegue local; no afirma una publicación en producción ni revisión visual de navegador.

- Se respaldó PostgreSQL antes de actualizar. El respaldo está en `backend/target/`, ignorado por Git, y no debe incorporarse al repositorio.
- Se reconstruyeron y actualizaron **sólo backend/frontend** con `docker-compose.local.yaml`, conservando los puertos **8081/5173**, las credenciales/configuración existentes y el contenedor/volumen PostgreSQL. No se inició ni modificó IA.
- Flyway aplicó **V20 en PostgreSQL real**, correctamente. El backend arrancó con Boot 3.5.16 y Tomcat sin errores.
- Backend/frontend están `running`, sin reinicios inesperados; PostgreSQL está `healthy` y `pg_isready` confirma que acepta conexiones. Los logs de los tres contenedores desde la actualización contienen **cero líneas de error operativo**. Esto es una observación de esta ventana de verificación, no una garantía futura.
- Frontend y bundle servido responden HTTP 200; el JavaScript incluye `/daily-challenges/today/set` y apunta a `http://localhost:8081`.
- Se reforzó `RandomDailySelectionPolicy`: cada conjunto nuevo incluye dos retos de cada simulador y un quinto aleatorio, sin repetir bases. Los conjuntos existentes se conservan. Un test verifica cinco bases distintas y reparto 2+3 en 365 selecciones.
- Se amplió la prueba de finalización procedural para **Neon Flow y TetriLogic**. El lote focalizado termina en **8/8 pruebas aprobadas**, incluidos generación de 180 variantes, medianoche, concurrencia y persistencia.
- El script reproducible [verify_daily_docker.mjs](../../scripts/verify_daily_docker.mjs) pasó **66 comprobaciones HTTP/PostgreSQL** contra el backend Docker: ocho consultas concurrentes reutilizan el mismo conjunto de cinco; ambos simuladores están presentes; se reproducen y validan las **cinco victorias**, con acciones legales; reintentar inicio/finalización es idempotente; recargar conserva IDs/configuraciones/completados/mejores estrellas; las cinco victorias cuentan como una fecha de racha y no conceden progreso oficial; accesos sin sesión o a otro estudiante se rechazan.
- La identidad temporal QA se eliminó con coincidencia exacta de ID y correo. La consulta posterior confirma **cero cuentas** del prefijo exclusivo `daily-docker-` en la base.

Artefactos ignorados: `backend/target/daily-docker-http.json`, `daily-both-games-tests.log`, `daily-docker-build.log`, `daily-docker-frontend-local-build.log` y logs finales de backend/frontend/PostgreSQL. La prueba puede repetirse con `node scripts/verify_daily_docker.mjs`; admite `PIPRE_QA_BASE_URL` sólo para hosts locales. Crea y limpia su propia identidad QA.
