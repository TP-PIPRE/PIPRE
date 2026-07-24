# RIA02 - Retroalimentación automática

## Propósito

RIA02 determina si el estudiante necesita retroalimentación y prepara
explicaciones, pistas y contexto para una IA generativa. Su salida está
diseñada para orientar sin entregar la solución completa.

## Funcionamiento

- Versión del servicio: `ria02-v4`.
- Analiza el código, lenguaje, errores actuales, intentos, errores anteriores,
  nivel lógico y objetivo de la actividad.
- Calcula recurrencia de errores, complejidad del código, tipo de dificultad,
  prioridad y un puntaje de riesgo basado en reglas calibradas.
- `score` y `success_rate` pueden complementar el contexto, pero no se usan en
  la decisión final indicada por `final_score_used_for_decision=false`.
- Genera directamente `details.llm_context`.

## Endpoints

| Método | Ruta | Uso |
| --- | --- | --- |
| `POST` | `/ria02/feedback` | Analizar una ejecución y generar contexto. |
| `GET` | `/ria02/info` | Consultar métricas, umbrales y calibración. |

### Entrada

```json
{
  "code": "for paso in range(3): print(paso)",
  "language": "python",
  "errors": ["minor_review"],
  "attempts": 3,
  "score": 75,
  "success_rate": 0.75,
  "previous_errors": [],
  "logical_level": "medio",
  "activity_objective": "Resolver el reto usando una repetición"
}
```

### Salida relevante

La respuesta contiene:

- `result`: `needs_guidance` u `on_track`.
- `details.needs_feedback`, `feedback_type` y `priority`.
- `details.risk_score`, `risk_cutoff` y `reasons`.
- `details.recurrent_errors` y `code_complexity`.
- `details.suggestions` e `input_warnings`.
- `details.evidence`.
- `details.llm_context`.

## Contexto recomendado para una IA generativa

Usar como base `details.llm_context`, porque ya limita y organiza la
información necesaria:

```json
{
  "student_level": "medio",
  "language": "python",
  "activity_objective": "Resolver el reto usando una repetición",
  "main_problem": "Error actual: minor_review",
  "recommended_tone": "breve, guiado y con una pista concreta",
  "available_context": {
    "attempts": 3,
    "errors_count": 1,
    "score": 75,
    "success_rate": 0.75
  },
  "avoid": "No dar la solución completa; guiar con pistas cortas."
}
```

También pueden agregarse:

- `details.reasons`, para explicar por qué se activó el apoyo.
- `details.suggestions`, como acciones permitidas.
- `details.recurrent_errors`, para priorizar el error repetido.
- Un fragmento mínimo de `code`, solo cuando sea necesario para formular la
  pista.

No enviar el historial completo, mensajes sensibles ni código ajeno a la
actividad actual.

## Instrucción sugerida para la IA

```text
Genera una pista breve y progresiva. No escribas la solución completa.
Menciona primero el problema principal, formula una pregunta de guía y propone
un único cambio que el estudiante pueda probar.
```

## Restricciones

- La retroalimentación debe ser pedagógica, no una corrección automática final.
- Un puntaje alto de riesgo no es probabilidad de fracaso.
- El código puede contener información sensible; minimizar el fragmento enviado.
- Las métricas globales del modelo no necesitan incluirse en cada prompt.

## Implementación

- Modelo: [`ria02_feedback.py`](../../app/adapters/ml_models/ria02_feedback.py)
- Servicio: [`ria02_service.py`](../../app/application/services/ria02_service.py)
- Schema: [`schemas.py`](../../app/adapters/api/schemas.py)

