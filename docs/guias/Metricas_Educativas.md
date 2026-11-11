# Métricas educativas de PIPRE

El panel de `/docente/metricas` utiliza partidas, victorias y entregas verificadas en PostgreSQL. Docente y Administrador usan la misma pantalla y la misma consulta. El tablero de resultados de IA y su selector individual se retiraron del panel de gestión. El tutor y sus registros alimentan la sección «Uso del tutor».

## Alcance de los filtros

El servidor determina el rol desde la sesión autenticada. `teacher_groups` y `group_students` limitan al docente a sus aulas y a sus estudiantes activos. El administrador puede consultar la población estudiantil activa de toda la institución, incluidos estudiantes sin aula. `users.grade` aporta el grado registrado. Las opciones y la consulta aplican el mismo alcance, y un aula o estudiante ajeno devuelve 403. El agregado general cuenta una vez a cada estudiante. En la comparación por aula, un estudiante con varias membresías aparece en cada aula visible a la que pertenece. La membresía actual define la cohorte y no acredita el aula física desde la que se jugó.

Las fechas son inclusivas en `America/Lima`. El filtro de curso selecciona el juego de la partida. Los logros son del estudiante y abarcan ambos cursos, pues varios requieren niveles de los dos juegos. El avance por curso es acumulado hasta el cierre del periodo. Los demás indicadores usan eventos o sesiones de las fechas seleccionadas según la tabla.

## Fórmulas y fuentes

| Indicador | Fórmula y campos principales |
|---|---|
| Estudiantes activos y días activos | Estudiantes y fechas distintas con un inicio, una acción persistida o una victoria. Se usan `game_sessions.started_at`, `game_session_actions.received_at` y `verified_game_victories.completed_at`. |
| Estrellas del periodo y distribución | Mejor `verified_game_victories.stars` por estudiante, juego y número de nivel, entre victorias del periodo. Se excluye el diario procedural. La suma de mejores estrellas produce el total, y la distribución cuenta los niveles por calificación. |
| Promedio de estrellas y logros | Total dividido entre todos los estudiantes de la cohorte filtrada, incluidos quienes tienen cero. |
| Logros desbloqueados y distribución | Filas de `achievement_xp_ledger` por `student_id` y `awarded_at`. La clave `player_achievement_id` representa un desbloqueo único. La distribución cuenta estudiantes por cantidad de desbloqueos del periodo. |
| Retos iniciados y resueltos | Un reto distinto por estudiante, juego y nivel base, o por identificador diario, entre las sesiones iniciadas en el periodo. Se cuenta como resuelto cuando al menos una de esas sesiones tiene una victoria verificada antes del cierre. |
| Tasa de finalización | Retos resueltos ÷ retos iniciados × 100. |
| Intentos hasta resolver | Promedio de la posición del primer intento resuelto de cada reto resuelto, entre las sesiones iniciadas en el periodo. Los reintentos posteriores a esa victoria quedan fuera del promedio. |
| Avance por curso | Niveles base distintos con victoria hasta el cierre ÷ (30 niveles × estudiantes de la cohorte) × 100. Se usa el historial de `verified_game_victories` para reconstruir cortes anteriores. |
| Sesiones, participación y duración | Las sesiones se cuentan por `session_id` y fecha de inicio, incluyendo la práctica y el diario verificados. La duración media de sesiones cerradas dentro del periodo usa `completed_at − started_at`. Incluye tiempo transcurrido y pausas. El porcentaje de estudiantes con nivel base resuelto usa victorias de nivel base en el periodo ÷ estudiantes filtrados × 100. |
| Indicadores por dimensión | Se vincula `game_sessions.level_template` a `tetrilogic_templates.config` o `neonflow_templates.config` y se usa su `cognitiveDimension` explícita. Se calculan retos resueltos sobre iniciados, intentos hasta resolver, duración media de sesiones resueltas, mejores estrellas medias por reto y retos resueltos por estudiante que inició al menos uno. La serie divide sesiones resueltas entre iniciadas en cada fecha o semana. Los diarios y plantillas sin etiqueta quedan fuera de las dimensiones. |
| Consejos predeterminados, generados y por reglas | Se cuentan `neonflow_tutor_requests` con `status='DELIVERED'` por `finished_at`, `game_session_hints` por `consumed_at` y acciones `HELP` aceptadas sin `hintId` por `received_at`. La acción que consume un recibo contextual se cuenta a través del recibo. Las ayudas sin origen se muestran como históricas sin clasificar. |
| Promedio de consejos y uso de IA | Consejos registrados ÷ estudiantes filtrados. El porcentaje de uso de IA es estudiantes distintos con entrega `GENERATIVE` ÷ estudiantes filtrados × 100. Se cuentan estudiantes distintos con al menos una entrega de `delivered_ordinal > 8` y el total de esas entregas. |
| Consejos y resultados | Número de victorias del periodo y media de `stars` por presencia de una entrega del mismo `session_id` dentro del periodo. Es una comparación descriptiva. |

Las tasas y medias sin denominador se muestran con un guion. Los tres niveles de calificación, las victorias repetidas y el porcentaje de finalización se mantienen como indicadores distintos. Se muestran etiquetas de dimensión en los retos de TetriLogic que cuentan con ellas. Las plantillas actuales de Neon Flow carecen de esa clasificación. Las estrellas y los resultados del juego describen el desempeño en el simulador. La prueba de razonamiento aporta la medición directa del pensamiento lógico.

## Propuesta futura de pretest y postest

El encargo describe una prueba de 18 preguntas, con 6 de análisis lógico, 6 de resolución de problemas y 6 de reconocimiento de patrones. La propuesta queda como referencia de investigación fuera del panel de métricas.

La integración propuesta consiste en guardar el instrumento versionado con sus 18 ítems, su clave aprobada y su dimensión explícita. Una tabla de aplicaciones registraría identificador de estudiante, versión, fase `PRE` o `POST`, fecha y aula de aplicación. La restricción única cubriría estudiante, intervención y fase. Una tabla de respuestas usaría la aplicación y el ítem como clave. Se debe definir quién puede importar o corregir evaluaciones, cómo se resuelven duplicados y si la tesis autoriza puntuar respuestas omitidas antes de crear la migración. Los resultados deben entrar mediante un flujo autenticado y auditado. El panel reutilizaría los permisos actuales por aula y el filtro por grado para consultar pares de la misma intervención e instrumento.

Con la clave aprobada y si la corrección es dicotómica, el total sería la suma de aciertos sobre 18 y cada dimensión la suma sobre 6. La comparación mostraría media pre y post de los mismos pares, diferencia individual `post − pre`, ganancia media como promedio de diferencias y conteos por signo de la diferencia. También mostraría el tamaño de muestra por aula y grado. Las comparaciones individuales y grupales dependen de contar con ambas evaluaciones. Cualquier ganancia normalizada o análisis inferencial debe seguir el método aprobado en el plan. La comparación descriptiva por sí sola no establece causalidad.

Faltan respuestas calificadas para calcular aciertos por ítem, clasificación cognitiva explícita de Neon Flow y una medida de calidad de la retroalimentación. La duración registrada de la sesión sirve como indicador de uso y puede incluir inactividad.

## Implementación

- `EducationalMetricsController` expone `GET /api/v1/educational-metrics` y `GET /api/v1/educational-metrics/options`.
- `EducationalMetricsRepository` utiliza `metrics/scope.sql`, `metrics/options.sql` y `metrics/report.sql` con parámetros enlazados y agregados de PostgreSQL. Se usa una consulta por informe, sin llamadas por estudiante.
- `DocenteMetricasPage` gestiona filtros, estado de carga, errores y actualización. `MetricsSections` presenta estadísticas, comparaciones, series accesibles y desempeño individual.
- Se retiraron `RiaBentoGrid`, sus seis tarjetas y los cargadores anteriores del módulo de métricas. La base, los servicios de IA y los simuladores conservan sus contratos de ejecución.

## Validación del 11/11/2026

| Prueba | Resultado |
|---|---|
| `BackendPersistenceIntegrationTest` en PostgreSQL desechable | 25 pruebas aprobadas. Se comprobó alcance por rol, rechazo de aula y estudiante ajenos, fechas, deduplicación de membresías y victorias, ausencia de denominador y exclusión de solicitudes de IA fallidas. |
| Vitest | 521 pruebas aprobadas. |
| Cypress `application.cy.ts` y `metricas.cy.ts` | 18 pruebas aprobadas. Se comprobaron ambos simuladores, los resultados institucionales de un estudiante, los filtros, el retiro del panel anterior y el ancho en 320, 390, 768 y 1440 px. |
| Compilación frontend y tipos de Cypress | Aprobados. |

La aplicación local sirve el panel actualizado en el puerto 5173 y la API en el 8081. Las comprobaciones con registros de estudiantes se hicieron en bases desechables.

Tras retirar la vista de evaluaciones, se volvieron a ejecutar las 18 pruebas de navegador. Docente y administrador consultaron los cuatro apartados con datos de una cuenta de prueba que completó retos en ambos simuladores. La prueba específica de PostgreSQL comprobó la transición entre cuenta registrada, partida activa con acciones y pistas, y victorias verificadas. Las entregas generativas se verificaron con un proveedor simulado.
