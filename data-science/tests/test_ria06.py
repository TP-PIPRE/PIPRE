from __future__ import annotations

import joblib
import numpy as np
import pandas as pd
import pytest
from pydantic import ValidationError

from app.adapters.api.main import app, to_ria06_model_input
from app.adapters.api.schemas import (
    RIA06BatchResponse,
    RIA06Input,
    RIA06Response,
)
from app.adapters.ml_models.ria06_patrones import (
    AnalizadorPatronesEstudiantiles,
)
from app.application.services.ria06_service import RIA06Service
from app.ui.evaluador import construir_input_ria6, predecir_lote_ria6


def behavior_cohort() -> pd.DataFrame:
    rng = np.random.default_rng(42)
    rows = []
    configurations = [
        (3.0, 12.0, 8.0),
        (11.0, 42.0, 1.0),
        (19.0, 20.0, 4.0),
    ]
    for group, (frequency, duration, inactive_days) in enumerate(configurations):
        for index in range(30):
            rows.append({
                "id_estudiante": f"G{group}-{index}",
                "actividades_completadas": max(
                    0,
                    frequency + rng.normal(0, 0.8),
                ),
                "tiempo_sesion_min": max(
                    1,
                    duration + rng.normal(0, 2),
                ),
                "dias_inactivo": float(np.clip(
                    inactive_days + rng.normal(0, 0.5),
                    0,
                    365,
                )),
            })
    return pd.DataFrame(rows)


@pytest.fixture
def trained_model() -> AnalizadorPatronesEstudiantiles:
    model = AnalizadorPatronesEstudiantiles()
    model.train(behavior_cohort())
    return model


def test_training_selects_clusters_and_reports_valid_metrics(
    trained_model: AnalizadorPatronesEstudiantiles,
) -> None:
    quality = trained_model.quality_summary()

    assert 2 <= quality["selected_clusters"] <= 5
    assert quality["silhouette"] > 0.5
    assert quality["davies_bouldin"] >= 0
    assert 0 <= quality["stability_ari"] <= 1
    assert quality["accuracy"] is None
    assert "no supervisado" in quality["metrics_note"]
    assert len(trained_model.segment_profiles) == quality["selected_clusters"]
    assert all(
        {
            "stability_ari",
            "balance_score",
            "complexity_penalty",
            "selection_score",
        }.issubset(candidate)
        for candidate in trained_model.candidate_report
    )


def test_code_usage_is_only_a_training_diagnostic() -> None:
    model = AnalizadorPatronesEstudiantiles(
        min_training_samples=6,
        min_segment_samples=2,
    )
    source = pd.DataFrame({
        "actividades_completadas": [1, 2, 3, 4, 5, 6],
        "tiempo_sesion_min": [10, 11, 20, 21, 30, 31],
        "dias_inactivo": [8, 7, 5, 4, 2, 1],
        "uso_codigo": [50, 0, 75, 25, 40, 60],
    })

    model.train(source)

    assert model.feature_columns == [
        "frecuencia_actividad",
        "duracion_promedio_min",
        "dias_inactivo",
    ]
    assert "uso_codigo" not in model.feature_columns
    assert model.training_code_usage_summary["available"] is True
    assert model.training_code_usage_summary["used_for_segmentation"] is False
    assert model.training_code_usage_summary["used_for_prediction"] is False
    assert model.training_code_usage_summary["valid_rows"] == 6


def test_code_usage_cannot_change_the_trained_segments() -> None:
    cohort = behavior_cohort()
    low_code = cohort.assign(uso_codigo=0)
    high_code = cohort.assign(uso_codigo=100)
    first = AnalizadorPatronesEstudiantiles()
    second = AnalizadorPatronesEstudiantiles()

    first.train(low_code)
    second.train(high_code)

    assert first.selected_clusters == second.selected_clusters
    assert first.candidate_report == second.candidate_report
    first_profiles = {
        key: {name: value for name, value in profile.items() if name != "segment_uid"}
        for key, profile in first.segment_profiles.items()
    }
    second_profiles = {
        key: {name: value for name, value in profile.items() if name != "segment_uid"}
        for key, profile in second.segment_profiles.items()
    }
    assert first_profiles == second_profiles
    assert first.training_code_usage_summary["mean_percentage"] == 0
    assert second.training_code_usage_summary["mean_percentage"] == 100


def test_prediction_is_explainable_and_does_not_claim_accuracy(
    trained_model: AnalizadorPatronesEstudiantiles,
) -> None:
    result = trained_model.predict_detailed({
        "student_id": "ALUM-TEST",
        "frecuencia_actividad": 2,
        "duracion_promedio_min": 10,
        "dias_inactivo": 8,
    })

    assert result["student_id"] == "ALUM-TEST"
    assert result["segment_id"] in trained_model.segment_profiles
    assert 0 <= result["assignment_typicality"] <= 1
    assert result["segment_name"] in result["teacher_summary"]
    assert result["assignment_interpretation"]["label"]
    assert "no es una probabilidad" in (
        result["assignment_interpretation"]["technical_note"]
    )
    assert result["reasons"]
    assert len(result["reasons"]) <= 3
    assert any(
        "frecuencia de actividades" in reason
        for reason in result["reasons"]
    )
    assert set(result["segment_comparison"]) == set(
        trained_model.feature_columns
    )
    assert all(
        comparison["message"]
        for comparison in result["segment_comparison"].values()
    )
    assert result["teacher_suggestion"]["actions"]
    assert result["details"]["accuracy_applicable"] is False
    assert "No es una calificación" in result["details"]["teacher_notice"]
    assert result["model_quality"]["quality_explanation"]


def test_very_distant_student_requires_individual_review(
    trained_model: AnalizadorPatronesEstudiantiles,
) -> None:
    result = trained_model.predict_detailed({
        "student_id": "OUTLIER",
        "frecuencia_actividad": 500,
        "duracion_promedio_min": 1_000,
        "dias_inactivo": 365,
    })

    assert result["requires_review"] is True
    assert result["assignment_interpretation"]["level"] == "review_required"
    assert result["teacher_suggestion"]["priority"] == "high"
    assert "Revisar el caso" in result["teacher_suggestion"]["title"]


def test_invalid_behavior_values_are_rejected(
    trained_model: AnalizadorPatronesEstudiantiles,
) -> None:
    with pytest.raises(ValueError, match="mayor o igual a 0"):
        trained_model.predict_detailed({
            "frecuencia_actividad": -1,
            "duracion_promedio_min": 10,
            "dias_inactivo": 5,
        })

    with pytest.raises(ValueError, match="entre 0 y 365"):
        trained_model.predict_detailed({
            "frecuencia_actividad": 1,
            "duracion_promedio_min": 10,
            "dias_inactivo": 366,
        })


def test_service_single_and_batch_contracts(
    trained_model: AnalizadorPatronesEstudiantiles,
) -> None:
    service = RIA06Service(trained_model)
    service.set_model(trained_model)
    rows = [
        {
            "student_id": "A",
            "frecuencia_actividad": 3,
            "duracion_promedio_min": 12,
            "dias_inactivo": 8,
        },
        {
            "student_id": "B",
            "frecuencia_actividad": 18,
            "duracion_promedio_min": 20,
            "dias_inactivo": 2,
        },
    ]

    single = service.predict(rows[0])
    batch = service.predict_batch(rows)

    RIA06Response.model_validate(single)
    RIA06BatchResponse.model_validate(batch)
    assert single["result"] == single["segment_id"]
    assert batch["summary"]["total_students"] == 2
    assert sum(batch["summary"]["segment_counts"].values()) == 2


def test_persisted_model_remains_predictable(
    trained_model: AnalizadorPatronesEstudiantiles,
    tmp_path,
) -> None:
    path = tmp_path / "ria06.pkl"
    joblib.dump(trained_model, path)
    loaded = joblib.load(path)
    service = RIA06Service(AnalizadorPatronesEstudiantiles())

    service.set_model(loaded)
    result = service.predict({
        "frecuencia_actividad": 10,
        "duracion_promedio_min": 40,
        "dias_inactivo": 1,
    })

    assert result["segment_id"] in loaded.segment_profiles


def test_api_schema_and_converter_use_public_field_names() -> None:
    payload = RIA06Input(
        student_id="A-1",
        activity_frequency=8,
        average_session_minutes=30,
        inactive_days=4,
    )

    internal = to_ria06_model_input(payload)

    assert internal == {
        "student_id": "A-1",
        "student_name": None,
        "frecuencia_actividad": 8,
        "duracion_promedio_min": 30,
        "dias_inactivo": 4,
    }


def test_api_schema_rejects_out_of_range_inactive_days() -> None:
    with pytest.raises(ValidationError):
        RIA06Input(
            activity_frequency=8,
            average_session_minutes=30,
            inactive_days=366,
        )


def test_api_exposes_single_batch_and_info_routes() -> None:
    paths = {route.path for route in app.routes}

    assert "/ria06/patterns" in paths
    assert "/ria06/patterns/batch" in paths
    assert "/ria06/info" in paths


def test_training_rejects_too_few_records() -> None:
    model = AnalizadorPatronesEstudiantiles()

    with pytest.raises(ValueError, match="al menos 20"):
        model.train(behavior_cohort().head(19))


def test_training_rejects_less_than_three_distinct_patterns() -> None:
    rows = pd.DataFrame({
        "frecuencia_actividad": [1] * 10 + [2] * 10,
        "duracion_promedio_min": [10] * 10 + [20] * 10,
        "dias_inactivo": [3] * 20,
    })
    model = AnalizadorPatronesEstudiantiles(min_segment_samples=2)

    with pytest.raises(ValueError, match="tres patrones"):
        model.train(rows)


@pytest.mark.parametrize("invalid", ["texto", np.nan, np.inf])
def test_training_rejects_non_numeric_nan_and_infinite_values(invalid) -> None:
    rows = behavior_cohort().rename(columns={
        "actividades_completadas": "frecuencia_actividad",
        "tiempo_sesion_min": "duracion_promedio_min",
    })
    rows["frecuencia_actividad"] = rows["frecuencia_actividad"].astype(object)
    rows.loc[0, "frecuencia_actividad"] = invalid

    with pytest.raises(ValueError, match="no numéricos o no finitos"):
        AnalizadorPatronesEstudiantiles().train(rows)


def test_constant_feature_is_excluded_without_creating_reasons() -> None:
    rows = behavior_cohort().assign(dias_inactivo=4)
    model = AnalizadorPatronesEstudiantiles()

    model.train(rows)
    result = model.predict_detailed({
        "frecuencia_actividad": 10,
        "duracion_promedio_min": 20,
        "dias_inactivo": 4,
    })

    assert model.excluded_feature_columns == ["dias_inactivo"]
    assert "dias_inactivo" not in result["segment_comparison"]
    assert all(
        "días de inactividad" not in reason
        for reason in result["reasons"]
    )


def test_nearly_constant_feature_is_excluded() -> None:
    rows = behavior_cohort().assign(dias_inactivo=4.0)
    rows.loc[0, "dias_inactivo"] = 4.1
    model = AnalizadorPatronesEstudiantiles()

    model.train(rows)

    assert "dias_inactivo" in model.excluded_feature_columns
    assert any(
        "casi constante" in warning
        for warning in model.training_warnings
    )


def test_training_warns_about_duplicate_patterns() -> None:
    rows = behavior_cohort()
    duplicate = rows.iloc[[0]].copy()
    duplicate["id_estudiante"] = "OTRO-ID"
    model = AnalizadorPatronesEstudiantiles()

    model.train(pd.concat([rows, duplicate], ignore_index=True))

    assert model.training_diagnostics["duplicate_pattern_rows"] >= 2
    assert any(
        "patrones completamente duplicados" in warning
        for warning in model.training_warnings
    )


def test_training_rejects_duplicate_student_with_conflicting_values() -> None:
    rows = behavior_cohort()
    conflicting = rows.iloc[[0]].copy()
    conflicting["actividades_completadas"] += 10

    with pytest.raises(ValueError, match="estudiantes repetidos"):
        AnalizadorPatronesEstudiantiles().train(
            pd.concat([rows, conflicting], ignore_index=True)
        )


def test_training_rejects_candidates_with_too_small_clusters() -> None:
    model = AnalizadorPatronesEstudiantiles(
        max_clusters=3,
        min_segment_samples=46,
    )

    with pytest.raises(ValueError, match="segmentos menores"):
        model.train(behavior_cohort())


def test_quality_levels_do_not_use_supervised_metrics() -> None:
    model = AnalizadorPatronesEstudiantiles()

    assert model._quality_status(0.60, 0.90) == "strong"
    assert model._quality_status(0.30, 0.70) == "moderate"
    assert model._quality_status(0.20, 0.90) == "weak_review_required"
    assert model.quality_summary()["accuracy"] is None


def test_weak_quality_forces_review_and_safe_suggestion(
    trained_model: AnalizadorPatronesEstudiantiles,
) -> None:
    trained_model.quality_status = "weak_review_required"

    result = trained_model.predict_detailed({
        "frecuencia_actividad": 3,
        "duracion_promedio_min": 12,
        "dias_inactivo": 8,
    })

    assert result["requires_review"] is True
    assert any("calidad global" in reason for reason in result["review_reasons"])
    assert "Patrón más cercano" in result["teacher_summary"]
    assert "reentrenar" in result["teacher_suggestion"]["title"]


def test_midpoint_between_closest_centroids_is_ambiguous(
    trained_model: AnalizadorPatronesEstudiantiles,
) -> None:
    centers = trained_model.model.cluster_centers_
    pairs = [
        (left, right, np.linalg.norm(centers[left] - centers[right]))
        for left in range(len(centers))
        for right in range(left + 1, len(centers))
    ]
    left, right, _ = min(pairs, key=lambda item: item[2])
    midpoint = (centers[left] + centers[right]) / 2
    raw = trained_model.scaler.inverse_transform([midpoint])[0]
    payload = dict(zip(trained_model.active_feature_columns, raw))

    result = trained_model.predict_detailed(payload)

    assert result["assignment_ambiguous"] is True
    assert result["assignment_margin"] < trained_model.assignment_margin_threshold
    assert result["requires_review"] is True
    assert any("dos patrones" in reason for reason in result["review_reasons"])


def test_prediction_before_training_is_rejected() -> None:
    model = AnalizadorPatronesEstudiantiles()

    with pytest.raises(RuntimeError, match="entrenarse"):
        model.predict_detailed({
            "frecuencia_actividad": 1,
            "duracion_promedio_min": 10,
            "dias_inactivo": 1,
        })


def test_individual_prediction_rejects_multiple_rows(
    trained_model: AnalizadorPatronesEstudiantiles,
) -> None:
    rows = behavior_cohort().head(2).rename(columns={
        "actividades_completadas": "frecuencia_actividad",
        "tiempo_sesion_min": "duracion_promedio_min",
    })

    with pytest.raises(ValueError, match="exactamente un estudiante"):
        trained_model.predict_detailed(rows)


def test_batch_rejects_empty_and_oversized_inputs(
    trained_model: AnalizadorPatronesEstudiantiles,
) -> None:
    with pytest.raises(ValueError, match="al menos un estudiante"):
        trained_model.predict_batch([])

    rows = [
        {
            "frecuencia_actividad": 3,
            "duracion_promedio_min": 12,
            "dias_inactivo": 8,
        }
    ] * (trained_model.max_batch_size + 1)
    with pytest.raises(ValueError, match="máximo"):
        trained_model.predict_batch(rows)


def test_vectorized_batch_matches_individual_predictions(
    trained_model: AnalizadorPatronesEstudiantiles,
) -> None:
    rows = [
        {
            "student_id": "A",
            "frecuencia_actividad": 3,
            "duracion_promedio_min": 12,
            "dias_inactivo": 8,
        },
        {
            "student_id": "B",
            "frecuencia_actividad": 18,
            "duracion_promedio_min": 20,
            "dias_inactivo": 2,
        },
        {
            "student_id": "C",
            "frecuencia_actividad": 11,
            "duracion_promedio_min": 42,
            "dias_inactivo": 1,
        },
    ]

    batch = trained_model.predict_batch(rows)
    individual = [
        trained_model.predict_detailed(row)
        for row in rows
    ]

    assert batch == individual


def test_failed_retraining_preserves_previous_model(
    trained_model: AnalizadorPatronesEstudiantiles,
) -> None:
    previous_run_id = trained_model.model_run_id
    previous_model = trained_model.model
    previous_result = trained_model.predict({
        "frecuencia_actividad": 3,
        "duracion_promedio_min": 12,
        "dias_inactivo": 8,
    })

    with pytest.raises(ValueError):
        trained_model.train(behavior_cohort().head(2))

    assert trained_model.model_run_id == previous_run_id
    assert trained_model.model is previous_model
    assert trained_model.predict({
        "frecuencia_actividad": 3,
        "duracion_promedio_min": 12,
        "dias_inactivo": 8,
    }) == previous_result


def test_safe_save_and_load_validate_trust_and_version(
    trained_model: AnalizadorPatronesEstudiantiles,
    tmp_path,
) -> None:
    path = tmp_path / "ria06-safe.pkl"
    trained_model.save(path)

    with pytest.raises(ValueError, match="no confiables"):
        AnalizadorPatronesEstudiantiles.load(path)
    with pytest.warns(UserWarning, match="puede ejecutar código"):
        loaded = AnalizadorPatronesEstudiantiles.load(path, trusted=True)
    assert loaded.model_run_id == trained_model.model_run_id

    loaded.model_version = "incompatible"
    joblib.dump(loaded, path)
    with pytest.warns(UserWarning):
        with pytest.raises(ValueError, match="Versión"):
            AnalizadorPatronesEstudiantiles.load(path, trusted=True)


def test_same_random_state_is_reproducible() -> None:
    first = AnalizadorPatronesEstudiantiles(random_state=77)
    second = AnalizadorPatronesEstudiantiles(random_state=77)

    first.train(behavior_cohort())
    second.train(behavior_cohort())

    assert first.candidate_report == second.candidate_report
    assert np.allclose(
        first.model.cluster_centers_,
        second.model.cluster_centers_,
    )
    assert first._cluster_to_segment == second._cluster_to_segment


def test_contradictory_alias_is_rejected() -> None:
    rows = behavior_cohort().rename(columns={
        "actividades_completadas": "frecuencia_actividad",
        "tiempo_sesion_min": "duracion_promedio_min",
    })
    rows["actividades_completadas"] = rows["frecuencia_actividad"]
    rows.loc[0, "actividades_completadas"] += 1

    with pytest.raises(ValueError, match="contradictorios"):
        AnalizadorPatronesEstudiantiles().train(rows)


def test_temporal_window_is_validated_and_recorded() -> None:
    rows = behavior_cohort().assign(
        fecha_inicio_ventana="2026-01-01",
        fecha_fin_ventana="2026-01-08",
        fecha_corte="2026-01-08",
    )
    model = AnalizadorPatronesEstudiantiles()

    model.train(rows)

    assert model.training_period["available"] is True
    assert model.training_period["period_days"] == 7


def test_temporal_leakage_or_incomplete_metadata_is_rejected() -> None:
    incomplete = behavior_cohort().assign(fecha_corte="2026-01-08")
    with pytest.raises(ValueError, match="juntas"):
        AnalizadorPatronesEstudiantiles().train(incomplete)

    future = behavior_cohort().assign(
        fecha_inicio_ventana="2026-01-01",
        fecha_fin_ventana="2026-01-10",
        fecha_corte="2026-01-08",
    )
    with pytest.raises(ValueError, match="incoherentes"):
        AnalizadorPatronesEstudiantiles().train(future)


def test_candidate_report_contains_unrounded_selection_and_balance_data(
    trained_model: AnalizadorPatronesEstudiantiles,
) -> None:
    required = {
        "cluster_sizes",
        "cluster_percentages",
        "minimum_cluster_size",
        "maximum_cluster_size",
        "balance_entropy",
        "balance_penalty",
        "selection_score_raw",
        "decision_reason",
        "accepted",
    }

    assert all(
        required.issubset(candidate)
        for candidate in trained_model.candidate_report
    )


def test_profile_names_and_segment_uids_are_unique(
    trained_model: AnalizadorPatronesEstudiantiles,
) -> None:
    names = [
        profile["name"]
        for profile in trained_model.segment_profiles.values()
    ]
    identifiers = [
        profile["segment_uid"]
        for profile in trained_model.segment_profiles.values()
    ]

    assert len(names) == len(set(names))
    assert len(identifiers) == len(set(identifiers))
    assert all(trained_model.model_run_id in value for value in identifiers)


def test_constructor_validates_statistical_configuration() -> None:
    with pytest.raises(ValueError, match="al menos 10"):
        AnalizadorPatronesEstudiantiles(stability_iterations=9)
    with pytest.raises(ValueError, match="0.70 y 0.90"):
        AnalizadorPatronesEstudiantiles(stability_sample_fraction=0.5)


def test_ui_adapter_builds_canonical_single_and_batch_inputs(
    trained_model: AnalizadorPatronesEstudiantiles,
) -> None:
    raw = behavior_cohort().head(3)

    adapted = construir_input_ria6(raw)
    results = trained_model.predict_batch(adapted)

    assert list(adapted.columns) == [
        "frecuencia_actividad",
        "duracion_promedio_min",
        "dias_inactivo",
        "student_id",
    ]
    assert len(results) == 3
    assert [result["student_id"] for result in results] == (
        raw["id_estudiante"].tolist()
    )


def test_ui_adapter_rejects_contradictory_canonical_values() -> None:
    raw = behavior_cohort().head(2).copy()
    raw["frecuencia_actividad"] = raw["actividades_completadas"]
    raw.loc[0, "frecuencia_actividad"] += 1

    with pytest.raises(ValueError, match="contradictorios"):
        construir_input_ria6(raw)


def test_ui_adapter_splits_cohorts_larger_than_model_batch_limit(
    trained_model: AnalizadorPatronesEstudiantiles,
) -> None:
    trained_model.max_batch_size = 2
    raw = behavior_cohort().head(5)

    results = predecir_lote_ria6(trained_model, raw)

    assert len(results) == 5
    assert [result["student_id"] for result in results] == (
        raw["id_estudiante"].tolist()
    )
