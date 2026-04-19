## Estructura de ejemplo
```
ml_service/
│
├── src/
│   │
│   ├── domain/                                 # Núcleo de ML: sin FastAPI, sin sklearn, sin torch
│   │   ├── model/                              # Entidades y reglas del dominio de ML
│   │   │   ├── prediction.py                   #   Clase Prediction (dataclass): input + output + score
│   │   │   ├── training_sample.py              #   Representa un sample de entrenamiento
│   │   │   └── model_metadata.py               #   Versión, fecha, métricas del modelo registrado
│   │   │
│   │   ├── ports/
│   │   │   ├── in_/                            # Interfaces de entrada al dominio ML
│   │   │   │   ├── predict_use_case.py         # ABC: predict(input) → Prediction
│   │   │   │   └── train_use_case.py           # ABC: train(dataset) → ModelMetadata
│   │   │   │
│   │   │   └── out/                            # Interfaces que el dominio necesita del exterior
│   │   │       ├── model_repository.py         # ABC: load_model(), save_model()
│   │   │       ├── feature_store_port.py       # ABC: get_features(entity_id)
│   │   │       └── metrics_port.py             # ABC: log_metric(name, value)
│   │   │
│   │   └── exceptions/
│   │       ├── model_not_found.py
│   │       └── prediction_error.py
│   │
│   ├── application/                        # Casos de uso: orquesta domain + ports
│   │   ├── predict_service.py              # Implementa predict_use_case usando model_repository
│   │   ├── train_service.py                # Implementa train_use_case, llama a metrics_port
│   │   └── dto/
│   │       ├── prediction_request.py       # Pydantic: payload de entrada (validación)
│   │       └── prediction_response.py      # Pydantic: respuesta serializada
│   │
│   ├── adapters/                           # Implementaciones concretas de los ports
│   │   │
│   │   ├── in_/                            # Driving adapters (exponen el servicio al exterior)
│   │   │   └── api/
│   │   │       ├── prediction_router.py    # FastAPI router: POST /predict → predict_service
│   │   │       ├── training_router.py      # FastAPI router: POST /train
│   │   │       ├── health_router.py        # GET /health (liveness / readiness)
│   │   │       └── schemas/
│   │   │           └── api_schemas.py      # Pydantic models de request/response HTTP
│   │   │
│   │   └── out/                            # Driven adapters (implementan ports de salida)
│   │       ├── model_loader/
│   │       │   ├── sklearn_adapter.py      # Implementa model_repository con joblib/pickle
│   │       │   └── pytorch_adapter.py      # Implementa model_repository con torch.load
│   │       │
│   │       ├── feature_store/
│   │       │   └── redis_feature_adapter.py  # Implementa feature_store_port usando Redis
│   │       │
│   │       └── metrics/
│   │           └── mlflow_adapter.py     # Implementa metrics_port con MLflow tracking
│   │
│   ├── infrastructure/                 # Configuración, wiring y bootstrapping
│   │   ├── config/
│   │   │   ├── settings.py             # Pydantic BaseSettings: MODEL_PATH, REDIS_URL, etc.
│   │   │   └── dependencies.py         # FastAPI Depends: inyección del service correcto
│   │   │
│   │   ├── container.py                # Dependency Injection: instancia adapters y services
│   │   │                               # (ej. usando dependency-injector o manualmente)
│   │   └── logging_config.py           # Logging estructurado (structlog / loguru)
│   │
│   ├── training/                       # Pipeline de entrenamiento (desacoplado del servicio)
│   │   ├── pipelines/
│   │   │   ├── preprocessing.py        # Limpieza, normalización, feature engineering
│   │   │   ├── training_pipeline.py    # Orquesta train → evaluate → register
│   │   │   └── evaluation.py           # Calcula métricas: accuracy, F1, RMSE, etc.
│   │   │
│   │   ├── experiments/
│   │   │   └── experiment_tracker.py   # Wrapper sobre MLflow / Weights & Biases
│   │   │
│   │   └── scripts/
│   │       └── train.py                # Entry point: python train.py --config cfg.yaml
│   │
│   └── main.py                         # Entry point FastAPI: crea app, incluye routers
│
├── models/                             # Artefactos serializados de los modelos entrenados
│   ├── v1/
│   │   └── model.pkl
│   └── v2/
│       └── model.pt
│
├── data/                               # Datos (ignorados en git salvo muestras pequeñas)
│   ├── raw/
│   └── processed/
│
├── tests/
│   ├── unit/
│   │   ├── domain/                     # Tests de entidades y reglas puras
│   │   └── application/                # Tests de servicios con mocks de los ports
│   │
│   └── integration/                    # Tests del API completo (TestClient de FastAPI)
│       └── test_prediction_api.py
│
├── requirements.txt                    # o pyproject.toml
├── Dockerfile
└── .env                                # MODEL_PATH, REDIS_URL, MLFLOW_TRACKING_URI
```