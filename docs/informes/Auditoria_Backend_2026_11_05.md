# Auditoría, corrección y validación del backend

**Fecha: 05/11/2026, America/Lima.** Revisión del backend Java 21 / Spring Boot 3.5.16 de la rama de trabajo. Alcance: contratos existentes, reglas de negocio, referencias de persistencia, transacciones, gamificación y diario procedural. No se modifican frontend, catálogos, migraciones V1–V21, credenciales, datos reales ni servicios de IA. Sin commits ni pushes automáticos.

[Pruebas reproducibles](../../backend/TESTING.md) · [Pendientes concretos de implementación](../guias/Pendientes_Implementacion_Backend.md) · [Contratos vigentes](../guias/Contratos_Frontend_Backend.md).

## Arquitectura y compatibilidad

Se conserva el recorrido controlador HTTP → puerto de entrada → caso de uso → dominio/fábrica → puerto de salida → adaptador JPA/JDBC. Se revisaron controladores, comandos/DTO, servicios, entidades, repositorios, configuración Spring/Flyway y consumidores TypeScript. La compilación procesa 330 fuentes principales; los contratos combinan DTO específicos y comandos de aplicación usados directamente en controladores.

La arquitectura tiene acoplamientos Spring ya existentes en servicios, paginación y algunas utilidades del dominio. No se introduce una reorganización de capas ni una sustitución de dependencias. JaCoCo 0.8.16 se añade sólo como plugin de compilación/pruebas; no añade una librería al runtime. Se preservan las versiones de dependencias existentes en esta rama.

Se detectan adaptadores históricos de perfil/logros que no alimentan el flujo L01–L35 actual y campos del perfil aún sin agregación real (`totalBlocksUsed=0`, `efficiencyAvg=null`). Se conservan por compatibilidad y se documenta la revisión pendiente; no se deduce una métrica ni se elimina historial para resolver deuda arquitectónica.

La cobertura HTTP incluye un inventario de **52 entradas ruta/método en 23 controladores**, generado desde `RequestMappingHandlerMapping`, no sólo una búsqueda de anotaciones. Registra ruta, método, controlador y expresión de autorización. La prueba comprueba autorización explícita, salvo las rutas públicas existentes `/`, autenticación y registro de estudiantes. Verificar que una expresión existe no sustituye las pruebas de acceso por rol/propiedad: éstas se ejecutan en los flujos descritos abajo.

Se mantienen rutas, nombres JSON, paginación, IDs opacos y respuestas válidas: creación de actividades/resultados/asignaciones con 201 vacío, edición de actividad con 200, eliminación con 204 y progreso académico con 200. El PUT parcial de actividad conserva los campos omitidos y su plantilla. No se implementa PATCH ni asociación grupo–actividad.

## Hallazgos corregidos

| ID | Severidad | Causa raíz | Corrección y archivos |
|---|---|---|---|
| A01 | Alta | El manejador genérico devolvía 400 y el mensaje de cualquier `RuntimeException`, incluso fallos internos o de persistencia. | `GlobalExceptionHandler`: errores de negocio 400, entradas malformadas 400, conflictos de integridad 409 y fallos inesperados 500 con mensaje genérico. Los fallos internos se registran en servidor. Se preservan 401/403/404/405/423 existentes y se añade `message` al error de validación para el consumidor. |
| A02 | Alta | Varios adaptadores usaban `findById(...).ifPresent(...)`: una referencia inexistente podía omitirse y persistirse como nula o fallar por FK con un error interno. | Adaptadores de actividad, módulo, lección, resultados, progreso, ayudas, ranking y simulaciones resuelven las referencias requeridas o responden 404 antes de guardar. No se cambia el tratamiento del subsistema IA excluido. |
| A03 | Alta | La operación buscar/crear progreso de módulo no tenía transacción ni exclusión entre solicitudes del mismo estudiante. | `SaveModuleProgressService`, `ModuleProgressRepositoryPort/Adapter` y `UserJpaRepository`: transacción y bloqueo de estudiante antes de buscar/escribir. Ocho escrituras paralelas deben producir el mismo ID y una fila. No se concilian duplicados históricos. |
| A04 | Alta | Asignar otra vez un estudiante a un grupo creaba una nueva fila y podía replicar perfiles históricos; no se serializaban asignaciones concurrentes. | `AddStudentRankingService`, puerto/adaptador de ranking y `GroupJpaRepository`: bloqueo de grupo y retorno idempotente si la pertenencia ya existe, conservando XP/estrellas. Los scores históricos nulos no provocan una excepción al sumar. No se recalifican resultados ni logros antiguos. |
| A05 | Moderada | El cálculo existente de `predictedScore` multiplicaba contadores `int` antes de limitar el resultado y podía desbordarse; NaN/infinito superaban la validación del error de sensor. | `CreateSimulationService` utiliza aritmética `long` intermedia y conserva la misma fórmula/rangos para entradas normales; `Simulation` rechaza valores no finitos. Esta heurística declarativa no concede los nuevos logros ni certifica aprendizaje. |
| A06 | Moderada | Algunas validaciones de DTO no se ejecutaban; `logicLevel=99` se normalizaba silenciosamente y faltaban validaciones de campos antes de alcanzar repositorios. | `@Valid` en actividades, resultados, progreso y asignación; restricciones de IDs obligatorios, intentos/score no negativos, porcentaje 0–100 y nivel lógico 1–3. Se mantienen campos opcionales y edición parcial existentes; no se inventa una escala de nota ni estados académicos nuevos. |
| A07 | Moderada | Retirar al líder de un grupo dejaba al siguiente en posición 2; la retirada no compartía transacción/bloqueo con las asignaciones. | `RemoveStudentRankingService`: retirada y reordenación con el mismo bloqueo de grupo. Eliminar de nuevo una pertenencia o un grupo ausente conserva 204. La regresión reprodujo primero `expected 1 but was 2`. |

Los cambios son locales a esos contratos y escrituras. No se cambia la fórmula de estrellas, la tabla L01–L35, el algoritmo de generación, la política aleatoria, las reglas de ninguno de los simuladores ni la condición 5/5 ya implementada.

## Pruebas y diagnóstico antes de corregir

La línea base ejecutó **253 pruebas, sin fallos ni errores**. Después se añadieron regresiones para errores HTTP y aritmética: **6 pruebas, 5 fallos reproducidos** sobre el comportamiento anterior. Fallaban el tratamiento de errores internos/conflictos/entradas inválidas y los valores extremos de simulación. El caso de negocio/404 compatible ya pasaba.

La primera ejecución de la integración ampliada detectó un supuesto incorrecto del inventario de pruebas: `/` es público por configuración vigente. Se corrigió su lista explícita de rutas públicas, sin cambiar permisos de la aplicación. Se hizo una compilación limpia para eliminar clases incrementales antiguas durante el desarrollo de las nuevas pruebas.

## Estructura y escenarios comprobados

- `unit/BackendErrorContractTest`: 400 de negocio, 404, 400 por JSON/tipo/parámetro, 409 de integridad y 500 sin detalles privados en la respuesta.
- `unit/SimulationArithmeticTest`: contadores máximos, conservación del rango/fórmula y rechazo de NaN/infinito sin persistencia.
- `unit/RankingIdempotencyTest`: pertenencia ya existente, historial preservado y resultados con score nulo.
- `unit/ResultIdentityTest`: compatibilidad del email con el ID canónico del estudiante y rechazo de identidad ausente antes de persistir.
- `integration/BackendPersistenceIntegrationTest`: autenticación real, cookie HttpOnly, 401/403, CRUD curricular, paginación, edición parcial, eliminación, referencias inexistentes, ausencia de filas parciales, progreso concurrente, asignación concurrente/repetida y reordenación al retirar al líder.
- El mismo archivo ejecuta cinco victorias diarias reales, con ambos juegos y soluciones reconstruidas a partir de la configuración persistida, usando las reglas del servidor. Repite la finalización de cada ejercicio concurrentemente y comprueba recibos iguales, progreso 20/40/60/80/100, una única fecha acreditada sólo al quinto, cinco victorias y ausencia de progreso del catálogo oficial.
- Para el ledger de XP, resuelve el nivel oficial 1 de ambos juegos y repite TetriLogic en otra sesión: comprueba un único desbloqueo L01, una fila de ledger, 100 XP, dos niveles de progreso y tres victorias. Cada finalización se solicita concurrentemente tres veces; una partida nueva conserva la recompensa anterior y no la vuelve a conceder.
- Se mantienen las pruebas existentes de 60 plantillas, variantes procedurales, logros/XP idempotente, reintentos de acciones, propiedad de sesiones, conjuntos diarios concurrentes y cambio de fecha en Lima con reloj controlado. No se altera el reloj del equipo.

Las pruebas de persistencia llevan la etiqueta JUnit `integration`; los perfiles Maven `unit` e `integration` permiten ejecutarlas por separado sin mover ni duplicar la suite anterior. H2 siempre usa bases de prueba en memoria. La comprobación PostgreSQL crea su propia red/base/contenedor sin publicar puertos ni utilizar volúmenes de datos de la aplicación; la limpieza verifica etiquetas únicas. No se llama a servicios externos de IA.

## Resultados finales y cobertura

Se ejecutaron las categorías por separado con Maven 3.9.12 y Java 21.0.10 en Docker:

| Ejecución | Resultado |
|---|---|
| Línea base `mvn test` | 253 pruebas; 0 fallos, 0 errores |
| Regresiones HTTP/aritmética antes de las correcciones | 6 pruebas; 5 fallos esperados, 0 errores |
| Regresión de retirada del líder antes de la corrección | 1 prueba; 1 fallo esperado: la posición permanecía en 2 |
| `mvn -Punit test` | **242 pruebas; 0 fallos, 0 errores, 0 omitidas** |
| `mvn -Pintegration test` | **30 pruebas; 0 fallos, 0 errores, 0 omitidas** |
| `mvn verify` final | **272 pruebas; 0 fallos, 0 errores, 0 omitidas; JAR generado y umbrales de cobertura aprobados** |
| `backend/scripts/test-postgres.ps1` final | **9 pruebas de integración; 0 fallos, 0 errores, 0 omitidas en PostgreSQL 16.15 desechable**, incluido ledger XP y diario 5/5 |

Las 242 unitarias y 30 de integración son categorías de las mismas 272 pruebas, no pruebas adicionales para sumar de nuevo. PostgreSQL repite la integración nueva en otro motor; no altera la base de la aplicación. Los artefactos se generan en `backend/target/` y se describen en `backend/TESTING.md`.

Flyway validó y aplicó las 21 migraciones existentes sobre PostgreSQL vacío. La segunda ejecución PostgreSQL incluye el caso adicional de recompensas; no se retocó SQL para hacerla pasar. El script terminó correctamente y retiró los contenedores, su almacenamiento desechable y su red, comprobando sus etiquetas. No se despliegan estos cambios sobre la aplicación local ni sobre un entorno remoto en esta auditoría.

La cobertura final se calcula sobre la ejecución completa del 05/11; los `.exec` de los perfiles parciales y PostgreSQL se guardan por separado y no inflan este informe.

| Ámbito | Líneas | Ramas |
|---|---|---|
| Todo el backend, reporte sin filtros de clases | **72,44 %** — 2.497/3.447 | **61,04 %** — 1.042/1.707 |
| Las 12 clases críticas enumeradas en el POM y el resumen | **97,07 %** — 464/478 | **75,92 %** — 514/677 |

El umbral automático exige al menos **80 % de líneas en cada clase crítica**, no sólo en el agregado. JaCoCo confirma que analiza 12 clases para ese umbral y 266 clases en el reporte completo. No se excluyen clases de baja cobertura del reporte; los porcentajes de líneas no se presentan como cobertura de ramas.

| Clase crítica | Líneas | Ramas |
|---|---|---|
| `AchievementRules` | 100 % | 77,78 % |
| `BoardRules` | 94,20 % | 72,28 % |
| `GameSessionsService` | 93,15 % | 73,21 % |
| `GamificationService` | 100 % | 79,25 % |
| `ProceduralDailyGenerator` | 100 % | 76,67 % |
| `ProceduralDailyService` | 100 % | 80,77 % |
| `RandomDailySelectionPolicy` | 100 % | 100 % |
| `SaveModuleProgressService` | 100 % | Sin ramas contabilizadas |
| `SaveResultService` | 100 % | 100 % |
| `CreateSimulationService` | 96,43 % | 81,25 % |
| `AddStudentRankingService` | 100 % | 100 % |
| `RemoveStudentRankingService` | 100 % | Sin ramas contabilizadas |

Los paquetes de mappers, adaptadores de persistencia, controladores, seguridad y seeders aún necesitan más casos representativos. El detalle por paquete está en `target/coverage-summary.json`; no se crean pruebas de getters o relleno para elevar artificialmente la cifra global. Las ramas de validación/errores y permisos pendientes de ampliar se registran en la guía de continuidad.

El paquete completo `application/useCases` obtiene **92,50 % de líneas**, además de la medición específica de las 12 clases. Las áreas con menor cobertura de líneas son seeders (14,60 %), mappers (52,14 %), adaptadores de persistencia (56,93 %), controladores (68,25 %) y seguridad (76,47 %). Estas cifras se conservan visibles para orientar las siguientes pruebas de comportamiento y de integración.

La comprobación estática disponible incluye compilación Java/MapStruct, análisis sintáctico del script PowerShell, `git diff --check` y comprobación de 83 destinos locales Markdown sin ausencias en los seis documentos revisados. No se configura ni se declara una ejecución de Checkstyle, PMD o SpotBugs. Spring Data emite el aviso existente sobre serialización de `PageImpl`; se conserva el formato compatible y se registra su estabilización como B12.

## Límites y continuidad

Un resultado verde acredita los escenarios ejecutados, no todas las combinaciones de cada endpoint ni el despliegue remoto. Las reglas académicas indefinidas, la reanudación del tablero, restricciones únicas históricas, límites operativos, seguridad de despliegue y ampliación de cobertura están detallados con evidencia y criterios de cierre en [Pendientes de implementación del backend](../guias/Pendientes_Implementacion_Backend.md).

No hay un linter Java/Checkstyle/PMD/SpotBugs configurado en el POM. La compilación y MapStruct actúan como comprobaciones estáticas disponibles. Sus advertencias previas de mapeo/API obsoleta y genéricos no se ocultan ni se convierten en una afirmación de análisis estático completo. No se ejecutan suites frontend por esta modificación exclusivamente backend; la integración de los contratos probados se comprueba desde HTTP y persistencia.
