# RIA05 - Clasificador de errores lógicos

## Propósito

RIA05 clasifica el tipo de error lógico observado en una ejecución del
simulador. Su función es orientar la revisión del docente y seleccionar una
retroalimentación apropiada.

Clases disponibles:

- `incorrect_sequence`: secuencia incorrecta.
- `defective_loop`: ciclo defectuoso.
- `incorrect_condition`: condición incorrecta.
- `misused_sensor`: sensor mal utilizado.
- `invalid_route`: ruta inválida.
- `incomplete_objective`: objetivo incompleto.

## Funcionamiento

- Versión: `ria05-errors-v2`.
- Técnica: Random Forest multiclase.
- Usa resultado esperado/obtenido, posición, sensores, instrucciones,
  colisiones y paso de interrupción.
- Puede entrenarse con registros reales etiquetados mediante `error_type`.
- La primera versión usa prototipos sintéticos reproducibles cuando no existen
  etiquetas reales.
- La predicción no demuestra causalidad y puede requerir revisión docente.

## Endpoints

| Método | Ruta | Uso |
| --- | --- | --- |
| `POST` | `/ria05/errors` | Clasificar una ejecución. |
| `POST` | `/ria05/errors/batch` | Clasificar hasta 500 ejecuciones. |
| `GET` | `/ria05/info` | Consultar clases, técnica y origen del entrenamiento. |

### Entrada abreviada

```json
{
  "expected_result": {
    "position": {"x": 4, "y": 2},
    "sensors": {"front": false}
  },
  "obtained_result": {
    "position": {"x": 3, "y": 2},
    "sensors": {"front": true},
    "completion_ratio": 0.7,
    "executed_steps": 4
  },
  "robot_position": {"x": 3, "y": 2},
  "sensor_states": {},
  "instructions_used": ["move", "repeat", "move", "turn"],
  "collisions": 1,
  "interruption_step": 4,
  "completion_ratio": 0.7
}
```

### Salida relevante

- `error_type` y `error_label`.
- `confidence` y `requires_review`.
- `reasons`.
- `probabilities` por clase.
- `feature_values`.
- `details.training_source`, métricas de validación y aviso docente.

## Contexto recomendado para una IA generativa

```json
{
  "ria": "RIA05",
  "error_type": "misused_sensor",
  "error_label": "Sensor mal utilizado",
  "confidence": 0.78,
  "requires_review": false,
  "reasons": [
    "Los estados de sensores no coinciden con el resultado esperado."
  ],
  "execution_evidence": {
    "collisions": 1,
    "interruption_step": 4,
    "completion_ratio": 0.7
  },
  "instruction": "Generar una pista, no afirmar una causa definitiva."
}
```

Conviene enviar la etiqueta, confianza, revisión, razones y evidencia resumida.
Las probabilidades de todas las clases y `feature_values` solo son necesarias
para una explicación técnica o docente.

RIA05 puede alimentar a RIA02 usando `error_label` como error actual y las
razones como evidencia adicional.

## Restricciones

- Si `requires_review=true`, la IA debe expresar incertidumbre.
- No presentar `confidence` como certeza causal.
- Las métricas con prototipos sintéticos no prueban calidad pedagógica.
- No enviar toda la trayectoria del robot cuando baste un resumen.
- El docente debe poder consultar la ejecución original.

## Implementación

- Modelo: [`ria05_errores.py`](../../app/adapters/ml_models/ria05_errores.py)
- Servicio: [`ria05_service.py`](../../app/application/services/ria05_service.py)
- Schema: [`schemas.py`](../../app/adapters/api/schemas.py)

