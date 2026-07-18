from __future__ import annotations

import pandas as pd

from app.adapters.ml_models.ria10_pedagogica import RecomendadorPedagogico
from app.application.services.ria10_service import RIA10Service


def build_model_with_grade_references() -> RecomendadorPedagogico:
    model = RecomendadorPedagogico()
    model.global_group_stats = {
        "errores": 4.0,
        "dias_inactivo": 2.0,
        "actividades_completadas": 10.0,
    }
    model.grade_group_stats = {
        3: {
            "errores": 3.0,
            "dias_inactivo": 1.0,
            "actividades_completadas": 12.0,
        }
    }
    return model


def test_grade_comparison_uses_same_grade_reference() -> None:
    model = build_model_with_grade_references()
    data = model.preprocess(pd.DataFrame([{
        "errores": 7,
        "intentos": 4,
        "dias_inactivo": 5,
        "actividades_completadas": 8,
        "ayuda_solicitada": 3,
        "interacciones_ia": 5,
        "grado": 3,
        "nivel_logico": "medio",
    }]))

    comparison = model._build_grade_comparison(data.iloc[0])

    assert comparison["grade"] == 3
    assert comparison["reference_scope"] == "same_grade_training_group"
    assert comparison["metrics"]["errors"] == {
        "student_value": 7.0,
        "grade_average": 3.0,
        "difference": 4.0,
        "status": "needs_attention",
    }
    assert comparison["metrics"]["inactive_days"]["status"] == "needs_attention"
    assert comparison["metrics"]["completed_activities"]["status"] == "needs_attention"


def test_teacher_suggestion_adds_actions_from_grade_gaps() -> None:
    model = build_model_with_grade_references()
    data = model.preprocess(pd.DataFrame([{
        "errores": 7,
        "intentos": 4,
        "dias_inactivo": 5,
        "actividades_completadas": 8,
        "ayuda_solicitada": 3,
        "interacciones_ia": 5,
        "grado": 3,
        "nivel_logico": "medio",
    }]))
    row = data.iloc[0]
    reasons = model._build_reasons(row, "individual_support")
    comparison = model._build_grade_comparison(row)

    suggestion = model._build_teacher_suggestion(
        "individual_support",
        reasons,
        comparison,
        row,
    )

    assert suggestion["priority"] == "high"
    assert suggestion["review_after_activities"] == 2
    assert suggestion["based_on_reasons"] == reasons
    assert any("errores recurrentes" in action for action in suggestion["actions"])
    assert any("reincorporacion" in action for action in suggestion["actions"])
    assert any("actividades pendientes" in action for action in suggestion["actions"])
    assert any("ayuda de IA" in action for action in suggestion["actions"])


class FakeRIA10Model:
    accuracy = 0.86
    precision = 0.84

    def train(self, _df) -> None:
        return None

    def predict_detailed(self, _df):
        return {
            "pedagogical_recommendation": "reinforce_group",
            "pedagogical_profile": "requiere refuerzo pedagogico",
            "pedagogical_risk": "medium",
            "confidence": 0.81,
            "grade_comparison": {
                "grade": 3,
                "reference_scope": "same_grade_training_group",
                "metrics": {},
            },
            "reasons": ["Cantidad de errores superior al promedio del grupo"],
            "teacher_suggestion": {
                "title": "Aplicar refuerzo pedagogico",
                "summary": "Reforzar el concepto antes del siguiente reto.",
                "priority": "medium",
                "actions": ["Asignar ejercicios de practica."],
                "review_after_activities": 3,
                "based_on_reasons": [
                    "Cantidad de errores superior al promedio del grupo"
                ],
            },
        }


def test_service_exposes_comparison_and_teacher_suggestion() -> None:
    service = RIA10Service(FakeRIA10Model())
    service.train(None)

    response = service.predict({
        "attempts": 4,
        "errors": 7,
        "ai_interactions": 5,
        "inactive_days": 5,
        "help_requested": 3,
        "completed_activities": 8,
        "grade": 3,
        "logical_level": "medio",
    })

    assert response["result"] == "reinforce_group"
    assert response["details"]["confidence"] == 0.81
    assert response["details"]["grade_comparison"]["grade"] == 3
    assert response["details"]["teacher_suggestion"]["priority"] == "medium"
