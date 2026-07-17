from __future__ import annotations

import inspect
import sys
from copy import deepcopy
from pathlib import Path

import numpy as np
import pandas as pd
import pytest
from sklearn.metrics import f1_score

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.adapters.ml_models.ria03_recomendador import RecomendadorActividades


@pytest.fixture(scope="module")
def project_dataset() -> pd.DataFrame:
    return pd.read_excel(ROOT / "data" / "dataset.xlsx")


@pytest.fixture(scope="module")
def trained_model(project_dataset: pd.DataFrame) -> RecomendadorActividades:
    model = RecomendadorActividades(random_state=42)
    model.train(project_dataset)
    return model


def minimal_frame(rows: int = 30) -> pd.DataFrame:
    labels = np.resize(np.asarray(["bajo", "medio", "alto"]), rows)
    return pd.DataFrame({
        "id_estudiante": [f"student-{index}" for index in range(rows)],
        "nivel_logico": np.resize(np.asarray(["medio", "alto", "bajo"]), rows),
        "dias_inactivo": np.arange(rows) % 8,
        "interacciones_ia": (np.arange(rows) * 2) % 9,
        "intentos": (np.arange(rows) * 3) % 7,
        "rendimiento": labels,
    })


def test_missing_required_column_raises() -> None:
    data = minimal_frame().drop(columns=["intentos"])
    with pytest.raises(ValueError, match="Faltan columnas obligatorias.*intentos"):
        RecomendadorActividades().train(data)


def test_missing_real_target_raises() -> None:
    data = minimal_frame().drop(columns=["rendimiento"])
    with pytest.raises(ValueError, match="columna real 'rendimiento'"):
        RecomendadorActividades().train(data)


def test_invalid_target_class_raises() -> None:
    data = minimal_frame()
    data.loc[0, "rendimiento"] = "excelente"
    with pytest.raises(ValueError, match="Valores inválidos.*excelente"):
        RecomendadorActividades().train(data)


def test_unknown_logical_level_raises_by_default() -> None:
    data = minimal_frame(6)
    data.loc[0, "nivel_logico"] = "principiante"
    with pytest.raises(ValueError, match="categorías desconocidas.*principiante"):
        RecomendadorActividades().preprocess_data(data, is_training=True)


def test_unknown_logical_level_can_use_explicit_unknown_code() -> None:
    data = minimal_frame(6)
    data.loc[0, "nivel_logico"] = "principiante"
    model = RecomendadorActividades(unknown_category_strategy="unknown")
    transformed = model.preprocess_data(data, is_training=True)
    assert transformed.loc[0, "nivel_logico"] == -1


def test_negative_numeric_values_raise() -> None:
    data = minimal_frame()
    data.loc[0, "dias_inactivo"] = -1
    with pytest.raises(ValueError, match="no pueden ser negativas.*dias_inactivo"):
        RecomendadorActividades().train(data)


def test_stage_two_requires_medium_and_high() -> None:
    data = minimal_frame()
    data["rendimiento"] = np.resize(np.asarray(["bajo", "medio"]), len(data))
    with pytest.raises(ValueError, match="faltan clases.*alto"):
        RecomendadorActividades().train(data)


def test_evaluate_does_not_modify_models_or_preprocessor(
    trained_model: RecomendadorActividades,
    project_dataset: pd.DataFrame,
) -> None:
    medians_before = deepcopy(trained_model.numeric_medians)
    thresholds_before = (
        trained_model.stage1_threshold,
        trained_model.stage2_threshold,
    )
    stage1_before = bytes(trained_model.model_stage1.get_booster().save_raw())
    stage2_before = bytes(trained_model.model_stage2.get_booster().save_raw())
    stored_accuracy = trained_model.accuracy

    metrics = trained_model.evaluar(project_dataset.head(90))

    assert trained_model.numeric_medians == medians_before
    assert thresholds_before == (
        trained_model.stage1_threshold,
        trained_model.stage2_threshold,
    )
    assert bytes(trained_model.model_stage1.get_booster().save_raw()) == stage1_before
    assert bytes(trained_model.model_stage2.get_booster().save_raw()) == stage2_before
    assert trained_model.accuracy == stored_accuracy
    assert "f1_macro" in metrics


def test_group_partitions_do_not_share_students(
    trained_model: RecomendadorActividades,
) -> None:
    overlap = trained_model.split_report["group_overlap"]
    assert overlap == {
        "train_validation": 0,
        "train_test": 0,
        "validation_test": 0,
    }


def test_temporal_split_respects_chronological_order() -> None:
    data = minimal_frame(90)
    data["fecha_sesion"] = pd.date_range("2026-01-01", periods=len(data), freq="h")
    model = RecomendadorActividades(
        split_strategy="temporal",
        time_column="fecha_sesion",
        early_stopping_rounds=5,
    )
    result = model.train(data)
    ranges = result["split"]["time_ranges"]

    assert pd.Timestamp(ranges["train"]["max"]) <= pd.Timestamp(
        ranges["validation"]["min"]
    )
    assert pd.Timestamp(ranges["validation"]["max"]) <= pd.Timestamp(
        ranges["test"]["min"]
    )


def test_predict_single_row_returns_string(
    trained_model: RecomendadorActividades,
    project_dataset: pd.DataFrame,
) -> None:
    result = trained_model.predict(project_dataset.head(1))
    assert isinstance(result, str)
    assert result in trained_model.RECOMMENDATIONS.values()


def test_predict_batch_preserves_order(
    trained_model: RecomendadorActividades,
    project_dataset: pd.DataFrame,
) -> None:
    batch = project_dataset.head(8)
    results = trained_model.predict(batch)
    individual = [trained_model.predict(batch.iloc[[index]]) for index in range(8)]
    assert isinstance(results, list)
    assert results == individual


def test_predict_before_training_raises() -> None:
    with pytest.raises(RuntimeError, match="debe entrenarse antes"):
        RecomendadorActividades().predict(minimal_frame(1))


def test_predict_labels_preserves_length_and_order(
    trained_model: RecomendadorActividades,
    project_dataset: pd.DataFrame,
) -> None:
    X = trained_model.preprocess_data(project_dataset.head(12))
    labels = trained_model._predict_labels(X)
    repeated = np.asarray([
        trained_model._predict_labels(X.iloc[[index]])[0]
        for index in range(len(X))
    ])
    assert len(labels) == len(X)
    assert labels.tolist() == repeated.tolist()


def test_metrics_include_all_three_classes(
    trained_model: RecomendadorActividades,
) -> None:
    metrics = trained_model.training_result["metrics"]
    expected_metrics = {
        "accuracy",
        "balanced_accuracy",
        "precision_macro",
        "recall_macro",
        "f1_macro",
        "precision_weighted",
        "recall_weighted",
        "f1_weighted",
        "confusion_matrix",
        "classification_report",
    }
    assert expected_metrics.issubset(metrics)
    assert list(metrics["classification_report"])[0:3] == ["bajo", "medio", "alto"]
    assert np.asarray(metrics["confusion_matrix"]).shape == (3, 3)


def test_preprocessor_is_fitted_only_with_train_rows(
    trained_model: RecomendadorActividades,
    project_dataset: pd.DataFrame,
) -> None:
    train = set(trained_model.split_indices["train"])
    validation = set(trained_model.split_indices["validation"])
    test = set(trained_model.split_indices["test"])
    assert set(trained_model.preprocessor_fit_indices) == train
    assert train.isdisjoint(validation)
    assert train.isdisjoint(test)
    for column in trained_model.NUMERIC_COLUMNS:
        expected = pd.to_numeric(
            project_dataset.iloc[list(train)][column], errors="coerce"
        ).median()
        assert trained_model.numeric_medians[column] == pytest.approx(expected)


def test_preprocessing_never_generates_target_or_score() -> None:
    model = RecomendadorActividades()
    transformed = model.preprocess_data(minimal_frame(9), is_training=True)
    source = inspect.getsource(RecomendadorActividades)
    assert "rendimiento" not in transformed.columns
    assert "score_final" not in transformed.columns
    assert "score_final" not in source


def test_performance_is_historical_target_not_prediction_feature(
    trained_model: RecomendadorActividades,
) -> None:
    report = trained_model.target_consistency_report
    assert report["source"] == "historical_student_outcome"
    assert report["role"] == "supervised_training_label_only"
    assert report["available_at_prediction_time"] is False
    assert report["included_in_features"] is False
    assert "rendimiento" not in trained_model.feature_columns


def test_thresholds_are_selected_with_complete_validation_flow(
    trained_model: RecomendadorActividades,
    project_dataset: pd.DataFrame,
) -> None:
    validation_idx = trained_model.split_indices["validation"]
    validation = project_dataset.iloc[validation_idx]
    X = trained_model.preprocess_data(validation)
    y = validation["rendimiento"].astype(str).str.strip().str.lower()
    probability_low = trained_model._stage1_probability_low(X)
    probability_medium = trained_model._stage2_probability_medium(X)

    scores = []
    for threshold1 in trained_model.threshold_grid:
        for threshold2 in trained_model.threshold_grid:
            predictions = trained_model._labels_from_probabilities(
                probability_low,
                probability_medium,
                float(threshold1),
                float(threshold2),
            )
            scores.append(
                f1_score(
                    y,
                    predictions,
                    labels=list(trained_model.TARGET_CLASSES),
                    average="macro",
                    zero_division=0,
                )
            )
    selected = trained_model.threshold_selection_report
    assert selected["used_full_validation_flow"] is True
    assert selected["best"]["f1_macro"] == pytest.approx(max(scores))


def test_test_partition_is_not_used_to_select_thresholds(
    trained_model: RecomendadorActividades,
) -> None:
    report = trained_model.threshold_selection_report
    source = inspect.getsource(RecomendadorActividades._optimize_thresholds)
    assert report["test_used"] is False
    assert "X_test" not in source
    assert "y_test" not in source


def test_model_search_compares_both_architectures_with_grouped_cv(
    trained_model: RecomendadorActividades,
) -> None:
    report = trained_model.training_result["hyperparameter_search"]
    assert report["cv_strategy"] == "StratifiedGroupKFold"
    assert report["evaluated_models"] == report["search_iterations"] * 2
    assert set(report["best"]) == {"hierarchical", "multiclass"}
    assert report["group_overlap_checked"] is True
    assert report["group_overlap"] == 0
    assert report["test_used"] is False
    assert report["validation_used"] is False
    feature_sets = report["feature_sets"]
    assert {row["feature_set"] for row in feature_sets["candidates"]} == {
        "core",
        "extended",
    }
    assert feature_sets["test_used"] is False
    assert feature_sets["selection_source"] == "training_grouped_cv"


def test_architecture_is_selected_only_from_validation(
    trained_model: RecomendadorActividades,
) -> None:
    report = trained_model.architecture_comparison
    expected = max(
        report["models"],
        key=lambda name: (
            report["models"][name]["f1_macro"],
            report["models"][name]["balanced_accuracy"],
            report["models"][name]["accuracy"],
        ),
    )
    assert report["selected"] == expected
    assert trained_model.selected_architecture == expected
    assert report["test_used"] is False


def test_calibration_uses_only_training_oof_predictions(
    trained_model: RecomendadorActividades,
) -> None:
    report = trained_model.calibration_report
    assert report["enabled"] is True
    assert report["source"] == "training_oof_predictions"
    assert report["hierarchical_rows"] == len(
        trained_model.split_indices["train"]
    )
    assert report["test_used"] is False
    assert report["validation_used"] is False


def test_optional_signals_are_used_without_breaking_legacy_input() -> None:
    model = RecomendadorActividades()
    data = minimal_frame(9)
    data["errores"] = np.arange(len(data)) % 4
    data["ayuda_solicitada"] = np.arange(len(data)) % 3
    data["rendimiento_previo"] = np.resize(
        np.asarray(["bajo", "medio", "alto"]), len(data)
    )
    transformed = model.preprocess_data(data, is_training=True)
    assert "errores_por_intento" in transformed
    assert "ayuda_por_intento" in transformed
    assert "rendimiento_previo_score" in transformed

    legacy = minimal_frame(1).drop(columns=["rendimiento"])
    legacy_transformed = model.preprocess_data(legacy, is_training=False)
    assert legacy_transformed.shape == (1, len(model.feature_columns))
    assert legacy_transformed.loc[0, "errores_faltante"] == 1.0


def test_suspicious_previous_performance_is_disabled() -> None:
    data = minimal_frame(30)
    data["rendimiento_previo"] = data["rendimiento"]
    model = RecomendadorActividades()
    target = model._validate_target(data)
    with pytest.warns(UserWarning, match="posible fuga"):
        report = model._review_target_consistency(data, target)
    assert report["previous_performance_disabled"] is True
    assert "rendimiento_previo" in model.disabled_optional_features
