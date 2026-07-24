from __future__ import annotations

import joblib
import numpy as np
import pandas as pd
import pytest
from pydantic import ValidationError

from app.adapters.api.main import to_ria07_model_input
from app.adapters.api.schemas import RIA07Input
from app.adapters.ml_models.ria07_riesgo_anomalias import DetectorRiesgoAnomalias
from app.application.services.ria07_service import RIA07Service


def reference_dataset(size: int = 80) -> pd.DataFrame:
    """Cohorte de referencia; no se reutiliza como métrica de calidad."""

    return pd.DataFrame([
        {
            "id_estudiante": f"student-{index}",
            "intentos": 2 + index % 6,
            "errores": index % 7,
            "puntaje": 52 + index % 45,
            "dias_inactivo": index % 9,
            "actividades_completadas": 2 + index % 10,
            "tasa_exito": (50 + index % 48) / 100,
            "ayuda_solicitada": index % 5,
        }
        for index in range(size)
    ])


def healthy_snapshot(student_id: str = "healthy-1") -> dict:
    return {
        "id_estudiante": student_id,
        "intentos": 3,
        "errores": 0,
        "puntaje": 90,
        "dias_inactivo": 0,
        "actividades_completadas": 10,
        "tasa_exito": 0.90,
        "ayuda_solicitada": 0,
    }


def adverse_snapshot(student_id: str = "critical-1") -> dict:
    return {
        "id_estudiante": student_id,
        "intentos": 15,
        "errores": 14,
        "puntaje": 20,
        "dias_inactivo": 20,
        "actividades_completadas": 1,
        "tasa_exito": 0.15,
        "ayuda_solicitada": 10,
    }


@pytest.fixture(scope="module")
def trained_model() -> DetectorRiesgoAnomalias:
    model = DetectorRiesgoAnomalias()
    model.train(reference_dataset())
    return model


def test_healthy_student_has_no_absurd_reasons(trained_model) -> None:
    result = trained_model.predict_detailed(healthy_snapshot())

    assert result["risk_level"] == "low"
    assert result["risk_score"] < trained_model.risk_thresholds["medium"]
    assert result["reason_codes"] == []
    assert result["reasons"] == []
    assert "high_inactivity" not in result["reason_codes"]
    assert "high_error_ratio" not in result["reason_codes"]
    assert "high_help_dependency" not in result["reason_codes"]


def test_constant_healthy_group_does_not_create_percentile_risk() -> None:
    healthy = healthy_snapshot()
    cohort = pd.DataFrame([
        {**healthy, "id_estudiante": f"same-{index}"}
        for index in range(20)
    ])
    model = DetectorRiesgoAnomalias()
    model.train(cohort)

    result = model.predict_detailed(healthy)

    assert result["risk_level"] == "low"
    assert result["risk_score"] == 0
    assert result["reason_codes"] == []
    assert result["anomaly_score"] == 0
    assert set(model.constant_reference_features) == set(model.risk_feature_config)
    assert model._percentile_from_values(np.zeros(20), 0) == 0


def test_adverse_student_has_more_risk_than_healthy(trained_model) -> None:
    healthy = trained_model.predict_detailed(healthy_snapshot())
    adverse = trained_model.predict_detailed(adverse_snapshot())

    assert adverse["risk_score"] > healthy["risk_score"]
    assert adverse["risk_level"] == "high"
    assert adverse["reason_codes"]
    assert len(adverse["reason_codes"]) <= trained_model.MAX_REASONS
    assert len(adverse["reason_codes"]) == len(set(adverse["reason_codes"]))
    assert len(adverse["reason_codes"]) == len(adverse["reasons"])


def test_positive_anomaly_does_not_raise_educational_risk(trained_model) -> None:
    exceptional = {
        "intentos": 1,
        "errores": 0,
        "puntaje": 100,
        "dias_inactivo": 0,
        "actividades_completadas": 20,
        "tasa_exito": 1.0,
        "ayuda_solicitada": 0,
    }

    result = trained_model.predict_detailed(exceptional)

    assert result["anomaly"] is True
    assert result["risk_level"] == "low"
    assert result["anomaly_boost"] == 0
    assert result["reason_codes"] == []


def test_negative_anomaly_can_moderately_increase_risk(trained_model) -> None:
    result = trained_model.predict_detailed(adverse_snapshot())

    assert result["anomaly"] is True
    assert result["behavioral_score"] >= trained_model.min_adverse_score_for_boost
    assert result["anomaly_boost"] > 0
    assert result["risk_score"] > result["behavioral_score"]
    assert result["risk_score"] <= 100


@pytest.mark.parametrize(
    ("mutation", "message"),
    [
        ({"intentos": "tres"}, "no numericos"),
        ({"errores": np.inf}, "no finitos"),
        ({"dias_inactivo": -1}, "valores negativos"),
        ({"actividades_completadas": 2.7}, "debe contener enteros"),
        ({"puntaje": 120}, "debe estar entre 0 y 100"),
        ({"tasa_exito": 80}, "debe estar en escala 0-1"),
        ({"intentos": 0, "errores": 1}, "intentos=0 y errores>0"),
    ],
)
def test_invalid_values_are_rejected(trained_model, mutation, message) -> None:
    payload = {**healthy_snapshot(), **mutation}

    with pytest.raises(ValueError, match=message):
        trained_model.predict_detailed(payload)


def test_missing_required_column_is_rejected(trained_model) -> None:
    payload = healthy_snapshot()
    payload.pop("intentos")

    with pytest.raises(ValueError, match="Faltan columnas obligatorias.*intentos"):
        trained_model.predict_detailed(payload)


def test_error_reports_invalid_dataframe_rows(trained_model) -> None:
    rows = pd.DataFrame(
        [healthy_snapshot("a"), healthy_snapshot("b"), healthy_snapshot("c")],
        index=[2, 7, 9],
    )
    rows["intentos"] = rows["intentos"].astype(object)
    rows.loc[[2, 7], "intentos"] = "texto"

    with pytest.raises(ValueError, match=r"filas: \[2, 7\]"):
        trained_model.predict_batch(rows)


def test_missing_success_rate_is_derived_explicitly(trained_model) -> None:
    payload = healthy_snapshot()
    payload.pop("tasa_exito")

    result = trained_model.predict_detailed(payload)

    assert result["evidence"]["success_rate"] == 0.9
    assert result["evidence"]["success_rate_derived"] is True


def test_empty_and_insufficient_training_sets_are_rejected() -> None:
    model = DetectorRiesgoAnomalias()

    with pytest.raises(ValueError, match="conjunto vacio"):
        model.train(pd.DataFrame())
    with pytest.raises(ValueError, match="al menos 20 registros"):
        model.train(reference_dataset(19))


def test_prediction_before_training_is_rejected() -> None:
    model = DetectorRiesgoAnomalias()

    with pytest.raises(RuntimeError, match="entrenarse antes de predecir"):
        model.predict_detailed(healthy_snapshot())


def test_predict_detailed_rejects_zero_or_multiple_rows(trained_model) -> None:
    empty = pd.DataFrame(columns=trained_model.input_feature_columns)
    multiple = pd.DataFrame([healthy_snapshot(), adverse_snapshot()])

    with pytest.raises(ValueError, match="exactamente un estudiante"):
        trained_model.predict_detailed(empty)
    with pytest.raises(ValueError, match="Use predict_batch"):
        trained_model.predict_detailed(multiple)


def test_batch_preserves_source_order_by_default(trained_model) -> None:
    rows = pd.DataFrame(
        [healthy_snapshot(), adverse_snapshot()],
        index=[10, 20],
    )

    results = trained_model.predict_batch(rows)

    assert [row["student_id"] for row in results] == ["healthy-1", "critical-1"]
    assert [row["source_index"] for row in results] == [10, 20]


def test_batch_can_sort_explicitly_for_teacher_table(trained_model) -> None:
    rows = trained_model.predict_batch(
        [healthy_snapshot(), adverse_snapshot()],
        sort_by_risk=True,
    )

    assert rows[0]["student_id"] == "critical-1"
    assert rows[0]["risk_score"] >= rows[1]["risk_score"]


def test_results_are_reproducible_with_fixed_random_state() -> None:
    first = DetectorRiesgoAnomalias(random_state=42)
    second = DetectorRiesgoAnomalias(random_state=42)
    cohort = reference_dataset()
    first.train(cohort)
    second.train(cohort)

    assert first.predict_detailed(adverse_snapshot()) == second.predict_detailed(
        adverse_snapshot()
    )


def test_basic_adverse_progression_is_monotonic(trained_model) -> None:
    progression = [
        healthy_snapshot(),
        {
            "intentos": 5,
            "errores": 2,
            "puntaje": 70,
            "dias_inactivo": 4,
            "actividades_completadas": 6,
            "tasa_exito": 0.70,
            "ayuda_solicitada": 1,
        },
        {
            "intentos": 10,
            "errores": 8,
            "puntaje": 45,
            "dias_inactivo": 10,
            "actividades_completadas": 2,
            "tasa_exito": 0.40,
            "ayuda_solicitada": 5,
        },
        adverse_snapshot(),
    ]

    scores = [
        trained_model.predict_detailed(snapshot)["risk_score"]
        for snapshot in progression
    ]

    assert scores == sorted(scores)


def test_training_and_prediction_use_same_features(trained_model) -> None:
    prepared = trained_model.preprocess(pd.DataFrame([healthy_snapshot()]))
    selected = trained_model._select_model_features(prepared)

    assert list(selected.columns) == trained_model.model_feature_columns
    assert list(trained_model.scaler.feature_names_in_) == (
        trained_model.model_feature_columns
    )
    assert list(trained_model.model.feature_names_in_) == (
        trained_model.model_feature_columns
    )
    assert not selected.columns.duplicated().any()


def test_failed_retraining_does_not_corrupt_fitted_state(trained_model) -> None:
    before = trained_model.predict_detailed(healthy_snapshot())

    with pytest.raises(ValueError):
        trained_model.train(pd.DataFrame())

    after = trained_model.predict_detailed(healthy_snapshot())
    assert trained_model.is_fitted is True
    assert before == after


def test_persistence_keeps_complete_fitted_state(trained_model, tmp_path) -> None:
    path = tmp_path / "ria07.joblib"
    joblib.dump(trained_model, path)
    loaded = joblib.load(path)

    assert loaded.is_fitted is True
    assert loaded.model_feature_columns == trained_model.model_feature_columns
    assert loaded.risk_feature_config == trained_model.risk_feature_config
    assert loaded.thresholds == trained_model.thresholds
    assert loaded.predict_detailed(adverse_snapshot()) == (
        trained_model.predict_detailed(adverse_snapshot())
    )


def test_weights_are_identified_as_manual_not_model_importance(trained_model) -> None:
    report = trained_model.obtener_pesos_riesgo()

    assert report["type"] == "configured_heuristic_weights"
    assert "no son importancias aprendidas" in report["description"]
    assert sum(report["weights"].values()) == pytest.approx(1.0)
    with pytest.warns(DeprecationWarning):
        assert trained_model.calcular_importancia() == report["weights"]


@pytest.mark.parametrize("contamination", [0, -0.1, 0.51, 1])
def test_invalid_contamination_is_rejected(contamination) -> None:
    with pytest.raises(ValueError, match="contamination"):
        DetectorRiesgoAnomalias(contamination=contamination)


def test_service_keeps_flat_contract_and_sorts_teacher_batch(trained_model) -> None:
    service = RIA07Service(trained_model)
    service._trained = True

    result = service.predict(adverse_snapshot())
    batch = service.predict_batch([healthy_snapshot(), adverse_snapshot()])

    assert result["risk_level"] == "high"
    assert result["details"]["student_history_used"] is False
    assert result["details"]["reference_cohort_used"] is True
    assert "metrica de calidad" in result["details"]["anomaly_ratio_note"]
    assert batch["students"][0]["student_id"] == "critical-1"
    assert batch["summary"]["total_students"] == 2


def test_api_mapper_keeps_snapshot_fields_and_identity() -> None:
    payload = RIA07Input(
        student_id="42",
        student_name="Ada",
        attempts=4,
        errors=3,
        score=70,
        inactive_days=5,
        completed_activities=6,
        success_rate=0.7,
        help_requested=2,
    )

    assert to_ria07_model_input(payload) == {
        "student_id": "42",
        "student_name": "Ada",
        "intentos": 4,
        "errores": 3,
        "puntaje": 70,
        "dias_inactivo": 5,
        "actividades_completadas": 6,
        "tasa_exito": 0.7,
        "ayuda_solicitada": 2,
    }


def test_api_requires_completed_activities_and_help_requested() -> None:
    with pytest.raises(ValidationError):
        RIA07Input(
            attempts=4,
            errors=1,
            score=80,
            inactive_days=1,
        )
