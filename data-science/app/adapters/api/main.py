from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.adapters.api.schemas import RIA01Input
from app.infrastructure.container import (
    create_dataset_repository,
    create_ria01_model_repository,
    create_ria01_service,
)


dataset_repository = create_dataset_repository()
model_repository = create_ria01_model_repository()
ria01_service = create_ria01_service()

FEATURE_NAME_MAP = {
    "intentos": "attempts",
    "errores": "errors",
    "nivel_logico": "logical_level",
    "interacciones_ia": "ai_interactions",
    "ratio_error": "error_ratio",
    "dependencia_ia": "ai_dependency",
}


def to_ria01_model_input(data: RIA01Input):
    return {
        "intentos": data.attempts,
        "errores": data.errors,
        "nivel_logico": data.logical_level,
        "interacciones_ia": data.ai_interactions,
    }


def train_and_save_ria01(reason: str):
    print(reason)

    df = dataset_repository.load()

    ria01_service.train(df)
    model_repository.save(ria01_service.model)

    print("Modelo entrenado y guardado")


# =========================
#  LIFESPAN
# =========================

@asynccontextmanager
async def lifespan(app: FastAPI):

    if model_repository.exists():
        print("Loading existing model...")

        try:
            loaded_model = model_repository.load()
            expected_features = ria01_service.model.feature_columns
            loaded_features = getattr(loaded_model, "feature_columns", None)

            if loaded_features != expected_features:
                train_and_save_ria01("Existing model is incompatible. Retraining model...")
            else:
                ria01_service.set_model(loaded_model)
                print("Model loaded successfully")

        except Exception as exc:
            train_and_save_ria01(
                f"Could not load existing model ({type(exc).__name__}: {exc}). Retraining model..."
            )

    else:
        train_and_save_ria01("Training model from scratch...")

    yield

    print("Closing API...")


# =========================
#  APP
# =========================

app = FastAPI(
    title="API IA - RIA01",
    lifespan=lifespan
)


# =========================
# ENDPOINT PREDICT
# =========================

@app.post("/ria01/predict")
def predict_ria01(data: RIA01Input):
    return ria01_service.predict(to_ria01_model_input(data))


# =========================
#  ENDPOINT INFO
# =========================

@app.get("/ria01/info")
def info():
    return {
        "trained": ria01_service._trained,
        "features": [
            FEATURE_NAME_MAP.get(feature, feature)
            for feature in ria01_service.model.feature_columns
        ] if ria01_service._trained else [],
        "accuracy": getattr(ria01_service.model, "accuracy", None),
        "precision": getattr(ria01_service.model, "precision", None)
    }


# =========================
#  HEALTH CHECK
# =========================

@app.get("/health")
def health():
    return {
        "status": "ok"
    }
