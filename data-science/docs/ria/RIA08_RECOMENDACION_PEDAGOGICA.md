# RIA08 - Recomendación pedagógica

## Propósito

RIA08 recomienda una intervención pedagógica y compara al estudiante con el
grupo de su mismo grado disponible durante el entrenamiento.

Categorías posibles:

- `individual_support`;
- `reinforce_group`;
- `maintain_strategy`;
- `increase_challenge`.

## Funcionamiento

- Versión: `ria08-v2-grade-comparison`.
- Técnica: clasificación supervisada con perfil y explicación posterior.
- Compara errores, inactividad y actividades completadas con promedios del
  mismo grado.
- Si no existe el grado, usa el promedio global e informa
  `reference_scope=global_training_group`.
- Genera razones y acciones a partir de la categoría y de las brechas.

## Endpoints

| Método | Ruta | Uso |
| --- | --- | --- |
| `POST` | `/ria08/pedagogical` | Obtener recomendación pedagógica. |
| `GET` | `/ria08/info` | Consultar clases, referencias por grado y métricas. |

Alias temporal: `/ria10/pedagogical`.

### Entrada

```json
{
  "attempts": 6,
  "errors": 3,
  "ai_interactions": 2,
  "inactive_days": 2,
  "help_requested": 1,
  "completed_activities": 8,
  "grade": 6,
  "logical_level": "medio"
}
```

### Salida relevante

- `result`: categoría recomendada.
- `details.pedagogical_profile` y `pedagogical_risk`.
- `details.confidence`.
- `details.grade_comparison`, con valor del estudiante, promedio, diferencia y
  estado por métrica.
- `details.reasons`.
- `details.teacher_suggestion`, con título, resumen, prioridad, acciones y
  momento de revisión.

## Contexto recomendado para una IA generativa

```json
{
  "ria": "RIA08",
  "recommendation": "reinforce_group",
  "pedagogical_profile": "requiere refuerzo pedagógico",
  "pedagogical_risk": "medium",
  "confidence": 0.81,
  "grade_comparison": {
    "grade": 6,
    "reference_scope": "same_grade_training_group",
    "metrics": {
      "errors": {
        "student_value": 7,
        "grade_average": 3,
        "difference": 4,
        "status": "needs_attention"
      }
    }
  },
  "reasons": ["Cantidad de errores superior al promedio del grado."],
  "teacher_suggestion": {
    "title": "Aplicar refuerzo pedagógico",
    "priority": "medium",
    "actions": ["Asignar una práctica guiada."],
    "review_after_activities": 3
  }
}
```

La IA debería resumir la comparación, explicar las razones y convertir las
acciones en una propuesta editable. No necesita recibir las referencias de
todos los grados.

## Restricciones

- Comparación no significa ranking ni juicio de capacidad.
- `confidence` no reemplaza la revisión docente.
- Informar cuando se usa referencia global.
- No revelar datos de otros estudiantes de la cohorte.
- Mantener las acciones como sugerencias, no órdenes automáticas.

## Implementación

- Modelo: [`ria08_pedagogica.py`](../../app/adapters/ml_models/ria08_pedagogica.py)
- Servicio: [`ria08_service.py`](../../app/application/services/ria08_service.py)
- Schema: [`schemas.py`](../../app/adapters/api/schemas.py)

