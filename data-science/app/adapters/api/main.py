from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.adapters.api.schemas import (
    RIA01Input,
    RIA02Input,
    RIA03Input,
    RIA04Input,
    RIA08Input,
    RIA10Input,
    RIA10Response,
    RIA11Input,
)
from app.application.metrics import round_metric
from app.infrastructure.container import (
    create_dataset_repository,
    create_ria01_model_repository,
    create_ria01_service,
    create_ria02_model_repository,
    create_ria02_service,
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
ria02_model_repository = create_ria02_model_repository()
ria03_model_repository = create_ria03_model_repository()
ria04_model_repository = create_ria04_model_repository()
ria08_model_repository = create_ria08_model_repository()
ria10_model_repository = create_ria10_model_repository()
ria11_model_repository = create_ria11_model_repository()
ria01_service = create_ria01_service()
ria02_service = create_ria02_service()
ria03_service = create_ria03_service()
ria04_service = create_ria04_service()
ria08_service = create_ria08_service()
ria10_service = create_ria10_service()
ria11_service = create_ria11_service()

ML_SERVICES = {
    "ria01": ria01_service,
    "ria02": ria02_service,
    "ria03": ria03_service,
    "ria04": ria04_service,
    "ria08": ria08_service,
    "ria10": ria10_service,
    "ria11": ria11_service,
}

RIA01_FEATURE_NAME_MAP = {
    "intentos": "attempts",
    "errores": "errors",
    "nivel_logico": "logical_level",
    "interacciones_ia": "ai_interactions",
    "ratio_error": "error_ratio",
    "dependencia_ia": "ai_dependency",
    "ia_por_error": "ai_per_error",
    "tuvo_errores": "had_errors",
    "uso_ia": "used_ai",
    "nivel_x_error": "logical_level_x_error",
    "errores_faltante": "errors_missing",
    "intentos_faltante": "attempts_missing",
    "interacciones_ia_faltante": "ai_interactions_missing",
    "nivel_logico_faltante": "logical_level_missing",
}

RIA02_FEATURE_NAME_MAP = {
    "code": "code",
    "language": "language",
    "errors": "errors",
    "attempts": "attempts",
    "previous_errors": "previous_errors",
    "logical_level": "logical_level",
    "activity_objective": "activity_objective",
}

RIA03_FEATURE_NAME_MAP = {
    "nivel_logico": "logical_level",
    "dias_inactivo": "inactive_days",
    "interacciones_ia": "ai_interactions",
    "intentos": "attempts",
    "errores": "errors",
    "ayuda_solicitada": "help_requested",
    "intentos_historicos_promedio": "historical_attempts_avg",
    "errores_historicos_promedio": "historical_errors_avg",
    "ayuda_historica_promedio": "historical_help_avg",
    "rendimiento_previo_score": "previous_performance_score",
    "ratio_ia": "ai_ratio",
    "inactividad_relativa": "relative_inactivity",
    "engagement": "engagement",
    "consistencia": "consistency",
    "intensidad_total": "total_intensity",
    "eficiencia": "efficiency",
    "errores_por_intento": "errors_per_attempt",
    "ayuda_por_intento": "help_per_attempt",
    "errores_faltante": "errors_missing",
    "ayuda_solicitada_faltante": "help_requested_missing",
    "intentos_historicos_promedio_faltante": "historical_attempts_avg_missing",
    "errores_historicos_promedio_faltante": "historical_errors_avg_missing",
    "ayuda_historica_promedio_faltante": "historical_help_avg_missing",
    "rendimiento_previo_faltante": "previous_performance_missing",
}

RIA04_FEATURE_NAME_MAP = {
    "topic": "topic",
    "learning_objective": "learning_objective",
    "difficulty": "difficulty",
    "allowed_blocks": "allowed_blocks",
    "constraints": "constraints",
    "quantity": "quantity",
    "seed": "seed",
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


def to_ria02_model_input(data: RIA02Input):
    return {
        "code": data.code,
        "language": data.language,
        "errors": data.errors,
        "attempts": data.attempts,
        "score": data.score,
        "success_rate": data.success_rate,
        "previous_errors": data.previous_errors,
        "logical_level": data.logical_level,
        "activity_objective": data.activity_objective,
    }


def to_ria03_model_input(data: RIA03Input):
    return {
        "nivel_logico": data.logical_level,
        "dias_inactivo": data.inactive_days,
        "interacciones_ia": data.ai_interactions,
        "intentos": data.attempts,
        "errores": data.errors,
        "ayuda_solicitada": data.help_requested,
        "intentos_historicos_promedio": data.historical_attempts_avg,
        "errores_historicos_promedio": data.historical_errors_avg,
        "ayuda_historica_promedio": data.historical_help_avg,
        "rendimiento_previo": data.previous_performance,
    }


def to_ria04_model_input(data: RIA04Input):
    return {
        "topic": data.topic,
        "learning_objective": data.learning_objective,
        "difficulty": data.difficulty,
        "allowed_blocks": data.allowed_blocks,
        "constraints": data.constraints,
        "quantity": data.quantity,
        "seed": data.seed,
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


def train_and_save_ria02(reason: str):
    print(reason)

    df = dataset_repository.load()

    ria02_service.train(df)
    ria02_model_repository.save(ria02_service.model)

    print("RIA02 model trained and saved")


def train_and_save_ria03(reason: str):
    print(reason)

    df = dataset_repository.load()

    ria03_service.train(df)
    ria03_model_repository.save(ria03_service.model)

    print("RIA03 model trained and saved")


def train_and_save_ria04(reason: str):
    print(reason)

    ria04_service.train(None)
    ria04_model_repository.save(ria04_service.model)

    print("RIA04 generator initialized and saved")


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
            expected_schema = getattr(ria01_service.model, "input_feature_schema", None)
            loaded_schema = getattr(loaded_model, "input_feature_schema", None)
            expected_version = ria01_service.MODEL_VERSION
            loaded_version = getattr(loaded_model, "model_version", None)

            if loaded_schema != expected_schema or loaded_version != expected_version:
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


def load_or_train_ria02():
    if ria02_model_repository.exists():
        print("Loading existing RIA02 model...")

        try:
            loaded_model = ria02_model_repository.load()
            expected_features = ria02_service.model.feature_columns
            loaded_features = getattr(loaded_model, "feature_columns", None)
            expected_version = ria02_service.MODEL_VERSION
            loaded_version = getattr(loaded_model, "model_version", None)

            if loaded_features != expected_features or loaded_version != expected_version:
                train_and_save_ria02("Existing RIA02 model is incompatible. Retraining model...")
            else:
                ria02_service.set_model(loaded_model)
                print("RIA02 model loaded successfully")

        except Exception as exc:
            train_and_save_ria02(
                f"Could not load existing RIA02 model ({type(exc).__name__}: {exc}). Retraining model..."
            )

    else:
        train_and_save_ria02("Training RIA02 model from scratch...")


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
    load_or_train_ria02()
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_referrer_policy_header(request, call_next):
    response = await call_next(request)
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# =========================
# ENDPOINT PREDICT
# =========================

@app.post("/ria01/predict")
def predict_ria01(data: RIA01Input):
    return ria01_service.predict(to_ria01_model_input(data))


@app.post("/ria02/feedback")
def feedback_ria02(data: RIA02Input):
    return ria02_service.predict(to_ria02_model_input(data))


@app.post("/ria03/recommend")
def recommend_ria03(data: RIA03Input):
    return ria03_service.predict(to_ria03_model_input(data))


@app.post("/ria04/generate")
def generate_ria04(data: RIA04Input):
    return ria04_service.predict(to_ria04_model_input(data))


@app.post("/ria08/anomaly")
def detect_ria08(data: RIA08Input):
    return ria08_service.predict(to_ria08_model_input(data))


@app.post("/ria10/pedagogical", response_model=RIA10Response)
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


@app.get("/ria02/info")
def info_ria02():
    return {
        "trained": ria02_service._trained,
        "features": [
            RIA02_FEATURE_NAME_MAP.get(feature, feature)
            for feature in ria02_service.model.feature_columns
        ] if ria02_service._trained else [],
        "accuracy": round_metric(getattr(ria02_service.model, "accuracy", None)),
        "precision": round_metric(getattr(ria02_service.model, "precision", None)),
        "recall": round_metric(getattr(ria02_service.model, "recall", None)),
        "f1": round_metric(getattr(ria02_service.model, "f1", None)),
        "confusion_matrix": getattr(ria02_service.model, "confusion_matrix", []),
        "metrics_note": getattr(ria02_service.model, "metrics_note", None),
        "baseline_metrics": getattr(ria02_service.model, "baseline_metrics", {}),
        "best_config": getattr(ria02_service.model, "best_config", {}),
        "rule_search_report": getattr(ria02_service.model, "rule_search_report", []),
        "thresholds": {
            "error_threshold": round_metric(getattr(ria02_service.model, "error_threshold", None)),
            "attempt_threshold": round_metric(getattr(ria02_service.model, "attempt_threshold", None)),
            "recurrent_error_min_count": getattr(ria02_service.model, "recurrent_error_min_count", None),
        },
    }


@app.get("/ria03/info")
def info_ria03():
    return {
        "trained": ria03_service._trained,
        "features": [
            RIA03_FEATURE_NAME_MAP.get(feature, feature)
            for feature in getattr(
                ria03_service.model,
                "selected_feature_columns",
                ria03_service.model.feature_columns,
            )
        ] if ria03_service._trained else [],
        "accuracy": round_metric(getattr(ria03_service.model, "accuracy", None)),
        "precision": round_metric(getattr(ria03_service.model, "precision", None))
    }


@app.get("/ria04/info")
def info_ria04():
    return {
        "trained": ria04_service._trained,
        "technique": ria04_service.model.TECHNIQUE,
        "features": [
            RIA04_FEATURE_NAME_MAP.get(feature, feature)
            for feature in ria04_service.model.feature_columns
        ] if ria04_service._trained else [],
        "supported_topics": list(ria04_service.model.SUPPORTED_TOPICS),
        "supported_difficulties": list(
            ria04_service.model.SUPPORTED_DIFFICULTIES
        ),
        "metrics_note": (
            "RIA04 is a generator; evaluate format validity, block "
            "compatibility, executable test cases and teacher approval."
        ),
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
        "comparison_scope": "same_grade_training_group",
        "recommendation_classes": [
            "individual_support",
            "reinforce_group",
            "maintain_strategy",
            "increase_challenge",
        ],
        "grade_references": {
            str(grade): {
                metric: round_metric(value)
                for metric, value in metrics.items()
            }
            for grade, metrics in ria10_service.model.grade_group_stats.items()
        } if ria10_service._trained else {},
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


@app.get("/ready")
def readiness():
    pending_models = [
        name for name, service in ML_SERVICES.items()
        if not service._trained
    ]

    if pending_models:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "not_ready",
                "pending_models": pending_models,
            },
        )

    return {
        "status": "ready",
        "models": list(ML_SERVICES),
    }
