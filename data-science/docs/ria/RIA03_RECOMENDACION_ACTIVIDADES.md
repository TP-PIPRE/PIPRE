# RIA03 - Recomendación de actividades

## Propósito

RIA03 recomienda el nivel de la siguiente actividad: `basic`,
`intermediate` o `advanced`. Busca mantener un reto adecuado a las señales
recientes e históricas disponibles antes de la actividad.

## Funcionamiento

- Versión del servicio: `ria03-v5.1-historical-target`.
- Técnica: selección entre clasificación jerárquica y multiclase.
- La etiqueta de entrenamiento es `rendimiento` histórico con clases bajo,
  medio y alto.
- `rendimiento` se usa en entrenamiento, pero no se solicita para predecir.
- Los promedios históricos y el desempeño previo son opcionales y deben haberse
  calculado antes de la actividad actual.

## Endpoints

| Método | Ruta | Uso |
| --- | --- | --- |
| `POST` | `/ria03/recommend` | Recomendar el nivel de una actividad. |
| `GET` | `/ria03/info` | Consultar variables seleccionadas y métricas. |

### Entrada

```json
{
  "logical_level": "medio",
  "inactive_days": 2,
  "ai_interactions": 3,
  "attempts": 6,
  "errors": 2,
  "help_requested": 1,
  "historical_attempts_avg": 5.2,
  "historical_errors_avg": 2.1,
  "historical_help_avg": 1.0,
  "previous_performance": "medio"
}
```

Los cuatro primeros campos son obligatorios. Los demás son opcionales.

### Salida principal

```json
{
  "result": "intermediate",
  "accuracy": 0.0,
  "precision": 0.0
}
```

## Contexto recomendado para una IA generativa

```json
{
  "ria": "RIA03",
  "recommended_level": "intermediate",
  "logical_level": "medio",
  "inactive_days": 2,
  "attempts": 6,
  "errors": 2,
  "help_requested": 1,
  "ai_interactions": 3,
  "previous_performance": "medio",
  "instruction": "Proponer una actividad breve acorde al nivel recomendado."
}
```

Datos útiles:

- `result`: dificultad recomendada.
- `logical_level`: nivel lógico conocido.
- `inactive_days`: continuidad reciente.
- `attempts`, `errors` y `help_requested`: esfuerzo y necesidad de apoyo.
- `ai_interactions`: dependencia o uso de apoyo.
- Promedios históricos: solo si son temporales y confiables.
- `previous_performance`: solo si corresponde a actividades anteriores.

Para generar una actividad concreta, combinar este contexto con RIA04. RIA03
decide el nivel; RIA04 construye el reto con tema, objetivo y bloques.

## Restricciones

- La recomendación no publica automáticamente una actividad.
- No usar promedios históricos calculados con el resultado que se quiere
  predecir.
- `advanced` no significa que el estudiante deba recibir siempre retos
  avanzados.
- Las métricas globales no representan confianza individual.

## Implementación

- Modelo: [`ria03_recomendador.py`](../../app/adapters/ml_models/ria03_recomendador.py)
- Servicio: [`ria03_service.py`](../../app/application/services/ria03_service.py)
- Schema: [`schemas.py`](../../app/adapters/api/schemas.py)

