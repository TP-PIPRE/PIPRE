import pandas as pd
import pytest
from pydantic import ValidationError

from app.adapters.api.schemas import RIA02Input, RIA02Response
from app.adapters.ml_models.ria02_feedback import RetroalimentacionAutomatica
from app.application.services.ria02_service import RIA02Service


def calibration_frame() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "errores": [0, 0, 1, 1, 2, 2],
            "intentos": [0, 1, 1, 2, 2, 3],
            "nivel_logico": ["medio"] * 6,
        }
    )


def test_clean_input_does_not_gain_risk_with_zero_quantiles() -> None:
    model = RetroalimentacionAutomatica()
    model.train(
        pd.DataFrame(
            {
                "errores": [0, 0, 0],
                "intentos": [0, 0, 0],
                "nivel_logico": ["medio"] * 3,
            }
        )
    )

    result = model.predict_detailed(
        {
            "code": "print('ok')",
            "errors": [],
            "attempts": 0,
            "previous_errors": [],
            "logical_level": "medio",
            "activity_objective": "Mostrar un mensaje",
        }
    )

    assert model.error_threshold >= model.MIN_ERROR_THRESHOLD
    assert model.attempt_threshold >= model.MIN_ATTEMPT_THRESHOLD
    assert result["result"] == "on_track"
    assert result["risk_score"] == 0
    assert result["needs_feedback"] is False


def test_textual_false_target_is_not_converted_to_true() -> None:
    model = RetroalimentacionAutomatica()
    prepared = model._prepare_training_frame(
        pd.DataFrame(
            {
                "errores": [1, 5, 2, 7],
                "intentos": [1, 5, 2, 7],
                "requires_feedback": ["false", "true", "no", "si"],
            }
        )
    )

    target = model._build_independent_target(prepared)

    assert target.tolist() == [False, True, False, True]


def test_small_labeled_dataset_calibrates_without_unreliable_metrics() -> None:
    model = RetroalimentacionAutomatica()
    frame = calibration_frame()
    frame["requires_feedback"] = [False, False, False, True, True, True]

    model.train(frame)

    assert model.is_calibrated is True
    assert model.accuracy is None
    assert "suficientes" in model.metrics_note


def test_recurrent_errors_are_normalized_and_explained() -> None:
    model = RetroalimentacionAutomatica()
    model.train(calibration_frame())

    result = model.predict_detailed(
        {
            "code": "print(valor)",
            "errors": ["NameError: valor no definido"],
            "attempts": 2,
            "previous_errors": ["  nameerror: VALOR no definido  "],
            "logical_level": "bajo",
            "activity_objective": "Usar variables",
        }
    )

    assert result["recurrent_errors"] == ["nameerror: VALOR no definido"]
    assert result["feedback_type"] == "variables"
    assert any("errores repetidos" in reason for reason in result["reasons"])
    assert result["evidence"]["final_score_used_for_decision"] is False


def test_service_returns_explainable_contract_and_all_metrics() -> None:
    service = RIA02Service(RetroalimentacionAutomatica())
    service.train(calibration_frame())

    response = service.predict(
        {
            "code": "for i in range(3):\n    print(i)",
            "language": "python",
            "errors": [],
            "attempts": 1,
            "score": 95,
            "success_rate": 0.95,
            "previous_errors": [],
            "logical_level": "medio",
            "activity_objective": "Usar un ciclo",
        }
    )

    validated = RIA02Response.model_validate(response)
    assert validated.details.risk_score >= 0
    assert validated.details.risk_cutoff >= 2
    assert validated.details.evidence.final_score_used_for_decision is False
    assert {"accuracy", "precision", "recall", "f1"}.issubset(response)


def test_api_input_normalizes_aliases_and_percentage_rate() -> None:
    payload = RIA02Input(
        code="print('ok')",
        language=" Python ",
        errors=["  SyntaxError  ", ""],
        attempts=1,
        success_rate=75,
        logical_level="Intermediate",
    )

    assert payload.language == "python"
    assert payload.logical_level == "medio"
    assert payload.success_rate == 0.75
    assert payload.errors == ["SyntaxError"]


def test_api_input_rejects_negative_attempts() -> None:
    with pytest.raises(ValidationError):
        RIA02Input(
            code="",
            errors=[],
            attempts=-1,
            logical_level="medio",
        )


def test_rule_selection_prioritizes_f1_and_recall() -> None:
    model = RetroalimentacionAutomatica()
    report = [
        {"precision": 0.95, "recall": 0.60, "f1": 0.70, "accuracy": 0.80},
        {"precision": 0.80, "recall": 0.90, "f1": 0.85, "accuracy": 0.82},
    ]

    assert model._select_best_report_item(report) == report[1]
