# Data Science - PIPRE

Este modulo concentra la capa de machine learning del proyecto PIPRE. Su
responsabilidad es transformar datos de interaccion del estudiante en senales
interpretables para el backend, el frontend y una futura capa de IA.

## Estructura actual

```text
data-science/
  app/
    adapters/
      api/              FastAPI y schemas de entrada.
      ml_models/        Modelos y reglas de cada RIA.
      repositories/     Carga de dataset y persistencia joblib.
    application/
      services/         Servicios que estandarizan el uso de modelos.
      metrics.py        Redondeo comun de metricas.
    domain/
      ports/            Puertos/contratos de arquitectura.
    infrastructure/
      container.py      Wiring de repositorios, modelos y servicios.
      settings.py       Rutas de dataset y modelos guardados.
    ui/                 UI local para pruebas con el dataset.
  data/                 Dataset de entrenamiento.
  saved_models/         Modelos entrenados en formato .pkl.
  AI_CONTEXT.md         Contexto compacto para futuras IAs.
```

## Flujo general

1. El dataset se carga desde `data/dataset.xlsx`.
2. Los modelos se entrenan o se cargan desde `saved_models`.
3. FastAPI valida el body con Pydantic.
4. El endpoint transforma nombres externos en columnas internas.
5. El servicio llama al modelo y devuelve una respuesta compacta.
6. El frontend/backend consume `result`, metricas principales y `details`.

## RIA disponibles

| RIA | Funcion | Endpoint |
| --- | --- | --- |
| RIA01 | Clasificacion de desempeno. | `POST /ria01/predict` |
| RIA02 | Retroalimentacion automatica y contexto para IA. | `POST /ria02/feedback` |
| RIA03 | Recomendacion de actividades. | `POST /ria03/recommend` |
| RIA04 | Ajuste adaptativo de dificultad. | `POST /ria04/difficulty` |
| RIA08 | Deteccion de anomalias. | `POST /ria08/anomaly` |
| RIA10 | Recomendacion pedagogica. | `POST /ria10/pedagogical` |
| RIA11 | Clasificacion de tiempo. | `POST /ria11/time` |
| RIA12 | Evaluacion de codigo en UI local. | Sin endpoint directo actual. |

## Respuesta API recomendada

```json
{
  "result": "category",
  "accuracy": 0.8154,
  "precision": 0.587,
  "details": {}
}
```

Las predicciones deben mantenerse cortas. Las metricas diagnosticas o reportes
extendidos deben exponerse en `/riaXX/info`.

## Documentacion para IA

Para que una IA entienda el contexto sin leer todo el repositorio, empezar por:

1. `AI_CONTEXT.md`
2. El servicio en `app/application/services/riaXX_service.py`
3. El modelo en `app/adapters/ml_models/riaXX_*.py`
4. El schema y endpoint en `app/adapters/api/`

`AI_CONTEXT.md` incluye las skills operativas necesarias: control de alcance,
revision de leakage, contrato API, persistencia de modelos, smoke tests y
construccion de contexto para agentes IA.

## Validacion rapida

```powershell
data-science\venv\Scripts\python.exe -m compileall -q data-science/app
```

```powershell
$env:PYTHONPATH='data-science'
data-science\venv\Scripts\python.exe -c "from app.adapters.api.main import app; print('api import ok')"
```
