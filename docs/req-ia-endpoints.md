# Requisitos pendientes de endpoints IA y agregación de datos

**Revisión documental: 30/10/2026. Alineación con PostgreSQL V17: parcial.** Sustituye el borrador que afirmaba, sin verificación actual, qué faltaba en la API desplegada. Se contrastaron el cliente TypeScript, las rutas FastAPI del repositorio y los metadatos de la base local. No se consultó la publicación remota.

Esta revisión **no autoriza implementar, iniciar ni modificar `data-science`, modelos, endpoints o proxy**. Las rutas propuestas y cambios de DTO descritos siguen pendientes. [Pendientes backend](docs/guias/Pendientes_Endpoints_Backend.md) · [Estado actual](docs/ESTADO_ACTUAL.md) · [Contratos vigentes](docs/guias/Contratos_Frontend_Backend.md).

## 1. Diferencias encontradas

| Tema | Borrador anterior | Situación comprobada / ajuste documental |
|---|---|---|
| Feedback de código | `/code-feedback/analyze` | El frontend declara **`/code/feedback/analyze`**. Corregir el documento; ninguna de esas dos rutas está expuesta en el `main.py` inspeccionado. |
| Feedback ya existente | Omitía RIA02 | FastAPI sí expone `/ria02/feedback`, pero su request/response es diferente; no es un alias intercambiable. |
| PSeInt | Se afirmaba que faltaba en producción | `/ria12/pseint` está declarado en el cliente y no en las rutas FastAPI inspeccionadas. No se infiere el estado de producción. |
| `hints` | Lista de textos | `CodeFeedbackResponse` espera objetos con `severity`, `message` y ubicación opcional. |
| Feedback por misión/entorno | Objetos/mapas | El DTO cliente actual espera strings opcionales. Cambiar a mapas requeriría versionar el contrato/consumidores. |
| Agregación | Se suponía disponible al conectar IA | No hay rutas de agregación en las APIs inspeccionadas ni lector PostgreSQL en el wiring del dataset IA; el actual usa `ExcelDatasetRepository`. |
| Features | Todos los campos numéricos, score y nivel siempre disponibles | PostgreSQL admite nulos y los juegos actuales registran trazas sin notas ni nivel cognitivo validado. No fabricar ceros o etiquetas. |
| Grupo → actividades | Se podía confundir con grupo → estudiantes | La membresía existe en `group_students`; la asignación grupo–actividad no existe. Son relaciones diferentes. |
| FE-07 / FE-08 | Componentes presentados como consumidores activos | Se hallaron adaptadores y tipos; no consumidores de esas cuatro funciones en las pantallas actuales. Los juegos activos no producen Blockly/PSeInt. |

## 2. Endpoints de código pendientes

Las rutas de esta sección son **propuestas para actividades de programación**. No son necesarias para manipular piezas de TetriLogic o componentes ópticos de Neon Flow. No generar código ficticio a partir de sus tableros para rellenar un contrato antiguo.

### 2.1 POST `/ria12/pseint`

Contrato declarado por `PSeIntGenerateRequest` / `PSeIntGenerateResponse`:

```json
{
  "blockly_code": "CODIGO_DE_UNA_ACTIVIDAD_DE_PROGRAMACION"
}
```

```json
{
  "pseudocode": "PSEUDOCODIGO_GENERADO",
  "pseint_diagram": "DIAGRAMA_GENERADO_EN_EL_FORMATO_ACORDADO"
}
```

El formato del diagrama y la gramática admitida deben acordarse con su consumidor antes de implementarlo; el tipo string por sí solo no demuestra compatibilidad Mermaid/PSeInt. Tener un componente RIA12 en el repositorio no significa que exista esta ruta o su conexión con la aplicación.

Las columnas `simulations.blockly_code`, `pseudocode` y `pseint_diagram` existen desde V9. La generación no las guarda automáticamente: cualquier persistencia futura debe pasar por el backend y su autorización. No insertar código libre en los eventos tipados de `trace_context`.

### 2.2 POST `/code/feedback/analyze`

Se conserva la **ruta que espera el cliente**. Antes de crear otra implementación, evaluar un adaptador al servicio RIA02 existente: sus datos y resultados no coinciden directamente con este contrato.

| Request cliente actual | Tipo y relación con datos |
|---|---|
| `id_student` | String; la identidad debe comprobarse en el backend, no confiar en el cuerpo. |
| `id_activity` | String opcional; si existe, cargar su actividad autorizada. No exigir formato UUID: hay IDs oficiales como `act-c001-30`. |
| `blockly_code`, `pseudocode` | Strings de una actividad que realmente produzca código. No existen en la interacción de los juegos activos. |
| `pseint_diagram` | String opcional. |
| `ml_features` | Objeto de características con procedencia, versión y corte temporal definidos; no inventar valores obligatorios. |
| `challenge_context` | Título, descripción opcional, entorno, dificultad opcional, misiones/posiciones opcionales y `max_blocks` requerido por el DTO actual. |

**Desajuste de contexto:** `activities` contiene metadatos y posiciones, y `activity_missions.max_blocks` guarda un límite por misión. No existe un máximo global equivalente. Definir contexto por misión o permitir un límite global ausente mediante un cambio coordinado del DTO; no elegir el primer límite ni usar cero como dato desconocido.

El DTO cliente exige esta forma de respuesta; ejemplo ilustrativo cuando exista una predicción válida, no un resultado medido en esta revisión:

```json
{
  "feedback_summary": "Resumen de la revisión del código",
  "hints": [
    {
      "severity": "info",
      "message": "Explicación contextual",
      "block_type": "TIPO_DE_BLOQUE"
    }
  ],
  "detected_patterns": [],
  "suggested_blocks": [],
  "predicted_score": 75,
  "mission_feedback": "Texto de feedback por misión",
  "environment_feedback": "Texto de feedback del entorno",
  "generated_by": "IDENTIDAD_Y_VERSION_DEL_GENERADOR"
}
```

`severity` admite `info`, `warning`, `error`; `line` es opcional numérico. `mission_feedback` y `environment_feedback` son strings opcionales en el cliente actual.

**Predicción ausente:** `predicted_score` es obligatorio en TypeScript, pero la base admite nulo y puede no existir un modelo aplicable. Acordar una respuesta explícita de indisponibilidad o migrar el DTO a valor nullable con un estado de calidad. No devolver un número ficticio para satisfacer el tipo ni convertirlo automáticamente en una nota del estudiante.

`POST /api/v1/performance/rating` ya existe en Spring y no orquesta esta llamada IA. `simulations.predicted_score` se calcula actualmente mediante una heurística de `CreateSimulationService`; su nombre no acredita una predicción ML. Tampoco se ha acordado una escala única para mezclarlo con `activity_results.score`.

## 3. Agregación pendiente: responsabilidad de Spring y PostgreSQL

El frontend declara hoy las rutas `/features/aggregate/student/{idStudent}` y `/features/aggregate/group/{idGroup}` en **`AI_ENDPOINTS`**, usando `aiAxiosInstance`. No existen implementaciones en las rutas inspeccionadas. Ese cliente no hereda por sí solo la configuración de sesión de `axiosInstance`.

**Diseño recomendado, pendiente de aprobación e implementación:** publicar la agregación en Spring, que ya posee la base y sus comprobaciones de identidad, y entregar a IA sólo las features autorizadas. Esto exige cambiar los consumidores; no basta con sustituir una URL en este documento.

| Ruta propuesta en Spring | Acceso propuesto |
|---|---|
| `GET /api/v1/features/aggregate/student/{idStudent}` | Propio estudiante o TEACHER/ADMIN, siguiendo las reglas existentes. |
| `GET /api/v1/features/aggregate/group/{idGroup}` | TEACHER/ADMIN autorizado para el grupo; lista paginada de estudiantes únicos. |

La consulta de grupo usa `group_students`. No requiere `group_activities`, salvo que se añada expresamente el filtro «actividades asignadas». No inferir membresía o asignación a partir de resultados, puntuaciones o la primera actividad de un curso. La tabla de membresía no tiene una restricción única por pareja: agregar por estudiante distinto para evitar multiplicaciones de filas.

El contrato debe definir ventana UTC, corte `as_of`, juego/versión de reglas y fuente. La paginación propuesta del grupo cambia el contrato actual de array; coordinar `aiEndpoints.ts`, `aiService.ts`, `apiService.ts`, `aiModels.ts` y las pantallas antes de activarla. No eliminar las rutas actuales del cliente como parte de una edición documental.

### 3.1 Fuentes disponibles y semántica pendiente

| Dato | Fuente actual | Uso permitido / limitación |
|---|---|---|
| Episodios observados | `telemetry_attempts.id_attempt`, estudiante, juego, contexto V17 | Contar IDs únicos de la fuente/ventana definida; no sumar además acumulados de `activity_results.attempts`. |
| Éxitos y tasa observada | Resultado de trazas, versión de reglas y actividad opcional | Declarados por cliente; no validación académica. Sin denominador, tasa nula, no cero ficticio. |
| Errores técnicos | Eventos REJECT y CHECK con `matched=false` | Publicar `invalid_actions` y `failed_checks`; no llamarlos automáticamente errores de programación o pedagógicos. |
| Ayuda estática | Eventos HELP con `source=STATIC` | Contar aparte de consultas IA; no aumentar `ai_interactions`. |
| Consultas IA | `help_requests.ai_interactions`, campo heredado `pistas_ia` y futuros eventos AI | Elegir una fuente y unidad documentadas; no sumar contadores acumulativos ni dar por probada una consulta real. |
| Actividades completadas observadas | DISTINCT de actividad no nula con éxito observado | No equivale a `module_progress` ni debe completar notas o desbloqueos. |
| Inactividad observada | Último evento/episodio recibido según política | No es último login; sin observaciones no se conoce. Contrastar reloj cliente con `received_at`. |
| Nivel | `activities.logic_level`; nivel de gamificación en grupos | Describen actividad/gamificación, no un nivel cognitivo del estudiante validado. `logical_level` requiere definición independiente. |
| Puntaje | `activity_results.score`, `simulations.predicted_score` | Recursos distintos, nullable y con escalas/heurísticas diferentes. La telemetría nueva no concede puntajes. |
| Código y pseudocódigo | `simulations` desde V9 | Pueden ser nulos y no los generan los juegos activos. |
| Contexto del reto | Actividad, misiones y plantillas JSONB | Los textos y condiciones históricas de TetriLogic no deben presentarse a IA como reglas activas. |

Los registros anteriores con `trace_context` nulo no recuperan retrospectivamente actividad, inicio o secuencia. Excluir o identificar trazas truncadas (`droppedEvents>0`), datos de prueba y usuarios ficticios. Una lectura de esquema no certifica la calidad del dataset.

### 3.2 Contrato de calidad propuesto

`AggregatedFeaturesResponse` exige hoy todos los campos no nulos y una respuesta plana. **Ese contrato no está alineado completamente con los datos disponibles.** Proponer una versión nueva con nulos y calidad explícita. Ejemplo sin observaciones en la ventana:

```json
{
  "schema_version": "learning-features-v1",
  "id_student": "ID_AUTORIZADO",
  "window_start": "2026-10-01T00:00:00Z",
  "as_of": "2026-10-30T23:00:00Z",
  "metrics": {
    "attempts": 0,
    "invalid_actions": 0,
    "failed_checks": 0,
    "static_help_requests": 0,
    "observed_completed_activities": 0,
    "success_rate": null,
    "observed_inactive_days": null,
    "ai_interactions": null,
    "logical_level": null,
    "score": null
  },
  "quality": {
    "status": "insufficient_data",
    "sample_size": 0,
    "excluded_truncated_attempts": 0,
    "client_reported": true,
    "missing_fields": ["success_rate", "observed_inactive_days", "ai_interactions", "logical_level", "score"]
  }
}
```

El número cero de eventos contados en una ventana vacía es distinto de una medición ausente. Las entradas actuales RIA01/03/04/08/10/11 requieren varios de esos datos no nulos: **no enviar este objeto directamente a un modelo ni rellenar nulos con cero**. Definir un adaptador versionado y no solicitar inferencia cuando falten features requeridas.

Las fuentes/ventana y política de ausencia deben acompañar cada extracción; separar por estudiante y tiempo para evaluación, usar sólo el prefijo disponible al predecir y excluir etiquetas/resultados posteriores de predictores tempranos. La exportación analítica requiere seudonimización y control de acceso; no conceder lectura anónima de PostgreSQL al servicio IA.

## 4. Correspondencia con los dos pendientes backend

- **PATCH:** reutiliza columnas actuales; no aporta por sí mismo nuevas métricas IA. Si cambia plantilla o contexto, preservar el versionado de la observación. PUT debe conservar compatibilidad.
- **Asignación grupo–actividad:** necesita migración posterior disponible y endpoints propios; no existe esa relación en V17. Es opcional para la agregación de estudiantes y necesaria sólo si se filtra por tareas asignadas.
- **Agregación:** sus rutas/DTO son una ampliación analítica separada propuesta aquí, no una función ya entregada al implementar los dos bloques anteriores.

La base ya tiene soporte parcial de código, resultados, ayudas, grupos y trazas. No necesita otra tabla duplicada de intentos para estas lecturas. Sí requiere contratos y consultas que respeten unidades, identidad, ausencia de datos y reglas activas; una nueva asignación no se obtiene sólo de los campos existentes.

## 5. Rutas existentes en el código FastAPI inspeccionado

| Método | Rutas declaradas |
|---|---|
| POST | `/ria01/predict`, `/ria02/feedback`, `/ria03/recommend`, `/ria04/difficulty`, `/ria08/anomaly`, `/ria10/pedagogical`, `/ria11/time` |
| GET | `/ria01/info`, `/ria02/info`, `/ria03/info`, `/ria04/info`, `/ria08/info`, `/ria10/info`, `/ria11/info`, `/health` |

Estas quince declaraciones se identificaron mediante análisis estático, sin importar la aplicación: su arranque puede cargar o entrenar modelos. No son una comprobación HTTP remota, de modelos entrenados ni de disponibilidad del servicio.

## 6. Evidencias y aceptación futura

Fuentes: [rutas cliente](frontend/src/infrastructure/api/aiEndpoints.ts), [modelos TypeScript](frontend/src/infrastructure/api/models/aiModels.ts), [cliente IA](frontend/src/infrastructure/api/aiService.ts), [rutas FastAPI](data-science/app/adapters/api/main.py), [esquemas IA](data-science/app/adapters/api/schemas.py), [wiring del dataset](data-science/app/infrastructure/container.py) y [migraciones](backend/src/main/resources/db/migration).

Se verificó en PostgreSQL local la aplicación de V16/V17 y el esquema de actividades, simulaciones, resultados, ayudas, grupos, membresías, usuarios y telemetría, sin leer filas personales ni modificar datos. No existe una relación grupo–actividad en las entidades/migraciones/tablas inspeccionadas.

Antes de implementar:

- [ ] Acordar qué funciones de programación continúan en alcance y sus consumidores reales.
- [ ] Aprobar propietario y autenticación de la agregación, nombres, ventana, unidades, nulos y DTO versionados.
- [ ] Probar ausencia de datos, contexto antiguo, truncamientos, grupos duplicados y permisos propios/ajenos.
- [ ] Verificar persistencia sólo cuando corresponda, sin otorgar notas desde una respuesta IA.
- [ ] Acordar contrato/adaptador de RIA02 antes de duplicar feedback.
- [ ] Autorizar explícitamente cualquier implementación que modifique IA o su proxy.

Ninguna casilla se declara completada por esta edición de documentación.
