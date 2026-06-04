from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.adapters.api.schemas import RIA01Input, RIA03Input, RIA04Input, RIA08Input, RIA10Input, RIA11Input
from app.application.metrics import round_metric
from app.infrastructure.container import (
    create_dataset_repository,
    create_ria01_model_repository,
    create_ria01_service,
    create_ria03_model_repository,
    create_ria03_service,
    create_ria04_model_repository,
    create_ria04_service,
    create_ria08_model_repository,
    create_ria08_service,
    create_ria10_model_repository,
    create_ria10_service,
    create_ria11_model_repository,
    create_ria11_service,
)


dataset_repository = create_dataset_repository()
ria01_model_repository = create_ria01_model_repository()
ria03_model_repository = create_ria03_model_repository()
ria04_model_repository = create_ria04_model_repository()
ria08_model_repository = create_ria08_model_repository()
ria10_model_repository = create_ria10_model_repository()
ria11_model_repository = create_ria11_model_repository()
ria01_service = create_ria01_service()
ria03_service = create_ria03_service()
ria04_service = create_ria04_service()
ria08_service = create_ria08_service()
ria10_service = create_ria10_service()
ria11_service = create_ria11_service()

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

RIA04_FEATURE_NAME_MAP = {
    "puntaje": "score",
    "tasa_exito": "success_rate",
    "errores": "errors",
    "intentos": "attempts",
    "ayuda_solicitada": "help_requested",
    "actividades_completadas": "completed_activities",
    "dias_inactivo": "inactive_days",
    "nivel_logico": "logical_level",
    "ratio_error": "error_ratio",
    "frustracion": "frustration",
    "progreso_reciente": "recent_progress",
    "estabilidad": "stability",
}

RIA08_FEATURE_NAME_MAP = {
    "intentos": "attempts",
    "errores": "errors",
    "puntaje": "score",
    "dias_inactivo": "inactive_days",
}

RIA10_FEATURE_NAME_MAP = {
    "errores": "errors",
    "intentos": "attempts",
    "dias_inactivo": "inactive_days",
    "actividades_completadas": "completed_activities",
    "ayuda_solicitada": "help_requested",
    "interacciones_ia": "ai_interactions",
    "grado": "grade",
    "brecha_errores": "error_gap",
    "brecha_inactividad": "inactivity_gap",
    "brecha_actividades": "activity_gap",
    "ratio_error": "error_ratio",
    "dependencia_ia": "ai_dependency",
    "necesidad_apoyo": "support_need",
    "errores_por_actividad": "errors_per_activity",
    "intentos_por_actividad": "attempts_per_activity",
    "ayuda_por_actividad": "help_per_activity",
    "ia_por_actividad": "ai_per_activity",
    "nivel_logico": "logical_level",
}

RIA11_FEATURE_NAME_MAP = {
    "intentos": "attempts",
    "errores": "errors",
    "interacciones_ia": "ai_interactions",
    "dias_inactivo": "inactive_days",
    "ayuda_solicitada": "help_requested",
    "actividades_completadas": "completed_activities",
    "edad": "age",
    "grado": "grade",
    "ratio_error": "error_ratio",
    "interaccion_relativa": "relative_interaction",
    "ayuda_por_intento": "help_per_attempt",
    "inactividad_relativa": "relative_inactivity",
    "actividad_por_inactividad": "activity_per_inactivity",
    "complejidad": "complexity",
    "nivel_logico": "logical_level",
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


def to_ria04_model_input(data: RIA04Input):
    return {
        "puntaje": data.score,
        "tasa_exito": data.success_rate,
        "errores": data.errors,
        "intentos": data.attempts,
        "ayuda_solicitada": data.help_requested,
        "actividades_completadas": data.completed_activities,
        "dias_inactivo": data.inactive_days,
        "nivel_logico": data.logical_level,
    }


def to_ria08_model_input(data: RIA08Input):
    return {
        "intentos": data.attempts,
        "errores": data.errors,
        "puntaje": data.score,
        "dias_inactivo": data.inactive_days,
    }


def to_ria10_model_input(data: RIA10Input):
    return {
        "intentos": data.attempts,
        "errores": data.errors,
        "interacciones_ia": data.ai_interactions,
        "dias_inactivo": data.inactive_days,
        "ayuda_solicitada": data.help_requested,
        "actividades_completadas": data.completed_activities,
        "grado": data.grade,
        "nivel_logico": data.logical_level,
    }


def to_ria11_model_input(data: RIA11Input):
    return {
        "intentos": data.attempts,
        "errores": data.errors,
        "interacciones_ia": data.ai_interactions,
        "dias_inactivo": data.inactive_days,
        "ayuda_solicitada": data.help_requested,
        "actividades_completadas": data.completed_activities,
        "edad": data.age,
        "grado": data.grade,
        "nivel_logico": data.logical_level,
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


def train_and_save_ria04(reason: str):
    print(reason)

    df = dataset_repository.load()

    ria04_service.train(df)
    ria04_model_repository.save(ria04_service.model)

    print("RIA04 model trained and saved")


def train_and_save_ria08(reason: str):
    print(reason)

    df = dataset_repository.load()

    ria08_service.train(df)
    ria08_model_repository.save(ria08_service.model)

    print("RIA08 model trained and saved")


def train_and_save_ria10(reason: str):
    print(reason)

    df = dataset_repository.load()

    ria10_service.train(df)
    ria10_model_repository.save(ria10_service.model)

    print("RIA10 model trained and saved")


def train_and_save_ria11(reason: str):
    print(reason)

    df = dataset_repository.load()

    ria11_service.train(df)
    ria11_model_repository.save(ria11_service.model)

    print("RIA11 model trained and saved")


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


def load_or_train_ria04():
    if ria04_model_repository.exists():
        print("Loading existing RIA04 model...")

        try:
            loaded_model = ria04_model_repository.load()
            expected_features = ria04_service.model.feature_columns
            loaded_features = getattr(loaded_model, "feature_columns", None)
            expected_version = ria04_service.MODEL_VERSION
            loaded_version = getattr(loaded_model, "model_version", None)

            if loaded_features != expected_features or loaded_version != expected_version:
                train_and_save_ria04("Existing RIA04 model is incompatible. Retraining model...")
            else:
                ria04_service.set_model(loaded_model)
                print("RIA04 model loaded successfully")

        except Exception as exc:
            train_and_save_ria04(
                f"Could not load existing RIA04 model ({type(exc).__name__}: {exc}). Retraining model..."
            )

    else:
        train_and_save_ria04("Training RIA04 model from scratch...")


def load_or_train_ria08():
    if ria08_model_repository.exists():
        print("Loading existing RIA08 model...")

        try:
            loaded_model = ria08_model_repository.load()
            expected_features = ria08_service.model.feature_columns
            loaded_features = getattr(loaded_model, "feature_columns", None)
            expected_version = ria08_service.MODEL_VERSION
            loaded_version = getattr(loaded_model, "model_version", None)

            if loaded_features != expected_features or loaded_version != expected_version:
                train_and_save_ria08("Existing RIA08 model is incompatible. Retraining model...")
            else:
                ria08_service.set_model(loaded_model)
                print("RIA08 model loaded successfully")

        except Exception as exc:
            train_and_save_ria08(
                f"Could not load existing RIA08 model ({type(exc).__name__}: {exc}). Retraining model..."
            )

    else:
        train_and_save_ria08("Training RIA08 model from scratch...")


def load_or_train_ria10():
    if ria10_model_repository.exists():
        print("Loading existing RIA10 model...")

        try:
            loaded_model = ria10_model_repository.load()
            expected_features = ria10_service.model.feature_columns
            loaded_features = getattr(loaded_model, "feature_columns", None)
            expected_version = ria10_service.MODEL_VERSION
            loaded_version = getattr(loaded_model, "model_version", None)

            if loaded_features != expected_features or loaded_version != expected_version:
                train_and_save_ria10("Existing RIA10 model is incompatible. Retraining model...")
            else:
                ria10_service.set_model(loaded_model)
                print("RIA10 model loaded successfully")

        except Exception as exc:
            train_and_save_ria10(
                f"Could not load existing RIA10 model ({type(exc).__name__}: {exc}). Retraining model..."
            )

    else:
        train_and_save_ria10("Training RIA10 model from scratch...")


def load_or_train_ria11():
    if ria11_model_repository.exists():
        print("Loading existing RIA11 model...")

        try:
            loaded_model = ria11_model_repository.load()
            expected_features = ria11_service.model.feature_columns
            loaded_features = getattr(loaded_model, "feature_columns", None)
            expected_version = ria11_service.MODEL_VERSION
            loaded_version = getattr(loaded_model, "model_version", None)

            if loaded_features != expected_features or loaded_version != expected_version:
                train_and_save_ria11("Existing RIA11 model is incompatible. Retraining model...")
            else:
                ria11_service.set_model(loaded_model)
                print("RIA11 model loaded successfully")

        except Exception as exc:
            train_and_save_ria11(
                f"Could not load existing RIA11 model ({type(exc).__name__}: {exc}). Retraining model..."
            )

    else:
        train_and_save_ria11("Training RIA11 model from scratch...")


# =========================
#  LIFESPAN
# =========================

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_or_train_ria01()
    load_or_train_ria03()
    load_or_train_ria04()
    load_or_train_ria08()
    load_or_train_ria10()
    load_or_train_ria11()

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


@app.post("/ria04/difficulty")
def adjust_ria04(data: RIA04Input):
    return ria04_service.predict(to_ria04_model_input(data))


@app.post("/ria08/anomaly")
def detect_ria08(data: RIA08Input):
    return ria08_service.predict(to_ria08_model_input(data))


@app.post("/ria10/pedagogical")
def recommend_ria10(data: RIA10Input):
    return ria10_service.predict(to_ria10_model_input(data))


@app.post("/ria11/time")
def classify_ria11(data: RIA11Input):
    return ria11_service.predict(to_ria11_model_input(data))


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


@app.get("/ria04/info")
def info_ria04():
    return {
        "trained": ria04_service._trained,
        "features": [
            RIA04_FEATURE_NAME_MAP.get(feature, feature)
            for feature in ria04_service.model.feature_columns
        ] if ria04_service._trained else [],
        "accuracy": round_metric(getattr(ria04_service.model, "accuracy", None)),
        "precision": round_metric(getattr(ria04_service.model, "precision", None)),
    }


@app.get("/ria08/info")
def info_ria08():
    return {
        "trained": ria08_service._trained,
        "features": [
            RIA08_FEATURE_NAME_MAP.get(feature, feature)
            for feature in ria08_service.model.feature_columns
        ] if ria08_service._trained else [],
        "dataset_anomaly_ratio": ria08_service.model.anomaly_ratio,
        "thresholds": getattr(ria08_service.model, "thresholds", {}),
    }


@app.get("/ria10/info")
def info_ria10():
    return {
        "trained": ria10_service._trained,
        "features": [
            RIA10_FEATURE_NAME_MAP.get(feature, feature)
            for feature in ria10_service.model.feature_columns
        ] if ria10_service._trained else [],
        "accuracy": round_metric(getattr(ria10_service.model, "accuracy", None)),
        "precision": round_metric(getattr(ria10_service.model, "precision", None)),
        "recall": round_metric(getattr(ria10_service.model, "recall", None)),
        "f1": round_metric(getattr(ria10_service.model, "f1", None)),
    }


@app.get("/ria11/info")
def info_ria11():
    return {
        "trained": ria11_service._trained,
        "features": [
            RIA11_FEATURE_NAME_MAP.get(feature, feature)
            for feature in ria11_service.model.feature_columns
        ] if ria11_service._trained else [],
        "accuracy": round_metric(getattr(ria11_service.model, "accuracy", None)),
        "precision": round_metric(getattr(ria11_service.model, "precision", None)),
        "recall": round_metric(getattr(ria11_service.model, "recall", None)),
    }


# =========================
#  HEALTH CHECK
# =========================

@app.get("/health")
def health():
    return {
        "status": "ok"
    }
