from app.adapters.ml_models.ria04_generador import GeneradorRetosProgramacion
from app.application.services.ria04_service import RIA04Service


def test_generates_loop_challenge_without_student_history() -> None:
    generator = GeneradorRetosProgramacion()

    result = generator.predict_detailed({
        "topic": "ciclos",
        "learning_objective": "Mover un robot usando una repeticion",
        "difficulty": "basica",
        "allowed_blocks": ["repeat", "move_forward"],
        "constraints": ["usar un solo ciclo"],
        "quantity": 1,
        "seed": 7,
    })

    assert result["status"] == "generated"
    assert result["technique"] == (
        "sistema_experto_y_generacion_procedural_controlada"
    )
    assert len(result["challenges"]) == 1
    assert result["challenges"][0]["validation"] == {
        "schema_valid": True,
        "block_compatibility": True,
        "missing_blocks": [],
        "deterministic_tests_available": True,
        "status": "ready_for_teacher_review",
    }
    assert result["operational_metrics"]["teacher_review_required"] is True


def test_reports_blocks_missing_from_teacher_restrictions() -> None:
    generator = GeneradorRetosProgramacion()

    result = generator.predict_detailed({
        "topic": "condicionales",
        "learning_objective": "Evitar obstaculos",
        "difficulty": "basic",
        "allowed_blocks": ["move_forward"],
        "quantity": 1,
    })

    challenge = result["challenges"][0]
    assert result["status"] == "needs_adjustment"
    assert challenge["validation"]["block_compatibility"] is False
    assert set(challenge["validation"]["missing_blocks"]) == {
        "if",
        "obstacle_ahead",
        "turn_right",
    }


def test_service_uses_generator_metrics_instead_of_classifier_metrics() -> None:
    service = RIA04Service(GeneradorRetosProgramacion())
    service.train(None)

    response = service.predict({
        "topic": "secuencias",
        "learning_objective": "Ordenar movimientos",
        "difficulty": "basic",
        "allowed_blocks": ["move_forward"],
        "quantity": 1,
    })

    assert response["result"] == "generated"
    assert response["accuracy"] is None
    assert response["precision"] is None
    assert response["details"]["operational_metrics"]["format_valid_rate"] == 1.0
