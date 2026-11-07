# Auditoría integral de backend y frontend

**Fecha: 06/11/2026. Entorno: Windows, Docker Desktop y bases de pruebas desechables.** Se revisaron los módulos accesibles, se ejecutaron las suites y la aplicación completa y se corrigieron siete defectos del frontend con regresiones. La base de la aplicación, el catálogo, las migraciones V1–V21 y `data-science/` permanecen intactos. No se hicieron commits, pushes ni despliegues.

Este informe complementa la [auditoría backend del 05/11](Auditoria_Backend_2026_11_05.md), sin sustituir sus cifras históricas. El [inventario adjunto](Inventario_Auditoria_Integral_2026_11_06.md) enumera las **52 rutas/métodos en 23 controladores**, diez páginas con ruta activa, una página histórica sin ruta, componentes, hooks, casos de uso y archivos de pruebas. Los [pendientes](../guias/Pendientes_Auditoria_Integral.md) indican exactamente qué falta. La [guía de ejecución](../guias/Pruebas_Integrales.md) permite repetir las comprobaciones.

## Alcance, arquitectura y riesgos previos

Backend Java 21/Spring Boot 3.5.16, Maven, Spring Security, JPA/PostgreSQL y Flyway; frontend React 19/TypeScript/Vite, Axios, estado de autenticación y gamificación, Tailwind y componentes existentes. La arquitectura separa dominio, casos de uso y adaptadores; la interfaz carga el currículo mediante curso → módulo → lección → actividad → plantilla. No se sustituyó esa cadena ni se inventaron resultados académicos.

Antes de modificar código se identificaron como riesgos principales: acceso por identidad/rol, contratos de paginación y respuestas 201 vacías, respuestas asíncronas fuera de orden, persistencia/recompensas repetidas, diferencias entre H2/PostgreSQL, compatibilidad de los 60 tableros y falta de ejecutabilidad del runner de navegador en este equipo. Se comenzó con las suites y builds existentes. Después se añadieron regresiones para los defectos reproducidos, se corrigió sólo su causa y se repitieron las pruebas relacionadas y la suite completa.

Se conservaron las reglas vigentes: TetriLogic valida conteos de filas/columnas, límites y colisiones; Neon Flow valida el recorrido y color; las sesiones verificadas del servidor son la autoridad para logros y XP. Los resultados académicos declarados y la telemetría no conceden los nuevos logros. Las pruebas de fecha usan el reloj controlado existente en `America/Lima`; no se alteró el reloj del equipo.

## Correcciones verificadas

| ID y gravedad | Reproducción y causa | Cambio mínimo | Regresión que fallaba antes y pasa después |
|---|---|---|---|
| F01 — Media | Abrir ranking global y cambiar de selección antes de su respuesta: el resultado anterior sobrescribe el curso. Los catches vacíos confunden una API fallida con un ranking sin participantes y hay dependencias entre cargas no relacionadas. | `RankingPage.tsx` y nuevo `useAsyncResource.ts`: lecturas por clave/selección, descartar resultados tras limpieza, carga/error/vacío explícitos y reintento. Consultas de grupo/curso separadas; sin datos ficticios. | `RankingRequests.test.tsx`: cinco escenarios de orden inverso, errores y consultas independientes; E2E de ranking. |
| F02 — Alta funcional | Colocar O en (0,0) y J en (1,1): el origen de la caja de J está ocupado, aunque todas sus celdas reales están libres. El click seleccionaba la otra pieza, impidiendo esa solución válida desde bandeja. | `useFreePieceInteraction.ts`: comprobar primero la colocación válida de la pieza aún no colocada. Reutiliza `canPlaceFreely`; no relaja límites ni colisiones ni cambia objetivos. | `TetriFreeInteraction.test.tsx`, colocación de origen ocupado; resolución real de TetriLogic y diarios mediante clicks. |
| F03 — Media | Acceder como docente a `/docente` o `/docente/not-a-page` muestra un layout vacío: falta ruta de respaldo anidada. | `ui/router/index.tsx`: redirigir subruta desconocida al dashboard ya existente, manteniendo guards. | `RouteGuards.test.tsx`: rutas raíz/desconocida, estudiante y anónimo. |
| F04 — Media | Promediar un resultado con `score: null` y otro con nota: `Number(null)` introducía un cero y alteraba la media. | `loadTeacherMetrics.ts`: promediar sólo notas finitas registradas, conservar el total de registros y mostrar su denominador. `DocenteMetricasPage.tsx` distingue «Sin nota registrada». DTO corregido a `score: number \| null` y `dateAttempted`, coincidiendo con Java. | `TeacherMetricsLoading.test.ts`, suite académica y caso de nota nula en `metricas.cy.ts`. |
| F05 — Alta de privacidad | Un error de Axios con contraseña en `cause.config.data` llegaba completo a `console.error` desde el formulario de acceso. | `LoginPage.tsx`: registrar el mensaje de error seguro que ya se muestra al usuario; se conserva el aviso y su foco. | `LoginForm.test.tsx`: secreto ausente del log, estados de envío, 201 vacío y contenido malicioso mostrado como texto. |
| F06 — Baja | Una victoria confirmada actualiza perfil/notificación, pero el encabezado conserva nivel/estrellas anteriores hasta remontar. | `Navbar.tsx`: suscribirse a la revisión existente de gamificación y volver a leer el perfil del servidor. No calcula ni concede XP en cliente. | `NavbarProgress.test.tsx`, actualización después de confirmar victoria. |
| F07 — Media | Editar una actividad persistida sin misiones: el frontend rechaza guardar con «Agrega al menos una misión», aunque el backend y los tableros admiten una lista vacía. | `DocenteRetosPage.tsx`: retirar únicamente esa exigencia incompatible. Se mantienen lección, plantilla, entorno y demás validaciones. | `ChallengeEditorContract.test.tsx`, `retos-create.cy.ts` y CRUD real desde interfaz docente. |

No se modificó la generación procedural, la condición 5/5 ni la validación del servidor. La regresión de edición también comprueba que el ID de lección y el tablero no se pierden. Las fixtures de pruebas que usaban `date` se ajustaron al campo real `dateAttempted`; no se alteró el significado de sus aserciones.

## Infraestructura de pruebas y evidencias previas

La suite inicial aprobó **272 casos backend** (sin fallos, errores o saltados) y **345 frontend**; el build frontend también aprobó. El lint inicial falló con 25 errores y 2 advertencias. Cypress estaba declarado en el proyecto, pero faltaba su binario en el equipo: se instaló la misma versión 15.21.1. Se incorporó `@vitest/coverage-v8` 4.1.12 como dependencia de desarrollo por su correspondencia exacta con Vitest; no se actualizaron librerías de ejecución.

Había siete specs E2E históricos, 22 casos, que dependían de `/cursos`, campos snake_case, cookies JWT ficticias, respuestas sin paginación o catálogos de sustitución ya retirados. La ejecución previa registró los fallos. Se migraron esos recorridos a las rutas/DTO actuales, preservando sus objetivos y añadiendo la distinción entre error y vacío. No se restauraron contratos obsoletos para acomodar las pruebas. Se añadió un caso de nota nula y un spec de diez flujos con aplicación real; no hay casos deshabilitados intencionadamente.

Durante el diagnóstico también hubo fallos en selectores del driver: la lista no garantiza qué curso aparece primero, editar un input numérico controlado con `clear().type('1')` producía `11`, y el último elemento de una lista debía desplazarse para verse. Se corrigió el driver para seleccionar el curso por nombre, reemplazar la selección del número y hacer scroll real. No se cambiaron expectativas de negocio para aceptar un defecto. Hubo ejecuciones parciales/interrumpidas de diagnóstico; sólo la ejecución completa final cuenta como aceptación. Una pasada de cobertura con cuatro workers durante el build Docker excedió el timeout existente de un caso; se repitió con dos workers, sin cambiar el timeout ni la aserción.

El Compose de auditoría construye los Dockerfiles reales y usa UUID, etiquetas y puertos exclusivos del loopback. PostgreSQL 16 usa tmpfs, sin puerto del host ni volumen de la aplicación. Los únicos datos SQL escritos directamente son un grupo fixture en esa base verificada; registro, acceso, CRUD de actividad, membresías, partidas y resultados se ejercitan por UI/API. Los scripts comprueban propiedad antes de consultar o retirar recursos. Los reportes ignorados por Git pueden regenerarse; no contienen bases reales.

## Resultados de ejecución

| Módulo | Prueba | Resultado | Corrección |
|---|---|---|---|
| Backend completo | Maven `verify`, compilación Java, contratos, unitarias e integración H2/Flyway | **PASS: 272**, 0 fallos/errores/saltados | Sin cambios adicionales en código Java; se conserva el lote anterior. |
| Persistencia real | `BackendPersistenceIntegrationTest` contra PostgreSQL 16 nuevo | **PASS: 9**, 0 fallos/errores/saltados | Verificación de transacciones, referencias, CRUD y concurrencia; entorno retirado por su script. |
| Frontend completo | Vitest, componentes, hooks, reglas y adaptadores | **PASS: 375 en 37 archivos** | 30 casos adicionales de regresión y orquestación de autenticación/API. |
| Navegador real | Registro/login/logout, roles/sesión, rutas/historial, responsive, CRUD, membresías, ambos juegos, diario y persistencia | **PASS: 10/10** | F01–F07; API/backend/DB reales en diez casos, incluido TetriLogic 7 determinista. |
| Contratos UI en navegador | Siete specs: catálogo, acceso, inicio, ranking, métricas, editor y volumen controlado | **PASS: 23/23** | HTTP interceptado; no se presentan como integraciones reales adicionales. |
| Contratos API | DTO de resultado, paginación completa, errores, POST 201 vacío, PUT/DELETE, autorización personal | **PASS** en suites anteriores | F04/F07 y preservación de contratos; inventario no equivale a cobertura combinatoria total. |
| Retos diarios | Cinco ejercicios distintos, clicks de ambos juegos, estados 1/5…5/5, salida/reingreso en 2/5, recarga final | **PASS** en el flujo real y suites unitarias/integración | Las fechas completadas permanecen en cero antes del quinto. IDs persistidos sin cambios tras recargar. |
| Progreso/logros | Dos niveles oficiales, L01/XP, perfil, recarga y ausencia de duplicación | **PASS** | SQL confirma +2 niveles/+100 XP y una entrada de XP; recarga conserva saldos. El diario no añade niveles oficiales. |
| Currículo/gestión | Crear actividad, recargar, editar preservando lección/plantilla, borrar; asignar/repetir/retirar miembro | **PASS** en navegador real | F07; POST repetido conserva una membresía; retirar no altera progreso ni XP. |
| Catálogo y simuladores | Reglas/soluciones de 30 Neon Flow + 30 TetriLogic, compatibilidad histórica | **PASS** en suites existentes ejecutadas | 60 oficiales conservados; navegador resuelve tres oficiales y cinco diarios, no afirma 60 resoluciones UI nuevas. |
| Medianoche/concurrencia | Renovación Lima, conjunto único por fecha y recompensas idempotentes | **PASS** en pruebas con reloj controlado y persistencia | Sin esperar medianoche real ni modificar el reloj del sistema. |
| Build/tipos | `pnpm run build`, tipos E2E, builds Docker backend/frontend y healthchecks | **PASS** | Compatibilidad mantenida; advertencias de tamaño/mapeos/paginación registradas. |
| Lint | ESLint completo, incluyendo las pruebas | **FAIL: 14 errores y 1 advertencia** previos aún presentes | Antes: 25/2. Sin desactivar reglas; artefactos generados fuera de lint. Detalle A02. |
| Dependencias frontend | `pnpm audit --json`, 536 dependencias informadas | **PASS: 0 avisos** | Incluye dependencias de desarrollo; sin supresiones. |
| Dependencias backend | 121 coordenadas Maven resueltas, todos los scopes, consulta OSV | **FAIL: 2 avisos pendientes** | Sin actualización mayor incompatible; detalle y fuentes abajo. |
| Despliegue remoto/otros navegadores | Producción, Safari/Firefox, lector de pantalla y dispositivo físico | **BLOCKED / no ejecutado** | No se dispone de ese entorno/matriz en este lote; A06/A12. |
| IA y SSD integral | Modelos, proxy, contenedor y aprendizaje adaptativo | **BLOCKED / excluido por alcance** | Sólo revisión de contratos/componentes existentes; no invocación ni simulación de modelos. |

Las nueve pruebas PostgreSQL son una repetición de un subconjunto backend sobre otro motor; no deben sumarse como nueve comportamientos nuevos a las 272. Los diez recorridos E2E reales y los 23 con fixtures tienen alcances distintos.

## Cobertura completa y crítica

| Stack | Líneas globales | Ramas globales | Líneas críticas | Ramas críticas |
|---|---|---|---|---|
| Backend JaCoCo | 72,44 % (2497/3447) | 61,04 % (1042/1707) | **97,07 % (464/478)** | 75,92 % (514/677) |
| Frontend V8 | 62,73 % (1618/2579) | 63,13 % (1747/2767) | **95,32 %** | **82,03 %** |

La selección crítica backend son 12 clases documentadas en `backend/scripts/coverage-summary.py` y el POM: reglas de tableros/logros, sesiones, gamificación, generación/selección diaria, resultados, progreso, simulaciones y membresías. Su verificación Maven exige 80 % de líneas por clase. En frontend son 28 archivos enumerados por `frontend/scripts/check-coverage.mjs`: toda `application/` y flujos críticos de autenticación/API/sesiones/diario/interacción/ranking/rutas; se exige 80 % agregado de líneas y ramas. El script falla si falta un archivo requerido en el reporte.

Los reportes completos **no excluyen** clases, DTO, páginas o componentes con cobertura baja/cero. Se alcanza el objetivo de líneas críticas en ambos stacks; no se afirma 80 % global ni 80 % de ramas backend. Las áreas menos ejercitadas quedan en A03 y los pendientes B. No se añadieron tests de delegación trivial para elevar métricas.

Los denominadores críticos frontend son 570/598 líneas y 589/718 ramas. La ampliación final de F02 reproduce `pointerdown → pointerup → click` con ratón y tacto: ambos casos fallaron antes del guard de selección en `begin`, mientras teclado aprobaba. El fallo de navegador del diario 4/5 con TetriLogic 7 motivó esa corrección adicional; se conserva en `e2e-pointer-before.log` y en el JUnit de aquella ejecución. El caso E2E determinista de ese nivel comprueba colocación real y victoria persistida, además del conjunto diario aleatorio.

## Seguridad, consola y rendimiento

Se verificaron acceso inválido, 401/403, expiración de sesión, cookie JWT HttpOnly y metadatos de rol manipulados sin privilegio servidor. Las suites existentes comprueban identidad ajena, entradas inválidas, validación de soluciones y reintentos. F05 evita exponer el objeto de solicitud de autenticación. Esto no sustituye un pentest ni resuelve CSRF, confianza en proxies o provisión de cuentas de producción: B07–B09 permanecen abiertos.

| Aviso pendiente | Severidad OSV/GHSA | Severidad del fabricante |
|---|---|---|
| GHSA-j9f9-w8pj-32f8 / CVE-2026-47890 | **CRITICAL** | LOW |
| GHSA-pc63-qcmh-9cmg / CVE-2026-47884 | **CRITICAL** | MEDIUM |

OSV conserva dos avisos para `spring-webmvc` 6.2.19. El fabricante califica [CVE-2026-47890, GHSA-j9f9-w8pj-32f8](https://spring.io/security/cve-2026-47890/) como LOW y [CVE-2026-47884, GHSA-pc63-qcmh-9cmg](https://spring.io/security/cve-2026-47884/) como MEDIUM; la clasificación de OSV es distinta y se conserva en su JSON. Afectan respectivamente fragmentos SSE y `XsltView`. No aparecen `SseEmitter`, `ServerSentEvent`, `FragmentsRendering`, `text/event-stream`, `XsltView` o plantillas XSL en `backend/src`; es una revisión de condiciones conocidas, no una declaración de riesgo nulo. El parche 6.2.20 requiere soporte comercial y 7.0.9 OSS supone una migración mayor. A01 documenta la decisión pendiente. No se cierran ni se ignoran alertas y no se verificó el contador privado de Dependabot remoto.

El runner registra `console.warn/error` sin silenciarlos. Los mensajes de credenciales incorrectas, sesión expirada y APIs 503 de los escenarios negativos son esperados y se distinguen por prueba en el JSONL. Las pantallas normales no deben adjudicarse errores deliberadamente inducidos como fallos espontáneos. Spring conserva la advertencia previa de `PageImpl` (B12), además de las de compilación/mapeos del informe backend anterior; no se suprimieron. El build conserva el aviso del chunk de 799,28 kB minificado/227,45 kB gzip y la advertencia temporal previa de Tailwind cuando aparece.

Se probaron 500 cursos paginados, 1000 entradas de ranking y 100 actividades mediante fixtures de lectura, incluyendo acceso al último lote. Verifican funcionalidad de la interfaz, no rendimiento de SQL, usuarios simultáneos sostenidos ni tiempos de producción. Se comprobaron anchos de 320, 390, 768 y 1440 px para el flujo estudiantil y 390/768/1440 para las cuatro pantallas de gestión con ambos roles; sin desbordamiento horizontal del documento en esos recorridos. Las capturas móviles/tablet se inspeccionaron. Las capturas `fullPage` de Cypress pueden repetir el encabezado fijo al componer segmentos y recortar el borde del escritorio según el tamaño físico del runner; no se interpreta ese artefacto como un defecto de layout ni se afirma una certificación visual completa.

## Archivos y trazabilidad

Además de los siete cambios de comportamiento de la tabla, se añadieron pruebas de orquestación en `AuthWorkflow.test.tsx` y casos de cancelación/encoding en `GameProgressApi.test.ts`. Las fixtures tipadas de `RankingPage.test.tsx` sustituyen `any` sin cambiar aserciones. La cobertura configura Vitest/V8, el gate y scripts npm; Cypress incorpora tareas limitadas al entorno propio, tipos, diagnósticos y reportes por UUID/timestamp. `docker-compose.audit.yaml` y `scripts/audit-environment.ps1` no sustituyen el Compose normal. `scripts/audit-dependencies.py` es una consulta pública de coordenadas Maven sin credenciales ni supresiones.

| Evidencia local regenerable | Resultado conservado |
|---|---|
| `backend/target/full-audit-baseline.log` y `surefire-reports/` | 272 casos y Maven `BUILD SUCCESS` el 06/11 |
| `backend/target/full-audit-postgres.log` y `surefire-postgres/` | 9 casos sobre PostgreSQL, `BUILD SUCCESS` |
| `backend/target/site/jacoco/`, `coverage-summary.json`, `api-contract-inventory.json` | Cobertura completa, crítica y matriz real de rutas |
| `frontend/node_modules/.cache/pipre-audit/unit-before.json` | Baseline de 345 casos |
| `frontend/node_modules/.cache/pipre-audit/coverage-final.log` y `frontend/coverage/` | 375 casos y cobertura final |
| `frontend/node_modules/.cache/pipre-audit/e2e-before.log`, `e2e-final.log` y `frontend/test-results/e2e/` | Diagnóstico previo, última ejecución completa, JUnit, JSONL y capturas |
| `frontend/node_modules/.cache/pipre-audit/build-final.log`, `types-final.log`, `lint-before.json`, `lint-final.json` | Build, TypeScript y deuda de lint sin ocultar |
| `frontend/node_modules/.cache/pipre-audit/dependency-audit.json`, `backend/target/full-audit-osv.json` | 0 avisos pnpm / 2 OSV |
| `frontend/node_modules/.cache/pipre-audit/environment-final-build.log` | Build Docker del frontend corregido |

La ejecución final E2E empezó a las **19:10:52 UTC del 06/11** (14:10:52 Lima): **33/33 aprobadas, ocho specs, 0 fallos, 0 pendientes y 0 saltadas**, en 244,624 segundos, Electron 138.0.7204.251. Sólo tres pruebas negativas registran mensajes de consola: acceso inválido real, sesión expirada y acceso inválido con fixture; el resto no registra `console.error/warn`. El [resumen versionado de evidencias](evidencias/Auditoria_Integral_2026_11_06.json) conserva cifras y denominadores sin datos personales. Los archivos bajo `target/`, `node_modules/`, `coverage/` y `test-results/` son locales e ignorados; los documentos y scripts de reproducción sí se entregan en el repositorio. No se almacenan secretos, volcados de base ni credenciales de GitHub como evidencia.

Los logs Docker no muestran errores de ejecución del backend en estos recorridos; conservan la advertencia de paginación. PostgreSQL registra los avisos de locales/autenticación local de su imagen Alpine y un error de **una consulta diagnóstica QA de sólo lectura** que usó por equivocación una tabla `students` inexistente. No procedía de la aplicación, no escribió datos ni motivó cambios de esquema; se registra aquí para no afirmar que el log completo está vacío de errores.

**Limpieza verificada:** al terminar se retiraron los tres contenedores y la red de esta ejecución mediante `audit-environment.ps1 -Action Stop`. La consulta por su etiqueta confirmó cero contenedores y cero redes restantes; se retiró el manifiesto. Las imágenes/cachés de herramientas y los reportes se conservan. No se detuvo Docker Desktop ni se ejecutó limpieza global; los servicios y datos de la aplicación no se usaron como fixtures.

No se declara terminado el SSD, implementada una IA, definida una rúbrica académica, corregida la seguridad integral ni verificado un despliegue remoto. La continuidad concreta está en [Pendientes_Auditoria_Integral.md](../guias/Pendientes_Auditoria_Integral.md) y [B01–B12](../guias/Pendientes_Implementacion_Backend.md).
