from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.adapters.api.schemas import RIA01Input, RIA03Input
from app.application.metrics import round_metric
from app.infrastructure.container import (
    create_dataset_repository,
    create_ria01_model_repository,
    create_ria01_service,
    create_ria03_model_repository,
    create_ria03_service,
)


dataset_repository = create_dataset_repository()
ria01_model_repository = create_ria01_model_repository()
ria03_model_repository = create_ria03_model_repository()
ria01_service = create_ria01_service()
ria03_service = create_ria03_service()

RIA01_FEATURE_NAME_MAP = {
    "intentos": "attempts",
    "errores": "errors",
    "nivel_logico": "logical_level",
    "interacciones_ia": "ai_interactions",
    "ratio_error": "error_ratio",
    "dependencia_ia": "ai_dependency",
}

RIA03_FEATURE_NAME_MAP = {
    "nivel_logico": "logical_level",
    "dias_inactivo": "inactive_days",
    "interacciones_ia": "ai_interactions",
    "intentos": "attempts",
    "ratio_ia": "ai_ratio",
    "inactividad_relativa": "relative_inactivity",
    "engagement": "engagement",
    "consistencia": "consistency",
    "intensidad_total": "total_intensity",
    "eficiencia": "efficiency",
}


def to_ria01_model_input(data: RIA01Input):
    return {
        "intentos": data.attempts,
        "errores": data.errors,
        "nivel_logico": data.logical_level,
        "interacciones_ia": data.ai_interactions,
    }


def to_ria03_model_input(data: RIA03Input):
    return {
        "nivel_logico": data.logical_level,
        "dias_inactivo": data.inactive_days,
        "interacciones_ia": data.ai_interactions,
        "intentos": data.attempts,
    }


def train_and_save_ria01(reason: str):
    print(reason)

    df = dataset_repository.load()

    ria01_service.train(df)
    ria01_model_repository.save(ria01_service.model)

    print("RIA01 model trained and saved")


def train_and_save_ria03(reason: str):
    print(reason)

    df = dataset_repository.load()

    ria03_service.train(df)
    ria03_model_repository.save(ria03_service.model)

    print("RIA03 model trained and saved")


def load_or_train_ria01():
    if ria01_model_repository.exists():
        print("Loading existing RIA01 model...")

        try:
            loaded_model = ria01_model_repository.load()
            expected_features = ria01_service.model.feature_columns
            loaded_features = getattr(loaded_model, "feature_columns", None)

            if loaded_features != expected_features:
                train_and_save_ria01("Existing RIA01 model is incompatible. Retraining model...")
            else:
                ria01_service.set_model(loaded_model)
                print("RIA01 model loaded successfully")

        except Exception as exc:
            train_and_save_ria01(
                f"Could not load existing RIA01 model ({type(exc).__name__}: {exc}). Retraining model..."
            )

    else:
        train_and_save_ria01("Training RIA01 model from scratch...")


def load_or_train_ria03():
    if ria03_model_repository.exists():
        print("Loading existing RIA03 model...")

        try:
            loaded_model = ria03_model_repository.load()
            expected_features = ria03_service.model.feature_columns
            loaded_features = getattr(loaded_model, "feature_columns", None)
            expected_version = ria03_service.MODEL_VERSION
            loaded_version = getattr(loaded_model, "model_version", None)

            if loaded_features != expected_features or loaded_version != expected_version:
                train_and_save_ria03("Existing RIA03 model is incompatible. Retraining model...")
            else:
                ria03_service.set_model(loaded_model)
                print("RIA03 model loaded successfully")

        except Exception as exc:
            train_and_save_ria03(
                f"Could not load existing RIA03 model ({type(exc).__name__}: {exc}). Retraining model..."
            )

    else:
        train_and_save_ria03("Training RIA03 model from scratch...")


# =========================
#  LIFESPAN
# =========================

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_or_train_ria01()
    load_or_train_ria03()

    yield

    print("Closing API...")


# =========================
#  APP
# =========================

app = FastAPI(
    title="API IA",
    lifespan=lifespan
)


# =========================
# ENDPOINT PREDICT
# =========================

@app.post("/ria01/predict")
def predict_ria01(data: RIA01Input):
    return ria01_service.predict(to_ria01_model_input(data))


@app.post("/ria03/recommend")
def recommend_ria03(data: RIA03Input):
    return ria03_service.predict(to_ria03_model_input(data))


# =========================
#  ENDPOINT INFO
# =========================

@app.get("/ria01/info")
def info_ria01():
    return {
        "trained": ria01_service._trained,
        "features": [
            RIA01_FEATURE_NAME_MAP.get(feature, feature)
            for feature in ria01_service.model.feature_columns
        ] if ria01_service._trained else [],
        "accuracy": round_metric(getattr(ria01_service.model, "accuracy", None)),
        "precision": round_metric(getattr(ria01_service.model, "precision", None))
    }


@app.get("/ria03/info")
def info_ria03():
    return {
        "trained": ria03_service._trained,
        "features": [
            RIA03_FEATURE_NAME_MAP.get(feature, feature)
            for feature in ria03_service.model.feature_columns
        ] if ria03_service._trained else [],
        "accuracy": round_metric(getattr(ria03_service.model, "accuracy", None)),
        "precision": round_metric(getattr(ria03_service.model, "precision", None))
    }


# =========================
#  HEALTH CHECK
# =========================

@app.get("/health")
def health():
    return {
        "status": "ok"
    }
