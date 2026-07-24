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
      ml_support/       Preprocessing y seleccion interna de modelos.
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
  scripts/              Demostraciones ejecutables y diagnosticos.
  tests/                Pruebas unitarias y de integracion.
  docs/ria/             Guias funcionales y contexto para IA por cada RIA.
  AI_CONTEXT.md         Contexto compacto para futuras IAs.
```

## Flujo general

1. El dataset se carga desde `data/dataset.xlsx`.
2. Los modelos se entrenan o se cargan desde `saved_models`.
3. FastAPI valida el body con Pydantic.
4. El endpoint transforma nombres externos en columnas internas.
5. El servicio llama al modelo y devuelve una respuesta compacta.
6. El frontend/backend consume `result`, metricas principales y `details`.

La UI local reutiliza los modelos de `saved_models`. En un inicio normal no
reentrena los RIA; solo entrena y persiste un modelo cuando falta o su version no
es compatible.

## RIA disponibles

| RIA | Funcion | Endpoint |
| --- | --- | --- |
| RIA01 | Estimacion predictiva binaria sin score/success rate; incluye un modo de regla separado para datos finales. | `POST /ria01/predict` |
| RIA02 | Retroalimentacion automatica explicable con riesgo, razones, evidencia, pistas y contexto para IA. | `POST /ria02/feedback` |
| RIA03 | Recomendacion de actividades con seleccion agrupada entre XGBoost jerarquico y multiclase. | `POST /ria03/recommend` |
| RIA04 | Generacion inteligente de retos de programacion. | `POST /ria04/generate` |
| RIA05 | Clasificacion multiclase de seis tipos de error logico a partir de telemetria del simulador. | `POST /ria05/errors` y `/ria05/errors/batch` |
| RIA06 | Segmentacion explicable de frecuencia, duracion y continuidad mediante K-means. | `POST /ria06/patterns` y `/ria06/patterns/batch` |
| RIA07 | Riesgo y anomalias sin historial temporal individual, usando una cohorte de referencia y alertas explicables. | `POST /ria07/early-warning` y `/ria07/early-warning/batch` |
| RIA08 | Recomendacion pedagogica y comparacion con estudiantes del mismo grado. | `POST /ria08/pedagogical` |
| RIA09 | Clasificacion de tiempo. | `POST /ria09/time` |
| RIA10 | Clasificacion heuristica de calidad de codigo en basico, intermedio o avanzado. | `POST /ria10/code` y `/ria10/code/batch` |

Las rutas anteriores de RIA06-RIA09 siguen disponibles como aliases ocultos
para dar tiempo a migrar clientes existentes, pero la documentacion de OpenAPI
solo presenta la numeracion actual.

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
2. [`docs/ria/README.md`](docs/ria/README.md)
3. La guia individual `docs/ria/RIAxx_*.md`
4. El servicio en `app/application/services/riaXX_service.py`
5. El modelo en `app/adapters/ml_models/riaXX_*.py`
6. El schema y endpoint en `app/adapters/api/`

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

Pruebas y demostracion de RIA01:

```powershell
data-science\venv\Scripts\python.exe -B -m unittest tests.test_ria01 -v
data-science\venv\Scripts\python.exe -B scripts/demo_ria01.py
```

Guia funcional y contrato del actual RIA07:

- `RIA07_RIESGO_ANOMALIAS_GUIA.md`

Guia funcional, contrato y vista docente del actual RIA06:

- `RIA06_ANALISIS_PATRONES_GUIA.md`
