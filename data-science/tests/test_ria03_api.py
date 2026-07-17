from app.adapters.api.main import to_ria03_model_input
from app.adapters.api.schemas import RIA03Input


def test_ria03_legacy_body_remains_compatible() -> None:
    payload = RIA03Input(
        logical_level="medio",
        inactive_days=4,
        ai_interactions=7,
        attempts=4,
    )
    internal = to_ria03_model_input(payload)

    assert internal["nivel_logico"] == "medio"
    assert internal["dias_inactivo"] == 4
    assert internal["errores"] is None
    assert internal["rendimiento_previo"] is None


def test_ria03_optional_signals_are_mapped_to_internal_names() -> None:
    payload = RIA03Input(
        logical_level="alto",
        inactive_days=1,
        ai_interactions=3,
        attempts=2,
        errors=1,
        help_requested=1,
        historical_attempts_avg=2.5,
        historical_errors_avg=0.8,
        historical_help_avg=0.4,
        previous_performance="medio",
    )
    internal = to_ria03_model_input(payload)

    assert internal["errores"] == 1
    assert internal["ayuda_solicitada"] == 1
    assert internal["intentos_historicos_promedio"] == 2.5
    assert internal["errores_historicos_promedio"] == 0.8
    assert internal["ayuda_historica_promedio"] == 0.4
    assert internal["rendimiento_previo"] == "medio"
