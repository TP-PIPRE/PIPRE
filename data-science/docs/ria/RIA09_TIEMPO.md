# RIA09 - Clasificación de tiempo

## Propósito

RIA09 clasifica el tiempo relativo esperado para resolver una actividad como
`short`, `medium` o `long`. Ayuda a organizar seguimiento y carga de trabajo.

No devuelve minutos exactos ni una fecha de finalización.

## Funcionamiento

- Versión: `ria09-v2`.
- Técnica: Random Forest.
- Usa intentos, errores, interacciones IA, inactividad, ayuda, actividades,
  edad, grado y nivel lógico.
- La etiqueta de entrenamiento se construye con una puntuación heurística y
  cuantiles 33/66 de la cohorte.
- El servicio traduce `corto`, `medio` y `largo` a `short`, `medium` y `long`.

## Endpoints

| Método | Ruta | Uso |
| --- | --- | --- |
| `POST` | `/ria09/time` | Clasificar el tiempo relativo. |
| `GET` | `/ria09/info` | Consultar variables y métricas del modelo. |

Alias temporal: `/ria11/time`.

### Entrada

```json
{
  "attempts": 6,
  "errors": 3,
  "ai_interactions": 2,
  "inactive_days": 2,
  "help_requested": 1,
  "completed_activities": 8,
  "age": 12,
  "grade": 6,
  "logical_level": "medio"
}
```

### Salida principal

```json
{
  "result": "medium",
  "accuracy": 0.0,
  "precision": 0.0
}
```

## Contexto recomendado para una IA generativa

```json
{
  "ria": "RIA09",
  "relative_time_category": "medium",
  "attempts": 6,
  "errors": 3,
  "inactive_days": 2,
  "help_requested": 1,
  "completed_activities": 8,
  "logical_level": "medio",
  "instruction": "Proponer una planificación flexible sin inventar minutos."
}
```

La IA puede usar la categoría junto con señales resumidas para sugerir:

- dividir una actividad en pasos;
- programar un punto de revisión;
- recomendar una pausa o acompañamiento;
- adaptar la cantidad de tareas.

No enviar `age` ni `grade` al prompt si la recomendación puede generarse sin
esos datos.

## Restricciones

- `long` no significa retraso ni fracaso.
- No convertir la categoría a minutos sin una calibración externa.
- Las métricas miden la etiqueta heurística de la cohorte.
- No usar el resultado como fecha límite automática.

## Implementación

- Modelo: [`ria09_tiempo.py`](../../app/adapters/ml_models/ria09_tiempo.py)
- Servicio: [`ria09_service.py`](../../app/application/services/ria09_service.py)
- Schema: [`schemas.py`](../../app/adapters/api/schemas.py)

