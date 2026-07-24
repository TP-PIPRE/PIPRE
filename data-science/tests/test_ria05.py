from __future__ import annotations

import pandas as pd
import pytest

from app.adapters.api.main import app, to_ria05_model_input
from app.adapters.api.schemas import RIA05Input, RIA05Response
from app.adapters.ml_models.ria05_errores import ClasificadorErroresLogicos
from app.application.services.ria05_service import RIA05Service


@pytest.fixture(scope="module")
def trained_model() -> ClasificadorErroresLogicos:
    model = ClasificadorErroresLogicos(n_estimators=120)
    model.train()
    return model


def invalid_route_execution() -> dict:
    return {
        "resultado_esperado": {
            "position": {"x": 5, "y": 5},
            "sensors": {"front": False},
        },
        "resultado_obtenido": {
            "position": {"x": 1, "y": 1},
            "sensors": {"front": False},
            "completion_ratio": 0.70,
            "executed_steps": 3,
        },
        "posicion_robot": {"x": 1, "y": 1},
        "estados_sensores": {
            "esperado": {"front": False},
            "obtenido": {"front": False},
        },
        "instrucciones_utilizadas": ["move", "turn", "move"],
        "colisiones": 3,
        "paso_interrupcion": 3,
    }


def incomplete_execution() -> dict:
    return {
        "resultado_esperado": {"position": {"x": 4, "y": 4}},
        "resultado_obtenido": {
            "position": {"x": 3, "y": 3},
            "completion_ratio": 0.25,
            "executed_steps": 2,
        },
        "posicion_robot": {"x": 3, "y": 3},
        "estados_sensores": {},
        "instrucciones_utilizadas": [
            "move",
            "move",
            "turn",
            "move",
            "turn",
            "move",
        ],
        "colisiones": 0,
        "paso_interrupcion": 2,
    }


def test_synthetic_training_covers_all_documented_error_types(
    trained_model: ClasificadorErroresLogicos,
) -> None:
    assert trained_model.is_fitted
    assert trained_model.training_source == "synthetic_prototypes"
    assert set(trained_model.model.classes_) == set(
        trained_model.ERROR_LABELS
    )
    assert trained_model.validation_accuracy is not None
    assert "datos reales etiquetados" in trained_model.metrics_note


def test_invalid_route_is_classified_with_explanation(
    trained_model: ClasificadorErroresLogicos,
) -> None:
    result = trained_model.predict_detailed(invalid_route_execution())

    assert result["error_type"] == "invalid_route"
    assert result["error_label"] == "Ruta inválida"
    assert result["confidence"] > 0.8
    assert any("colisiones" in reason.lower() for reason in result["reasons"])
    assert sum(result["probabilities"].values()) == pytest.approx(1, abs=0.01)


def test_incomplete_objective_is_classified(
    trained_model: ClasificadorErroresLogicos,
) -> None:
    result = trained_model.predict_detailed(incomplete_execution())

    assert result["error_type"] == "incomplete_objective"
    assert result["error_label"] == "Objetivo incompleto"


def test_batch_matches_individual_predictions(
    trained_model: ClasificadorErroresLogicos,
) -> None:
    rows = [invalid_route_execution(), incomplete_execution()]

    batch = trained_model.predict_batch(rows)
    individual = [
        trained_model.predict_detailed(row)
        for row in rows
    ]

    assert [item["error_type"] for item in batch] == [
        item["error_type"] for item in individual
    ]
    assert [item["confidence"] for item in batch] == [
        item["confidence"] for item in individual
    ]


def test_prediction_requires_training_and_complete_results() -> None:
    model = ClasificadorErroresLogicos()

    with pytest.raises(RuntimeError, match="entrenarse"):
        model.predict(invalid_route_execution())
    model.train()
    incomplete = invalid_route_execution()
    incomplete.pop("resultado_esperado")
    with pytest.raises(ValueError, match="resultado_esperado"):
        model.predict(incomplete)


def test_labeled_training_validates_target() -> None:
    model = ClasificadorErroresLogicos()
    rows = pd.DataFrame([{
        **invalid_route_execution(),
        "error_type": "unknown_error",
    }] * 30)

    with pytest.raises(ValueError, match="desconocidos"):
        model.train(rows)


def test_batch_limits_are_enforced(
    trained_model: ClasificadorErroresLogicos,
) -> None:
    with pytest.raises(ValueError, match="al menos"):
        trained_model.predict_batch([])
    with pytest.raises(ValueError, match="máximo"):
        trained_model.predict_batch(
            [incomplete_execution()] * (trained_model.MAX_BATCH_SIZE + 1)
        )


def test_service_uses_synthetic_prototypes_when_dataset_has_no_labels() -> None:
    service = RIA05Service(ClasificadorErroresLogicos(n_estimators=60))
    service.train(pd.DataFrame({"errores": [1, 2, 3]}))

    result = service.predict(invalid_route_execution())

    assert service._trained
    assert service.model.training_source == "synthetic_prototypes"
    RIA05Response.model_validate(result)


def test_api_schema_conversion_and_canonical_routes() -> None:
    payload = RIA05Input(
        expected_result={"position": {"x": 5, "y": 5}},
        obtained_result={
            "position": {"x": 1, "y": 1},
            "completion_ratio": 0.7,
        },
        robot_position={"x": 1, "y": 1},
        sensor_states={},
        instructions_used=["move", "turn"],
        collisions=2,
        interruption_step=2,
        completion_ratio=0.7,
    )

    internal = to_ria05_model_input(payload)
    paths = {route.path for route in app.routes}

    assert internal["expected_result"]["position"] == {"x": 5, "y": 5}
    assert internal["collisions"] == 2
    assert "/ria05/errors" in paths
    assert "/ria05/errors/batch" in paths
    assert "/ria05/info" in paths
