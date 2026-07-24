# RIA01 - Clasificación de desempeño

## Propósito

RIA01 estima tempranamente si el desempeño del estudiante es `low` o
`adequate`. Utiliza señales disponibles durante la actividad y no necesita la
calificación final para predecir.

El resultado sirve para priorizar observación o apoyo. No debe utilizarse como
nota, sanción ni diagnóstico definitivo.

## Funcionamiento

- Técnica: clasificación supervisada con selección de modelo y variables.
- Versión del servicio: `ria01-v10.1-support-package`.
- Variables principales: intentos, errores, nivel lógico e interacciones con IA.
- `errores` representa eventos; puede ser mayor que `intentos`.
- El modelo predictivo no usa puntaje ni tasa de éxito como variables.
- Existe un modo interno de regla para resultados finales, pero no está
  publicado como endpoint.

## Endpoints

| Método | Ruta | Uso |
| --- | --- | --- |
| `POST` | `/ria01/predict` | Clasificar un estudiante. |
| `GET` | `/ria01/info` | Consultar variables y métricas globales del modelo. |

### Entrada

```json
{
  "attempts": 6,
  "errors": 3,
  "logical_level": "medio",
  "ai_interactions": 2
}
```

### Salida principal

```json
{
  "result": "adequate",
  "accuracy": 0.0,
  "precision": 0.0
}
```

`accuracy` y `precision` son métricas globales de evaluación del modelo, no la
confianza de esa predicción individual.

## Contexto recomendado para una IA generativa

Una IA que redacte una explicación o sugerencia puede recibir:

```json
{
  "ria": "RIA01",
  "performance_category": "adequate",
  "attempts": 6,
  "errors": 3,
  "errors_per_attempt": 0.5,
  "logical_level": "medio",
  "ai_interactions": 2,
  "instruction": "Explicar el resultado sin presentarlo como calificación."
}
```

Datos útiles:

- `result`: categoría estimada.
- `attempts` y `errors`: esfuerzo y eventos de error observados.
- `errors_per_attempt`: resumen calculado para interpretar ambos conteos.
- `logical_level`: nivel declarado o disponible antes de la predicción.
- `ai_interactions`: uso de apoyo IA durante la actividad.

No es necesario enviar el dataset, importancias completas, búsquedas de
hiperparámetros ni datos identificatorios del estudiante.

## Restricciones

- No afirmar que `adequate` equivale a aprobar.
- No presentar `low` como una capacidad permanente.
- No interpretar `accuracy` como probabilidad individual.
- El mensaje generado debe invitar a revisar evidencia de la actividad.

## Implementación

- Modelo: [`ria01_desempeño.py`](../../app/adapters/ml_models/ria01_desempeño.py)
- Servicio: [`ria01_service.py`](../../app/application/services/ria01_service.py)
- Schema: [`schemas.py`](../../app/adapters/api/schemas.py)

