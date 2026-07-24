import json

from fastapi.responses import JSONResponse

from app.adapters.api.main import ML_SERVICES, readiness


def test_readiness_reports_pending_models(monkeypatch) -> None:
    for service in ML_SERVICES.values():
        monkeypatch.setattr(service, "_trained", True)
    monkeypatch.setattr(ML_SERVICES["ria03"], "_trained", False)

    response = readiness()

    assert isinstance(response, JSONResponse)
    assert response.status_code == 503
    assert json.loads(response.body) == {
        "status": "not_ready",
        "pending_models": ["ria03"],
    }


def test_readiness_reports_all_models_ready(monkeypatch) -> None:
    for service in ML_SERVICES.values():
        monkeypatch.setattr(service, "_trained", True)

    response = readiness()

    assert response == {
        "status": "ready",
        "models": list(ML_SERVICES),
    }
