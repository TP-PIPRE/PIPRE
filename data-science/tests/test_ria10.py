from __future__ import annotations

import pandas as pd
import pytest
from pydantic import ValidationError

from app.adapters.api.main import app, to_ria10_model_input
from app.adapters.api.schemas import (
    RIA10BatchResponse,
    RIA10Input,
    RIA10Response,
)
from app.adapters.ml_models.ria10_codigo import EvaluadorCodigo
from app.application.services.ria10_service import RIA10Service


def valid_payload(**overrides) -> dict:
    payload = {
        "student_id": "student-10",
        "student_name": "Estudiante 10",
        "errors": 3,
        "attempts": 6,
        "ai_interactions": 2,
        "help_requested": 1,
        "completed_activities": 8,
        "inactive_days": 2,
        "age": 12,
        "grade": 6,
        "logical_level": "medio",
        "detected_emotion": "neutral",
    }
    payload.update(overrides)
    return payload


class FakeRIA10Model:
    RESULT_LABELS = {
        0: "Código básico",
        1: "Código intermedio",
        2: "Código avanzado",
    }
    feature_columns = ["errores", "intentos"]
    accuracy = 0.81
    precision = 0.79
    metrics_note = "Métrica de consistencia técnica."
    model_version = RIA10Service.MODEL_VERSION
    is_fitted = True

    def train(self, _df) -> None:
        self.is_fitted = True

    def predict(self, _df) -> str:
        return "Código intermedio"

    def predict_batch(self, df) -> list[str]:
        return ["Código intermedio"] * len(df)


def test_schema_conversion_maps_external_names() -> None:
    payload = RIA10Input(**valid_payload(
        logical_level=" MEDIO ",
        detected_emotion=" Neutral ",
    ))

    internal = to_ria10_model_input(payload)

    assert internal == {
        "student_id": "student-10",
        "student_name": "Estudiante 10",
        "errores": 3,
        "intentos": 6,
        "interacciones_ia": 2.0,
        "ayuda_solicitada": 1,
        "actividades_completadas": 8,
        "dias_inactivo": 2,
        "edad": 12,
        "grado": 6,
        "nivel_logico": "medio",
        "emocion_detectada": "neutral",
    }


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("errors", -1),
        ("age", 4),
        ("grade", 0),
        ("logical_level", " "),
        ("detected_emotion", " "),
    ],
)
def test_schema_rejects_invalid_values(field: str, value) -> None:
    with pytest.raises(ValidationError):
        RIA10Input(**valid_payload(**{field: value}))


def test_service_returns_compact_explainable_response() -> None:
    service = RIA10Service(FakeRIA10Model())
    service.set_model(service.model)

    result = service.predict(to_ria10_model_input(
        RIA10Input(**valid_payload())
    ))

    validated = RIA10Response.model_validate(result)
    assert validated.result == "Código intermedio"
    assert validated.student_id == "student-10"
    assert validated.details.target_source == "heuristic_rule"
    assert validated.accuracy == 0.81
    assert validated.precision == 0.79


def test_service_batch_preserves_students_and_counts_results() -> None:
    service = RIA10Service(FakeRIA10Model())
    service.set_model(service.model)
    rows = [
        to_ria10_model_input(RIA10Input(**valid_payload())),
        to_ria10_model_input(RIA10Input(**valid_payload(
            student_id="student-11",
            student_name="Estudiante 11",
        ))),
    ]

    result = service.predict_batch(rows)

    validated = RIA10BatchResponse.model_validate(result)
    assert validated.summary.total_students == 2
    assert validated.summary.quality_counts["Código intermedio"] == 2
    assert [student.student_id for student in validated.students] == [
        "student-10",
        "student-11",
    ]


def test_service_rejects_untrained_or_invalid_batches() -> None:
    service = RIA10Service(FakeRIA10Model())

    with pytest.raises(RuntimeError, match="not trained"):
        service.predict_batch([valid_payload()])

    service.set_model(service.model)
    with pytest.raises(ValueError, match="al menos"):
        service.predict_batch([])
    with pytest.raises(ValueError, match="máximo"):
        service.predict_batch([valid_payload()] * 501)


def test_model_trains_and_predicts_all_rows() -> None:
    rows = []
    for index in range(90):
        rows.append({
            "errores": index % 9,
            "intentos": 3 + index % 10,
            "interacciones_ia": index % 6,
            "ayuda_solicitada": index % 4,
            "actividades_completadas": 2 + index % 15,
            "dias_inactivo": index % 8,
            "edad": 10 + index % 5,
            "grado": 4 + index % 3,
            "nivel_logico": ["bajo", "medio", "alto"][index % 3],
            "emocion_detectada": ["neutral", "frustrado", "motivado"][
                index % 3
            ],
        })
    model = EvaluadorCodigo()
    model.train(pd.DataFrame(rows))

    predictions = model.predict_batch(pd.DataFrame(rows[:3]))

    assert model.is_fitted
    assert len(predictions) == 3
    assert set(predictions).issubset(set(model.RESULT_LABELS.values()))


def test_canonical_routes_are_published() -> None:
    paths = app.openapi()["paths"]

    assert "/ria10/code" in paths
    assert "/ria10/code/batch" in paths
    assert "/ria10/info" in paths
    assert "/ria10/pedagogical" not in paths
