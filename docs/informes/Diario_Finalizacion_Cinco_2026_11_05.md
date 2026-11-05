# Interfaz y finalización del diario — 05/11/2026

Implementado y verificado en Docker local. Sin commit ni push. Esta entrega sustituye la regla anterior «cualquiera de cinco acredita el día» por **cinco ejercicios validados = diario completado**. [Contrato vigente](../guias/Retos_Diarios_Procedurales.md).

## Cambios

- Inicio/Perfil muestran un único acceso y el progreso general; se retiró de la vista el listado inferior `DailySetList`. No se borran ni regeneran ejercicios.
- El simulador muestra sólo el ejercicio disponible. Tras la confirmación servidor ofrece continuar con el siguiente. Un enlace antiguo a un ejercicio futuro no permite previsualizarlo; el servidor también rechaza iniciar un ejercicio con anteriores aún pendientes.
- Cada ejercicio conserva primer inicio, finalización y mejor estrella. V21 añade `started_at` y recupera el primer inicio de las sesiones existentes. Los estados son `PENDING`, `IN_PROGRESS` y `COMPLETED`.
- `/today/set` publica además conteo, porcentaje, estado y finalización calculados en backend. El progreso global es 0/5 pendiente; 1–4/5 en progreso; 5/5 completado. Un inicio sin victoria no incrementa el porcentaje.
- Sólo después de cinco victorias verificadas se llama a la acreditación idempotente de la fecha. Una partida del diario antiguo sigue siendo jugable, pero ya no puede acreditar una nueva fecha diaria por sí sola. Los bloqueos por estudiante, recibos y restricciones únicas evitan duplicar finalizaciones o recompensas.
- El frontend consulta de nuevo el conjunto tras inicios/confirmaciones servidor; el indicador y el acceso al siguiente ejercicio se actualizan sin recarga manual. La barra usa completados persistidos; no se concede éxito por cambios locales.
- Se conservan acreditaciones y XP históricos. Una acreditación del día actual procedente de la regla anterior no se presenta como completada ni suma ese día a la racha actual mientras su conjunto esté incompleto. No se recalifican fechas anteriores.

No se modificaron `ProceduralDailyGenerator`, `RandomDailySelectionPolicy`, catálogos, soluciones testigo ni las reglas de validación de ambos juegos. No se eliminaron ejercicios ni se tocaron IA, modelos, proxy o `data-science`. V1–V20 permanecen inmutables; V21 ya está aplicada en PostgreSQL local.

## Validación ejecutada

| Comprobación | Resultado |
|---|---|
| Suite frontend completa, `vitest run --maxWorkers=1` | **345/345**, 31 archivos |
| Suite backend completa, Maven en Java 21 | **253/253**, sin fallos, errores ni omisiones |
| Verificación frontend posterior de flujo, renovación y sesiones | **22/22**, tres archivos; no se suman como casos nuevos |
| TypeScript/build Vite | Correcto; aviso previo de bundle grande conservado |
| ESLint de archivos frontend modificados | Correcto |
| Build Docker backend/frontend | Correcto |
| Flyway en PostgreSQL real | V21 aplicada correctamente; arranque sin errores |
| HTTP/PostgreSQL contra Docker, `scripts/verify_daily_docker.mjs` | **88 comprobaciones** aprobadas |

El test de integración recorre los cinco ejercicios de ambos juegos con acciones y soluciones comprobadas. Comprueba cada paso 0→20→40→60→80→100 %, ausencia de acreditación en 1–4, acreditación en 5, estado individual, persistencia, recibos repetidos y separación respecto del progreso oficial. Después avanza el reloj de prueba al día siguiente: el nuevo diario está pendiente y el conjunto anterior conserva sus cinco completados. No se cambia el reloj del sistema.

Los tests frontend verifican los seis estados de la tabla de progreso, ausencia de enlaces inferiores y selección anticipada, restauración desde el conjunto persistido, avance tras confirmación y pantalla final sin tablero adicional. Una bandera legacy `completed=true` no basta para mostrar el diario completo si sólo hay 2/5 ejercicios.

La prueba real de Docker genera cinco ejercicios con ambos simuladores, reproduce sus cinco soluciones, verifica los estados por etapa y cierra/reabre sesión tras 2/5: IDs y 40 % permanecen. Ejecuta cuatro confirmaciones concurrentes del quinto ejercicio y recibe el mismo resultado, con una sola fecha acreditada. También conserva snapshots al recargar, rechaza accesos ajenos y evita progreso académico/oficial implícito. La identidad QA se elimina al terminar mediante coincidencia exacta de ID/correo.

Se respaldó PostgreSQL antes de actualizar. Se recrearon únicamente backend/frontend, conservando los puertos **8081/5173**, las credenciales y el contenedor/volumen PostgreSQL. Los tres contenedores están en ejecución con cero reinicios inesperados; PostgreSQL está saludable. No se inició IA.

El primer intento backend detectó una referencia incorrecta al reloj en un test adaptado de rachas; se corrigió antes de la suite completa aprobada. No se desactivaron casos ni se modificaron umbrales para obtener esos resultados.

## Evidencias y límites

Logs y respaldo quedan ignorados en `backend/target/`: `daily-five-backend-final.log`, `daily-five-frontend.log`, `daily-five-targeted.log`, `daily-five-lint.log`, `daily-five-build-final.log`, `daily-five-docker-build.log`, `daily-five-docker-backend.log`, `daily-docker-http.json` y `daily-pre-v21.sql`. No incorporar respaldos ni datos de sesión a Git.

No se ejecutó Cypress ni una inspección visual manual de navegador en este lote. Las comprobaciones de interfaz son DOM/componentes y compilación; las de persistencia/validación incluyen PostgreSQL y backend Docker reales. Se conserva la limitación anterior de no rehidratar piezas de partidas parciales: al volver se mantiene el ejercicio en progreso y todos los completados, pero se inicia otro intento para ese ejercicio. No se declara implementada la reanudación exacta del tablero.
