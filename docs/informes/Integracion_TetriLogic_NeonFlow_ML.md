# Integración de TetriLogic, Neon Flow y trazabilidad

**Informe de entrega fechado el 30/10/2026.** Sus resultados de pruebas y estado de Git pertenecen a ese checkpoint. Para la documentación vigente y sus nuevas ubicaciones consultar [estado actual](../ESTADO_ACTUAL.md) y [revisión documental](Revision_Documentacion_2026_10_30.md).

30/10/2026. Destino `Feature/Tetrilogic-avances` (a912ad0); origen `feature/neonflow-30-retos-tablero` (6fe3fb9), base común 4cd18e7. Integración preparada y validada localmente, sin commit ni push. Git conserva la fusión pendiente de commit por restricción expresa del usuario; el historial de la rama todavía no contiene un commit de integración.

## Análisis y decisiones previas

La rama de origen cambia 11 archivos: catálogo de treinta tableros 4×4/5×5/6×6, validación de plantillas, seeder, registro frontend, raycast, ancho del tablero y pruebas. La rama destino incorpora el catálogo/lectura persistida y la manipulación directa con conteos de TetriLogic. No hay migraciones nuevas ni entidades de intentos en la rama Neon Flow.

Conflictos Git: `Activity.java`, `activityLevels.ts`, `levelConfigs.ts`. Se conservan los treinta TetriLogic v2 y ambos prototipos anteriores. Los dos Neon Flow publicados de 5×5 conservan identidad y geometría; el catálogo importado usa `neonflow-v2-1`…`30`. Los alias `neonflow-3`…`30` siguen resolviendo el contenido de la rama origen. Las soluciones de pruebas se separan del contenido que recibe el navegador.

El seeder de origen elige la primera lección encontrada y usa una función que además genera resultados/calificaciones aleatorios. Se sustituye su actualización por V16 aditiva, dirigida a la lección oficial con verificación de pertenencia. No borra ni reasigna actividades editadas, misiones, resultados o simulaciones. Los niveles 1/2 nuevos usan actividades `act-c001-v2-1/2`; los prototipos históricos permanecen. Los niveles 3…30 usan `act-c001-3`…`30`. No contar los prototipos como retos oficiales adicionales.

El cambio de raycast que atravesaba receptores no es necesario para estos treinta tableros (cada uno tiene un receptor) y alteraba el comportamiento anterior. Se conserva la detención en receptor y se verifica color/tipo real al validar las soluciones. Se añade la lectura persistida Neon Flow siguiendo las mismas capas que TetriLogic. El aumento de ancho del tablero se limita a Neon Flow.

## Contrato de trazabilidad propuesto y autorizado antes de aplicar

El usuario autorizó expresamente registrar intentos y acciones de ambos juegos, manteniendo excluido `data-science` y sin puntos. Se extiende `telemetry_attempts` en V17, evitando una cuarta entidad que duplique intentos existentes. Los datos antiguos mantienen su significado; no se inventa una actividad, fecha inicial o secuencia histórica.

Cada intento nuevo incluye clave estable del cliente para reintentos idempotentes, estudiante autorizado, actividad opcional en práctica independiente, plantilla y versión, versión de reglas (`neonflow-raycast-v1` / `tetrilogic-counts-v1`), dificultad tomada del servidor, inicio/fin UTC, recepción en servidor, secuencia ordenada de acciones y estado inicial/final del tablero. Los eventos guardan tiempo relativo y datos tipados de la manipulación, sin capturar texto personal ni cada movimiento del puntero. Conteos, duraciones y ayudas pueden derivarse de los eventos; la puntuación no se inventa.

La actividad se comprueba contra juego y plantilla. Los intentos de clientes anteriores siguen aceptándose con contexto nulo y se distinguen en análisis. Una clave repetida con el mismo contenido no crea otro intento; un contenido diferente con esa clave se rechaza. La telemetría sigue siendo declarada por el cliente, no una certificación del aprendizaje ni un resultado académico autorizado por el servidor.

La preparación ML exige separar datos demostrativos de observaciones reales, seudonimizar fuera del sistema transaccional, dividir por estudiante y tiempo, y seleccionar predictores anteriores al momento de predicción. Éxito final, duración final, soluciones y notas posteriores no deben entrar como predictores de una estimación temprana. No se infiere causalidad ni una medida validada de abstracción/pensamiento algorítmico a partir de un simple contador.

## Resultado y cambios incorporados

| Procedencia | Resultado integrado |
|---|---|
| TetriLogic destino | Treinta configuraciones v2, JSON y V14/V15 intactos, arrastre/giro/bandeja externa y éxito por conteos exactos de filas/columnas, incluidos ceros. Se permiten excesos intermedios. No se reactivaron reglas históricas. |
| Neon Flow origen | Treinta tableros distintos de 4×4, 5×5 y 6×6, espejos/filtros/obstáculos, registro de plantillas y selección por actividad. Se conservan las geometrías publicadas de los prototipos. |
| Adaptación de integración | Catálogo congelado frontend/backend, V16 aditiva, lectura persistida Neon Flow, validación de receptor/color, soluciones fuera del paquete de producción y ampliación de ancho limitada a Neon Flow. |
| Autorización posterior | Trazabilidad de intentos/acciones de ambos juegos, sin calificaciones, puntuación ni progreso automático; ayudas estáticas diferenciadas de IA. |

Hay **30 retos oficiales TetriLogic + 30 Neon Flow = 60**. En la base local preexistente se añadieron **30 actividades y 30 misiones**, preservando los dos prototipos Neon Flow anteriores: 62 actividades físicas, 60 oficiales. Las instalaciones nuevas reciben 60; los alias y prototipos no suman retos. Se comprobó que no hay configuraciones oficiales idénticas al quitar identificadores y metadatos descriptivos.

El flujo permanece `curso → módulo → lección → actividad → levelTemplate → configuración persistida → simulador`. El catálogo y el selector del simulador identifican los prototipos Neon Flow como «Versión anterior», sin cambiar sus datos ni enlaces.

## Modelo de datos, integridad y migraciones

No se crea otra entidad que duplique un intento. `simulations`, `activity_results` y `module_progress` conservan su función anterior; la nueva telemetría no escribe resultados ni progreso.

| Migración | Cambio y compatibilidad |
|---|---|
| V1…V15 | Sin modificaciones respecto a la rama destino. |
| V16 | Nueva tabla `neonflow_templates` con identidad, versión y configuración JSONB. Treinta plantillas, actividades/misiones oficiales añadidas idempotentemente. Verifica que la lección oficial pertenece al curso correcto; una colisión aborta toda la migración. No sobrescribe actividades, metadatos ni misiones editadas. |
| V17 | Amplía `telemetry_attempts`: `trace_context JSONB`, `id_activity` opcional, `received_at` con zona horaria y `request_hash`. Índices por estudiante/fecha y actividad. Las filas anteriores conservan contexto/recepción nulos. |

`id_activity` referencia actividades con `ON DELETE SET NULL`; el JSON conserva la identidad observada para análisis histórico. El vínculo al estudiante usa `ON DELETE CASCADE`, coherente con la eliminación existente de sus datos. En PostgreSQL la FK de estudiante se añade `NOT VALID`: conserva posibles huérfanos antiguos y exige integridad en nuevas escrituras. La base local examinada tiene **cero intentos huérfanos**. Su validación retroactiva en otro entorno requiere auditar sus datos antes; no se los corrige inventando usuarios.

Los timestamps de recepción se generan en servidor. Inicio, finalización y tiempo relativo proceden del cliente; los valores antiguos de `completed_at` mantienen la convención UTC existente. La dificultad se toma de la actividad del servidor al recibir el intento, no se interpreta como escala pedagógica validada. La práctica independiente conserva actividad/dificultad nulas.

La API comprueba identidad, existencia de estudiante/actividad, juego, plantilla, versión y reglas; acota tamaño, número/orden/tiempo de eventos, estados y campos admitidos. No admite campos personales arbitrarios dentro de los eventos. El ID de intento es determinista por estudiante y UUID del cliente; huella canónica e inserción PostgreSQL `ON CONFLICT` hacen idempotentes también los envíos simultáneos. Repetir contenido distinto con el mismo ID da 400. Un reintento ya aceptado sigue siendo válido tras editar la actividad.

Se corrigió además la carga diferida de relaciones al mapear `ActivityRepositoryAdapter.findById`: usa una transacción de lectura. La prueba con servidor real detectó este fallo y ahora dispone de regresión automatizada.

**Aplicación local y reversibilidad:** se guardó `pipre-before-integration-20261030.sql` fuera del repositorio antes de aplicar V16/V17. Flyway aplicó ambas y valida las 17 migraciones. No borrar cursos/volúmenes ni editar SQL ya aplicado. El rollback de una migración fallida es transaccional; deshacer una migración exitosa requeriría otra migración compensatoria revisada o restaurar un respaldo en una base separada. No se incluye un downgrade destructivo que borre observaciones nuevas.

## Preparación para análisis y Machine Learning

La unidad analítica es un episodio observado de interacción, no una nota. Tras completar y volver a modificar el tablero se inicia otro episodio con el estado inicial real. No se crean observaciones por una visita vacía de React StrictMode. Se registra abandono al salir/desmontar y existe una cola de reintento por estudiante autenticado.

| Información disponible | Posible uso y límite |
|---|---|
| Estudiante, actividad opcional, plantilla/versionado de reglas | Agrupar trayectorias sin mezclar juegos ni versiones de mecánica. |
| Inicio/fin UTC, recepción y tiempo relativo de eventos | Duraciones y latencias; son observaciones de cliente, susceptibles a pausas/reloj alterado. |
| SELECT, PLACE, ROTATE, RETURN, RESET, CHECK, HELP, REJECT, CANCEL, COMPLETE, ABANDON | Secuencias, revisiones, comprobaciones y tipos técnicos de error. No se almacenan todos los movimientos del ratón. |
| Estado inicial/final y coordenadas/giro/tipo en eventos | Reconstruir cambios observados y estrategias espaciales bajo la versión del catálogo. No certifica la legalidad histórica por servidor. |
| Ayuda STATIC o AI | Separar pistas estáticas de consultas IA. Esta integración no invoca ni modifica el servicio IA. |
| Resultado declarado y eventos omitidos | Analizar resolución/abandono y excluir secuencias truncadas. No equivale a evaluación de pensamiento lógico. |

Conteos de intentos, rotaciones, correcciones, reinicios, ayudas, comprobaciones y latencias se calculan al consultar eventos. Se mantienen los contadores del contrato anterior por compatibilidad; no son una segunda fuente de verdad validada para aprendizaje. La rotación de una pieza en preparación lleva `source=DRAFT`; el análisis debe distinguirla de una transformación ya colocada. No se añadieron XP, estrellas, etiquetas cognitivas ni puntajes inventados.

Se incluyen [consultas de inspección de calidad y eventos](../Consultas_Analitica_Intentos.sql), ejecutadas sobre PostgreSQL local en una transacción de sólo lectura. Recuperan el proceso y separan trazas nuevas de observaciones antiguas sin contexto. No exportan nombres, correos ni IDs crudos de estudiantes. La validación HTTP/SQL también recuperó secuencias y recepción de intentos persistidos por ambos juegos.

Para construir el futuro dataset:

1. Definir objetivo, instante de predicción y protocolo pedagógico. Abstracción, pensamiento algorítmico y resolución de problemas requieren instrumentos y etiquetas externas validadas; un contador o correlación no prueba una habilidad ni causalidad.
2. Separar demostración, pruebas, datos antiguos ambiguos y observaciones nuevas. La generación de resultados, simulaciones y analítica aleatorios queda desactivada por defecto con `pipre.seed.demo-data=false`. El bootstrap de usuarios todavía crea diez estudiantes ficticios además de las tres cuentas iniciales; la opción no desactiva esas cuentas. No se borraron registros históricos ni se les asignó procedencia falsa; revisarlos antes de entrenamiento.
3. Seudonimizar en una exportación controlada mediante HMAC-SHA256 del ID con secreto fuera de Git/dataset. Retirar identificadores directos y evitar fechas exactas innecesarias. Un hash simple sin secreto no garantiza anonimato. Definir retención, acceso y requisitos de consentimiento institucional antes de recopilar en un piloto real.
4. Dividir entrenamiento/validación/prueba por estudiante y tiempo, manteniendo al mismo estudiante fuera de grupos incompatibles; evaluar además generalización a plantillas no vistas. Las particiones aleatorias por intento pueden filtrar identidad y estrategia.
5. Para predicción temprana usar únicamente el prefijo anterior al corte. Excluir resultado, evento COMPLETE, duración final, estado final, notas posteriores y soluciones de los predictores. Ajustar normalización/imputación sólo con entrenamiento.
6. Versionar catálogo, reglas, consulta de extracción, rúbrica y particiones; auditar truncamientos y datos ausentes. No se entrenó ningún modelo en esta entrega.

## Validaciones ejecutadas

| Validación | Resultado |
|---|---|
| Frontend completo tras recuperar el corte | **291 pruebas / 25 archivos**, correctas. `pnpm test:run --maxWorkers=2 --testTimeout=20000`. Incluye resolver los 30 Neon Flow y los 30 TetriLogic mediante controles reales, además de compatibilidad histórica. |
| Backend completo tras el corte | **86 pruebas**, cero fallos, errores u omitidas. `mvnw.cmd -B test`. |
| PostgreSQL aislado, antes del corte | **20 comprobaciones**, correctas: instalación vacía, V15 con datos, idempotencia, metadatos/misiones/resultados preservados, FK, JSONB, eliminación e intento de colisión con rollback. Contenedor desechable aislado, limpiado. |
| API real Docker/PostgreSQL, repetida tras el corte | **91 comprobaciones**, correctas: 60 configuraciones, autenticación, 401/403/404, crear/editar/recargar, misiones, reintentos iguales/conflictivos/concurrentes, edición posterior y recuperación de datos. Fixtures propias limpiadas. |
| Conservación de datos | Huellas de **111 filas preexistentes en 12 tablas** idénticas antes/después, también tras la recuperación WAL. Sin nuevos resultados, simulaciones ni progreso académico. |
| Catálogos | Ambos generadores con `--check` correctos; 30 configuraciones distintas por juego. Soluciones sólo en fixtures/scripts, no en respuestas de plantillas. |
| Código/build | TypeScript y build de producción correctos tras recuperar los tres archivos; Docker recompiló backend/frontend. ESLint de archivos TypeScript modificados/nuevos correcto. |
| Navegador | Sesión estudiante temporal; reto Neon Flow 1 nuevo 4×4, selección al 30 en el mismo curso, rotación/filtro y éxito del 30 6×6. TetriLogic 30 completado con conteos exactos. Recepción SQL de las observaciones de ambos juegos comprobada. |
| Responsive | Ambos tableros revisados en 320/390/768/1440 px, sin desbordamiento horizontal de página. Se restauró el viewport del navegador. |
| Consultas analíticas | SQL JSONB de sólo lectura ejecutado sin errores. |

Los primeros ensayos de interfaz con límite de 5 segundos agotaron tiempo en tableros TetriLogic bajo carga. Se repitió toda la suite con 2 procesos y 20 segundos por caso: 291/291, sin omitir ni alterar las comprobaciones. Las pruebas nativas usaron Java 25 compilando release 21; Docker verificó compilación y ejecución con Java 21, sin afirmar que la suite Maven se ejecutó dentro del contenedor. El build conserva una advertencia de paquete JavaScript mayor de 500 kB.

## Revisión y recuperación tras el corte eléctrico

El usuario informó del corte durante la última compilación del frontend. Se encontraron **tres archivos enteramente llenos de bytes nulos**: `activityLevels.ts`, `PaginaInicio.tsx` y `Simulador.tsx`. Sus copias corruptas se conservaron como evidencia fuera de Git. Se recuperaron del índice/HEAD válidos y se reaplicaron los cambios revisados: registro unificado, carga persistida Neon Flow y etiquetas de versión anterior. No se restableció masivamente el directorio ni se borraron cambios válidos.

`git fsck --full --no-reflogs` no encontró objetos dañados; los objetos sin referencia no son corrupción. No quedaron entradas sin fusionar ni marcadores de conflicto. El nuevo `scripts/verify_source_integrity.py` revisó 611 archivos de texto sin anomalías, reconociendo también UTF-16 con BOM para no confundir una codificación válida con corrupción. `data-science/requirements.txt` no se modificó.

Docker Desktop estaba apagado; se reinició usando su instalación del usuario. Se iniciaron únicamente PostgreSQL, backend y frontend. PostgreSQL recuperó WAL y quedó listo; V16/V17 permanecen exitosas y no se reaplicaron. Los 111 registros históricos conservaron sus huellas y el intento QA guardado antes del corte seguía disponible. Se completó la compilación que quedó interrumpida y se repitieron las suites y el verificador HTTP sobre el resultado recuperado.

El contenedor `pipre-ml-ia` conserva identidad, estado detenido y fecha de inicio previa; no fue iniciado/reconstruido. No se modificaron sus archivos, modelos, endpoints ni proxy. No se tocó producción.

## Limitaciones y siguientes iteraciones

- Resultado, reloj y secuencia siguen siendo declarados por cliente (`clientReported=true`); el servidor valida el contrato y propiedad, pero no reproduce cada solución. Definir validación autorizada antes de conceder calificaciones.
- La cola usa sesión del navegador y envío de mejor esfuerzo al salir. Un cierre forzado, corte eléctrico, almacenamiento deshabilitado o cierre sin conexión puede perder eventos aún no enviados. Idempotencia evita duplicados aceptados; no equivale a entrega garantizada ni reanudación del tablero.
- Se acotan los eventos; `droppedEvents>0` identifica truncamiento y debe excluirse de análisis secuencial completo. No inferir actividad/inicio/orden de observaciones antiguas con contexto nulo.
- Si un docente cambia la plantilla mientras el estudiante resuelve, una traza aún no aceptada puede ser rechazada por incompatibilidad. Los reintentos de trazas ya aceptadas sí sobreviven a la edición. Un historial de revisiones de actividad permitiría ampliar ese caso sin mezclar configuraciones.
- Quedan pendientes rúbrica, progreso, reanudación, validación pedagógica, plan de privacidad/retención y pipeline seudonimizado de entrenamiento. No se entrega el SSD integral, reto diario ni modelos ML.
- Las verificaciones en navegador cubren puntos representativos; los 60 controles completos tienen cobertura automatizada. No se ejecutó toda la suite Cypress ni una auditoría externa de accesibilidad/seguridad. No se declara que el lint global histórico esté limpio.
- En otro entorno: respaldar, revisar colisiones de IDs/propiedad, aplicar Flyway sin reescribir V1…V17 y ejecutar validaciones propias. Una validación local no es un despliegue de producción.

## Estado final de Git y continuidad

La rama de trabajo es `Feature/Tetrilogic-avances`, HEAD `a912ad07feaee6a4e46fa1fe5aa42dcec7a94c10`; MERGE_HEAD apunta a `6fe3fb9f0e63bf0074b2192f486ca7980e479721`. Los tres conflictos de fusión están resueltos. La integración conserva sus cambios para revisión, **sin commit ni push**. No ejecutar `merge --abort`, `reset --hard` ni regenerar SQL para resolver esta situación: el commit de integración queda para una autorización posterior.

Los logs, respaldo SQL previo, huellas y capturas están fuera del repositorio en la carpeta de artefactos de esta sesión. No incorporar a Git respaldos de base de datos, cookies, credenciales ni datos personales. El estudiante QA y sus tres observaciones de navegador fueron limpiados tras comprobar identidad; la comparación final vuelve a mostrar sólo 30 actividades y 30 misiones adicionales, sin otros registros nuevos en las doce tablas auditadas. Las pruebas temporales de esta revisión no deben alimentar datasets reales.

El inventario completo de archivos nuevos/modificados está en [el manifiesto de integración](Archivos_Integracion_2026_10_30.md); no se eliminan archivos del proyecto.
