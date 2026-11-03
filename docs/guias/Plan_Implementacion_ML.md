# Plan de implementación de Machine Learning

**Propuesta de trabajo: 30/10/2026, contexto actualizado el 02/11.** Este plan prepara una integración posterior; no declara modelos entrenados ni autorización para modificar `data-science/`, sus modelos, proxy o contenedor. El encargo de [35 logros](Sistema_35_Logros.md) añadió sesiones verificadas, estrellas, diario y XP, sin notas académicas automáticas ni validación de aprendizaje.

[Estado actual](../ESTADO_ACTUAL.md) · [Contratos vigentes](Contratos_Frontend_Backend.md) · [Revisión de endpoints IA](../req-ia-endpoints.md) · [Informe de integración](../informes/Integracion_TetriLogic_NeonFlow_ML.md) · [Consultas de inspección](../Consultas_Analitica_Intentos.sql).

## 1. Punto de partida y objetivo

El primer entregable debe ser un dataset auditable y un informe descriptivo del proceso de resolución. Entrenar o conectar una predicción viene después de acordar su utilidad, etiqueta, momento de uso y criterio de evaluación. No adaptar las observaciones a los nombres de los modelos existentes rellenando los campos que falten.

| Comprobado en código y documentación vigentes | Consecuencia para ML |
|---|---|
| 30 retos oficiales por juego; alias y prototipos conservados. | Identificar plantilla canónica, versión, geometría y reglas; no convertir alias en retos nuevos. |
| TetriLogic activo completa por conteos exactos de filas/columnas, incluidos ceros. | Ignorar condiciones históricas de orden, contactos, orientación obligatoria y bloqueo. Un exceso intermedio es una exploración permitida. |
| Neon Flow comprueba trayectoria y color de receptores. | Separar sus eventos y variables de las manipulaciones de poliominós. |
| V17 guarda contexto, eventos, estado inicial/final, actividad opcional, recepción y huella idempotente. | Reutilizar esas observaciones declarativas sin confundirlas con sesiones verificadas. No editar V1…V19. |
| V18/V19 añaden sesiones/acciones y victorias reproducidas por el servidor, con estrellas y logros. | Distinguir origen `verified` de `clientReported`; enlazar explícitamente antes de extraer y no duplicar una misma partida por aparecer en ambos canales. Las estrellas no son etiquetas pedagógicas. |
| La telemetría anterior sigue validando identidad y contrato, no la solución. | Su `SUCCESS` es éxito observado. Sólo el nuevo canal verifica las reglas; ninguno certifica dominio cognitivo. |
| Un episodio se envía al terminar o abandonar; el siguiente puede empezar desde un tablero ya resuelto. | Los episodios no equivalen a ejercicios independientes. Distinguir estado inicial y trayectoria del mismo estudiante. |
| La cola es de mejor esfuerzo y hay truncamientos identificables. | La falta de registro no prueba inactividad o abandono; medir cobertura y sesgo de recepción. |
| El servicio IA local usa `ExcelDatasetRepository`; el arranque puede cargar o entrenar modelos. | La revisión es estática. No importar ni iniciar la aplicación para inspeccionarla. |
| `pipre.seed.demo-data=false` evita nuevos resultados de demostración, pero no todas las cuentas ficticias. | Auditar procedencia antes de exportar. El flag no convierte la base existente en un dataset real. |

Las pruebas históricas de integración acreditan comportamiento técnico de aquel lote. No acreditan cantidad suficiente de estudiantes reales, representatividad, etiquetas pedagógicas ni rendimiento predictivo. No hay en esta revisión una cohorte real etiquetada y cuantificada que permita aprobar entrenamiento: si la auditoría encuentra pocos sujetos o desenlaces, la entrega debe seguir siendo descriptiva. Sesenta retos y numerosos eventos de pruebas no equivalen a sesenta estudiantes reales ni a muestras independientes.

## 2. Decisiones que deben cerrarse antes de programar ML

Registrar estas decisiones en una ficha de experimento versionada, con responsable docente, de datos y de backend:

- **Uso:** ayuda al docente o investigación del proceso; determinar quién verá la salida y qué decisión puede tomar. La salida no modifica restricciones del juego, nota, ranking, acceso o progreso.
- **Unidad:** episodio observado, estudiante o actividad; ventana UTC y definición del denominador. No sumar episodios con `activity_results.attempts`, que puede ser acumulativo.
- **Objetivo:** separar descripción de acciones, predicción de un desenlace técnico y evaluación pedagógica. Seleccionar un objetivo primario antes de elegir algoritmo.
- **Momento de predicción:** historial de episodios ya recibidos, comienzo de una actividad o prefijo de interacción. Fijar corte y horizonte antes de extraer features.
- **Etiqueta y supervisión:** especificar quién verifica la etiqueta, qué casos son desconocidos y cómo se revisan desacuerdos. Una ausencia de éxito no es automáticamente un fracaso.
- **Datos admitidos:** piloto real, consentimiento/autorización institucional aplicable, procedencia, retención, acceso y exclusiones de QA/demo.
- **Criterio de avance:** métricas, comparación base, coste de falsos positivos/negativos y umbrales fijados antes de abrir el conjunto de prueba. No se ha acordado todavía ningún umbral numérico de rendimiento o tamaño muestral.

**Candidato técnico para un primer experimento, pendiente de acuerdo:** estimar la probabilidad de completar un reto dentro de un horizonte definido usando únicamente historial disponible antes del corte. Si la etiqueta procede de telemetría, denominarla «completado observado»; para resolución verificada usar exclusivamente el canal de sesiones validado el 02/11 y documentar sus reglas/versiones. No reclasificar datos antiguos ni presentar esa probabilidad como nivel de pensamiento lógico.

**Limitación de disponibilidad:** actualmente los eventos permanecen en el navegador hasta el cierre del episodio. Se puede analizar un prefijo después de recibirlo, pero no afirmar que ese prefijo estuvo disponible al servidor en tiempo real. Una asistencia durante el episodio requeriría otro contrato de envío autorizado, con presupuesto de frecuencia, orden, deduplicación y privacidad; no está incluida en este plan como función existente.

## 3. Diccionario inicial de datos y features

Cada feature debe declarar nombre, tipo, unidad, fuente, fórmula, ventana, corte, versión y política de ausencia. El identificador del estudiante sirve para separar sujetos y autorizar consultas; no debe entrar como predictor.

| Variable candidata | Fuente y cálculo propuesto | Límite obligatorio |
|---|---|---|
| Episodios recibidos | IDs únicos de `telemetry_attempts` dentro de la ventana y recibidos antes del corte. | Para reconstruir disponibilidad histórica exigir `received_at <= as_of`; una hora cliente anterior no prueba disponibilidad. Distinguir contexto nulo, práctica independiente y actividad curricular; no duplicar reintentos. |
| Acciones de tablero | PLACE, ROTATE, RETURN, RESET aceptados, separados por juego. | ROTATE con `source=DRAFT` no es una modificación ya colocada; SELECT/CANCEL no son movimientos efectivos. |
| Rechazos técnicos | REJECT por `errorCode`; CHECK con `matched=false` separado. | Límites/colisiones o receptor no iluminado no son errores cognitivos ni errores de código. |
| Ayudas | HELP separado por `source=STATIC` o `AI`, sólo cuando la fuente sea verificable. | La pista actual de Neon Flow es estática. No sumar contadores acumulativos de ayudas y eventos. |
| Tiempos observados | Diferencias de `elapsedMs` dentro del prefijo y latencia de recepción cuando sea interpretable. | Incluyen pausas y sesgo de reloj; no llamarlos tiempo de atención. `received_at` no es la hora de cada acción. |
| Contexto del reto | Juego, plantilla/versión y ruleset declarados; dimensiones/inventario desde la configuración versionada correspondiente. La dificultad la añade Spring al recibir la traza. | El contexto no contiene una copia completa del catálogo. La dificultad es la de la actividad al recibir, no necesariamente al comenzar, y no es nivel cognitivo; no sustituir una configuración histórica por la edición docente actual. |
| TetriLogic: ocupación y diferencia de conteos | Reconstrucción del estado hasta el corte con inventario/geometría y objetivos de filas/columnas de la versión activa. | Contar ceros; permitir excesos intermedios. No usar condiciones históricas, soluciones de fixtures ni estado final posterior. |
| Neon Flow: ediciones y comprobaciones | Estados/acciones de espejos y filtros hasta el corte; reproducción de raycast bajo la versión correspondiente. | No confundir giro, selección y colocación. El resultado del próximo CHECK no es predictor de ese mismo CHECK. |
| Historial de éxito observado | Episodios anteriores al corte con resultado declarado y contexto compatible. | No usar el resultado del episodio que se predice ni tratarlo como nota. Mantener por juego/versión. |
| Ausencia/fiabilidad | Contexto ausente, truncamiento, calidad temporal, procedencia y disponibilidad de actividad. | Conservar indicadores; valor desconocido es `null`, no cero. Los flags de calidad no deben convertirse en proxies de dispositivo o identidad sin evaluación. |

Para auditar un episodio cerrado, comparar eventos con `initialState` y `finalState`; detectar cambios imposibles, incoherencias y diferencias entre estado declarado y replay. Para generar predictores de un prefijo, partir sólo de `initialState` y de las acciones anteriores al corte: no reconstruir hacia atrás desde `finalState`. El estado inicial de un episodio posterior al éxito puede estar ya completo. Separar esos episodios de los comienzos vacíos al medir dificultad o resolución.

Los indicadores conocidos únicamente al cierre, como truncamiento total, recepción final o consistencia con el estado final, sirven para auditar/seleccionar el dataset con una política declarada; no se incluyen como si hubieran estado disponibles para una predicción durante el episodio. También debe informarse el sesgo introducido al excluir episodios con esos indicadores.

No usar como features cognitivas los nombres/correos, UUID, cuentas de prueba, puntuación de ranking, nivel de gamificación o `activities.logic_level`. `simulations.predicted_score` procede actualmente de una heurística; `activity_results.score` tiene otra procedencia y escala. Los campos obligatorios de RIA existentes no crean esos datos ni justifican su imputación.

## 4. Calidad, etiquetado y validación de reglas

Crear primero un informe de calidad reproducible, sin modificar registros históricos:

1. Inventariar observaciones por juego, ruleset, versión, plantilla canónica, procedencia y ventana. Separar legacy sin contexto; no inventarle fechas iniciales, acciones o actividad.
2. Excluir cuentas/filas QA, demo, generadas y procedencia no aclarada del entrenamiento real. Conservar el motivo en el manifiesto de extracción. No inferir datos reales sólo por el formato del ID o por tener `trace_context`.
3. Comprobar unicidad, FK, secuencia, monotonicidad, recepción, tamaño y consistencia de estados. Para secuencias completas excluir `droppedEvents>0`; informar cuántas se pierden y si eso sesga la muestra.
4. Distinguir ausencia de observación, abandono declarado, fallo de comprobación y fracaso final. El flujo actual no convierte CHECK fallido en episodio FAILED. Cierre forzado o pérdida de red puede no producir ABANDON. Para una etiqueta «completó dentro del horizonte», exigir seguimiento suficiente; no convertir falta de recepción o seguimiento censurado en clase negativa.
5. Congelar la versión de catálogo/reglas y capturar la revisión necesaria de una actividad editable. Si no se puede identificar qué configuración tuvo el usuario, marcar desconocida y excluir de replay verificable.
6. Diseñar un validador de replay independiente del cliente, con casos válidos/inválidos de los 60 retos, alias y estados intermedios. No publicar soluciones al frontend ni aplicar validaciones históricas de TetriLogic.
7. Para etiquetas pedagógicas, acordar instrumento/rúbrica con docentes, revisión independiente y tratamiento de desacuerdos. No inferir abstracción, autonomía, atención o capacidad a partir de rotaciones, ayudas o velocidad.

La validación del replay permite verificar un desenlace técnico bajo reglas concretas. Una evaluación de aprendizaje requiere además instrumentos externos y diseño de estudio; no se deduce de esa validación.

## 5. Arquitectura y contratos propuestos

```text
Simuladores → Spring autenticado → PostgreSQL / telemetry_attempts
                                      ↓ lectura autorizada y versionada
                         extracción / agregación / control de calidad
                                      ↓ datos mínimos seudonimizados
                              dataset de investigación
                                      ↓ evaluación offline
                         servicio de inferencia versionado (futuro)
                                      ↓ Spring, flag desactivable
                         salida orientativa y supervisada (futura)
```

Spring conserva autorización y acceso transaccional. El navegador no recibe credenciales de PostgreSQL y el servicio IA no necesita acceso directo a tablas personales. Un dataset de investigación y una respuesta autorizada a un estudiante son recursos distintos: el primero lleva seudónimo, el segundo sólo la identidad estrictamente necesaria para su destinatario.

| Trabajo futuro | Decisión y aceptación necesaria |
|---|---|
| `GET /api/v1/features/aggregate/student/{idStudent}` | Propuesta en Spring: propio estudiante o rol autorizado; contexto, juego, ventana UTC y `as_of`. Denegar identidad ajena sin permiso. |
| `GET /api/v1/features/aggregate/group/{idGroup}` | Propuesta paginada: estudiantes distintos de `group_students`, evitando multiplicación de filas. Definir alcance docente; el rol por sí solo no demuestra propiedad del grupo. |
| DTO de features | Versionar, permitir nulos, declarar calidad/procedencia/corte y requerimientos de inferencia. El borrador `learning-features-v1` no coincide con `AggregatedFeaturesResponse` plano y no nullable. |
| Cliente frontend | Mover agregación al cliente autenticado de Spring de forma coordinada. Hoy `AI_ENDPOINTS` y `aiAxiosInstance` apuntan a otra responsabilidad; cambiar sólo URL no garantiza sesión ni compatibilidad. |
| Inferencia futura | Contrato propio por tarea y versión; rechazo explícito de features incompatibles, `insufficient_data`/`unavailable` y procedencia. No fabricar `predicted_score` porque el tipo actual lo exige. |
| Ruta de código y PSeInt | `/code/feedback/analyze` y `/ria12/pseint` del cliente no están en las rutas FastAPI inspeccionadas. `/ria02/feedback` tiene otro contrato. Son otro frente y no un requisito de estos dos juegos. |

El backend de agregación puede usar membresías sin `group_activities`; esa asociación sólo hace falta si se acuerda filtrar retos asignados. PATCH y asignaciones de grupos tienen su [plan separado](Pendientes_Endpoints_Backend.md) y no son una dependencia automática del piloto ML.

No enviar el nuevo DTO directamente a RIA01/03/04/08/10/11: varios exigen nivel, score u otros campos sin definición válida para los juegos. Revisar finalidad y adaptadores antes de decidir qué componentes se reutilizan. No transformar estados del tablero en Blockly o pseudocódigo ficticio.

## 6. Privacidad y gobierno del piloto

- Acordar con la institución finalidad, población, información a participantes, autorizaciones aplicables y responsables antes de recopilar datos de un piloto real. Documentar tratamiento de menores cuando corresponda.
- Exportar un seudónimo HMAC-SHA256 del ID con secreto fuera de Git/dataset; mantener la tabla de correspondencia separada y restringida si es necesaria. La seudonimización no implica anonimato.
- Retirar nombre, correo, credenciales, IDs crudos, textos libres y fechas exactas innecesarias. Edad/grado no se añaden por comodidad del modelo: justificar necesidad y evaluar su sesgo.
- Definir acceso por rol, registro de extracciones, cifrado, plazo de retención, eliminación y propagación de bajas a datasets/artefactos posteriores. No usar backups de desarrollo como datasets de entrenamiento.
- Separar datos y artefactos privados del repositorio. Usar fixtures sintéticas marcadas sólo en pruebas de contrato, nunca como prueba de rendimiento pedagógico.
- Acordar tamaños mínimos de grupo para informes y evitar detalles que permitan reidentificación. No publicar rankings de riesgo, capacidad o supuesto fraude a partir de detección de anomalías.

## 7. Evaluación sin fugas de información

Definir la población de uso y las particiones antes de entrenar. Mantener todos los episodios del mismo estudiante en la misma partición para medir generalización a estudiantes nuevos; si hay estudiantes en varios grupos, usar componentes conectados para evitar que el mismo sujeto atraviese divisiones por grupo.

Realizar además una evaluación temporal con entrenamiento anterior al periodo de validación/prueba, purgando ventanas solapadas. Si se estudia personalización para estudiantes ya conocidos, declararlo como experimento separado: historial previo permitido, ninguna observación futura. No describirlo como rendimiento en sujetos nuevos. Evaluar transferencia a plantillas no vistas separadamente, sin contar alias como novedades.

Excluir de predictores tempranos resultado final, COMPLETE, duración/estado final, comprobaciones posteriores al corte, notas futuras y soluciones. Ajustar imputación, escalado, codificación, selección y balanceo sólo con entrenamiento. La selección de modelo utiliza validación; prueba queda reservada para la evaluación final.

Estas decisiones siguen las recomendaciones de [evitar fugas de información](https://scikit-learn.org/stable/common_pitfalls.html#data-leakage) y [separar sujetos y evaluar en el futuro](https://scikit-learn.org/stable/modules/cross_validation.html) de la documentación oficial de scikit-learn, consultada el 30/10/2026. La combinación de estudiante y tiempo debe validarse explícitamente; un divisor temporal por sí solo no evita compartir estudiantes entre particiones. Los episodios tienen intervalos irregulares: no aplicar `TimeSeriesSplit` automáticamente como si fueran muestras equiespaciadas.

| Tarea acordada | Base de comparación | Evaluación propuesta |
|---|---|---|
| Clasificación de desenlace técnico | Frecuencia de clase estimada sólo en entrenamiento y un modelo interpretable sencillo. | PR-AUC cuando haya desbalance, ROC-AUC como complemento, calibración/Brier y sensibilidad/especificidad en un umbral pactado. No sólo accuracy. |
| Tiempo hasta desenlace | Mediana de entrenamiento por contexto cuando haya muestra suficiente. | MAE para casos con tiempo conocido; abandono/censura requieren tratamiento explícito y, si procede, un modelo de supervivencia. No asignar cero a no completados. |
| Recomendación posterior | Orden curricular o regla docente existente. | Evaluación offline de cobertura y calidad; demostrar utilidad pedagógica exige un piloto prospectivo independiente. |
| Detección de anomalías | Reglas de calidad conocidas. | Revisión de casos por responsables; una anomalía no es fraude ni diagnóstico de aprendizaje. |

Reportar tamaños y prevalencia por juego/plantilla, intervalos de incertidumbre agrupados por estudiante y resultados por contexto relevante cuando haya muestra suficiente. Revisar diferencias por grupo, dispositivo, ayudas, abandono y versión. No afirmar mejora si el dataset real o las etiquetas no permiten estimarla; en ese caso entregar sólo análisis descriptivo y ampliar el piloto.

Para probabilidades, revisar también curvas de fiabilidad; un Brier menor no demuestra por sí solo mejor calibración, porque combina fiabilidad y discriminación. Ver [calibración de probabilidades](https://scikit-learn.org/stable/modules/calibration.html), consultada el 30/10/2026. Estas referencias metodológicas no requieren instalar ni actualizar dependencias en esta entrega.

## 8. Reproducibilidad y operación futura

Cada ejecución conservará un manifiesto con commit de extracción, esquema/migraciones, hash de catálogos, ruleset, definición de etiquetas/features, filtros de procedencia, ventana/corte, hash del dataset, semilla, lista seudonimizada de particiones, dependencias, parámetros, métricas y revisión responsable. Versionar por separado dataset, features, modelo y contrato.

El artefacto debe declarar features requeridas, política de ausencia, clases/escala y población válida. No cargar un artefacto incompatible, no entrenar automáticamente al arrancar el servidor ni sobrescribir un modelo aprobado por falta de archivo. Esos cambios serían parte de la implementación futura autorizada, no del estado actual.

Introducir primero evaluación offline; después, modo sombra con flag desactivado por defecto y sin salida que condicione al estudiante. Sólo tras revisión se puede plantear una salida orientativa visible. Definir timeout, límites, caché con versión/corte/identidad autorizada, comportamiento ante servicio caído y apagado inmediato. La indisponibilidad de IA no debe impedir seleccionar, mover, girar, comprobar o completar un reto.

Monitorizar volumen, ausencias, distribución de features, calibración cuando lleguen etiquetas y diferencias entre cohortes. Drift no dispara reentrenamiento automático: requiere análisis, evaluación y aprobación de una versión nueva. Mantener reversión al artefacto anterior y a IA desactivada sin cambiar los datos académicos.

## 9. Orden de implementación y criterios de salida

Todas las etapas siguientes están **pendientes**. Las letras son secuencia de trabajo, no sprints ya aprobados ni una estimación de esfuerzo.

| Etapa | Entregable | Criterio para continuar |
|---|---|---|
| A. Definición | Ficha de uso, objetivo, unidad, corte/horizonte, etiqueta y revisión de privacidad. | Decisiones de la sección 2 cerradas por responsables; no hay etiqueta cognitiva inventada. |
| B. Auditoría de datos | Informe de cobertura/procedencia, diccionario, exclusiones y política legacy/demo/QA. | Cohorte real identificable para el piloto; desconocidos preservados; no usar muestra insuficiente para prometer ML. |
| C. Contrato y extracción | DTO/consultas versionados en Spring, autenticación, seudonimización y pruebas de calidad. | Mismos datos producen mismas features; nulos, duplicados, cortes, grupos y permisos cubiertos. Migraciones sólo nuevas si fueran necesarias. |
| D. Validación de desenlace | Replay bajo reglas activas y trazabilidad de revisión de actividad, o etiqueta explícita sólo observada. | Casos válidos/ilegales, ceros TetriLogic, receptores Neon Flow y versiones incompatibles diferenciados; nunca restaurar reglas históricas. |
| E. Autorización de IA | Revisar A–D y delimitar primer cambio de `data-science`, contrato, modelos y proxy. | Autorización explícita posterior. Este documento no la sustituye. |
| F. Experimento offline | Baselines, particiones, pipeline reproducible, model card e informe final. | Cumplir criterios acordados con prueba reservada; si no mejora o falta evidencia, conservar baseline y documentar el resultado. |
| G. Integración en sombra | Inferencia versionada, contratos FE/Spring/IA, flags, observabilidad y reversión. | Sin datos personales innecesarios, sin efectos académicos y sin afectar jugabilidad ante error/latencia. |
| H. Piloto supervisado | Protocolo de uso, revisión docente, seguimiento y decisión de continuidad. | Utilidad y riesgos medidos en población real; ninguna afirmación causal sin diseño apropiado. |

Responsabilidades propuestas: frontend mantiene interacción y cliente; backend mantiene autorización/contrato/extracción; responsable de datos mantiene diccionario/calidad/particiones; docentes definen finalidad y etiquetas; institución define privacidad y acceso; ML mantiene experimentos y operación después de la autorización. Asignar personas y fechas antes de convertir este plan en sprints.

## 10. Pruebas exigidas al implementar

- [ ] Contrato: esquemas versionados, nulos frente a ceros, falta de features, respuestas de indisponibilidad y clientes antiguos.
- [ ] Autorización: propio/ajeno, roles, membresía duplicada, grupos inexistentes, paginación y acceso a exportaciones.
- [ ] Calidad: legacy sin contexto, QA/demo, truncamiento, reloj alterado, recepción tardía, reintento idempotente y doble conteo entre fuentes.
- [ ] Reglas: reproducción de cada reto bajo sus reglas activas y estado inicial, alias equivalentes, historial de ediciones y ausencia de reglas históricas.
- [ ] Fugas: ningún estudiante compartido en evaluación de sujetos nuevos, orden temporal, prefijos disponibles al corte y transformaciones ajustadas sólo en entrenamiento.
- [ ] Reproducibilidad: manifiesto, particiones, artefactos y hashes; error explícito por modelo/dataset incompatible.
- [ ] Resiliencia: IA apagada, timeout, error de contrato y rollback; ambos simuladores siguen funcionando y no conceden notas/puntos/progreso.
- [ ] Privacidad: dataset mínimo seudonimizado, secretos excluidos, acceso/retención/eliminación y reportes sin reidentificación.

Estas casillas son aceptación futura. No se ejecutaron entrenamiento, evaluación de modelos, inferencias ni pruebas de endpoints propuestos al redactar el plan.

## 11. Fuentes y mantenimiento

Se consultaron en lectura el [registro de episodios](../../frontend/src/infrastructure/store/attemptTrace.ts), [hook de trazabilidad](../../frontend/src/ui/components/common/useAttemptTrace.ts), [tipos IA](../../frontend/src/infrastructure/api/models/aiModels.ts), [rutas IA del cliente](../../frontend/src/infrastructure/api/aiEndpoints.ts), [cliente IA](../../frontend/src/infrastructure/api/aiService.ts), [controlador de telemetría](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/TelemetryController.java), [migración V17](../../backend/src/main/resources/db/migration/V17__traceable_telemetry_attempts.sql), [rutas FastAPI](../../data-science/app/adapters/api/main.py), [esquemas FastAPI](../../data-science/app/adapters/api/schemas.py) y [wiring de datos](../../data-science/app/infrastructure/container.py).

La revisión de estos archivos es estática y no certifica el estado del servicio remoto. No se inspeccionaron registros personales para redactar este plan ni se cuantificó un dataset real. Al cambiar contratos, reglas o fuentes, actualizar primero el diccionario y esta secuencia, manteniendo como historial las evidencias de ejecuciones anteriores.
