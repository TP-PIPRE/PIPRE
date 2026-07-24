# RIA10 - Evaluación automática de código

## Propósito

RIA10 clasifica la calidad estimada del trabajo de programación en:

- `Código básico`;
- `Código intermedio`;
- `Código avanzado`.

La implementación actual usa señales académicas y de interacción. No analiza el
texto fuente, el árbol sintáctico ni la ejecución real del código.

## Funcionamiento

- Versión: `ria10-code-v2`.
- Técnica: Random Forest.
- Variables: errores, intentos, interacciones IA, ayuda, actividades,
  inactividad, edad, grado, nivel lógico y emoción detectada.
- La etiqueta se construye con una regla heurística sobre esas mismas variables.
- `accuracy` y `precision` indican consistencia con esa etiqueta, no acuerdo con
  evaluaciones de docentes.
- El lote admite hasta 500 estudiantes.

## Endpoints

| Método | Ruta | Uso |
| --- | --- | --- |
| `POST` | `/ria10/code` | Clasificar un estudiante. |
| `POST` | `/ria10/code/batch` | Clasificar hasta 500 estudiantes. |
| `GET` | `/ria10/info` | Consultar versión, variables, clases y advertencia. |

### Entrada

```json
{
  "student_id": "student-1",
  "student_name": "Estudiante 1",
  "errors": 3,
  "attempts": 6,
  "ai_interactions": 2,
  "help_requested": 1,
  "completed_activities": 8,
  "inactive_days": 2,
  "age": 12,
  "grade": 6,
  "logical_level": "medio",
  "detected_emotion": "neutral"
}
```

### Salida relevante

```json
{
  "result": "Código intermedio",
  "student_id": "student-1",
  "student_name": "Estudiante 1",
  "accuracy": 0.0,
  "precision": 0.0,
  "details": {
    "model_version": "ria10-code-v2",
    "target_source": "heuristic_rule",
    "metrics_note": "La etiqueta de calidad es heurística."
  }
}
```

## Contexto recomendado para una IA generativa

```json
{
  "ria": "RIA10",
  "estimated_code_level": "Código intermedio",
  "target_source": "heuristic_rule",
  "signals": {
    "errors": 3,
    "attempts": 6,
    "help_requested": 1,
    "completed_activities": 8,
    "logical_level": "medio"
  },
  "instruction": "Proponer próximos pasos sin afirmar que se inspeccionó el código."
}
```

Una IA puede proponer práctica, revisión o progresión, pero debe indicar que la
clasificación se basa en señales de actividad. No debe describir errores de
sintaxis, estilo o estructura si no recibió y analizó el código por otro medio.

`detected_emotion`, edad, nombre e identificador son datos sensibles o
potencialmente innecesarios. Omitirlos del prompt salvo que exista una
justificación pedagógica y autorización apropiada.

## Restricciones

- No afirmar que RIA10 leyó o ejecutó el código.
- No usar la categoría como calificación.
- No presentar las métricas heurísticas como validez externa.
- La emoción detectada no permite diagnósticos psicológicos.
- La decisión final corresponde al docente.

## Implementación

- Modelo: [`ria10_codigo.py`](../../app/adapters/ml_models/ria10_codigo.py)
- Servicio: [`ria10_service.py`](../../app/application/services/ria10_service.py)
- Schema: [`schemas.py`](../../app/adapters/api/schemas.py)
- Pruebas: [`test_ria10.py`](../../tests/test_ria10.py)

