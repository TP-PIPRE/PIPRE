from __future__ import annotations

import sys
from copy import deepcopy
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.adapters.ml_models.ria03_recomendador import RecomendadorActividades
from app.application.services.ria03_service import RIA03Service
from app.infrastructure.settings import DATASET_PATH


def print_section(title: str) -> None:
    print("\n" + "=" * 72)
    print(title)
    print("=" * 72)


def main() -> None:
    dataset = pd.read_excel(DATASET_PATH)
    model = RecomendadorActividades(
        split_strategy="auto",
        random_state=42,
    )

    print_section("1. Entrenamiento con rendimiento observado")
    result = model.train(dataset)
    print("Métricas:", result["metrics"])
    print("Arquitectura:", result["selected_architecture"])
    print("Comparación:", result["architecture_comparison"])
    print("Búsqueda:", result["hyperparameter_search"])
    print("Calibración:", result["calibration"])
    print("Umbrales:", result["thresholds"])
    print("Split:", result["split"])
    print("Early stopping:", result["early_stopping"])

    print_section("2. Predicción individual")
    input_data = {
        "logical_level": "medio",
        "inactive_days": 4,
        "ai_interactions": 7,
        "attempts": 4,
        "errors": 2,
        "help_requested": 1,
    }
    internal_data = {
        "nivel_logico": input_data["logical_level"],
        "dias_inactivo": input_data["inactive_days"],
        "interacciones_ia": input_data["ai_interactions"],
        "intentos": input_data["attempts"],
        "errores": input_data["errors"],
        "ayuda_solicitada": input_data["help_requested"],
    }
    print("Entrada backend:", input_data)
    print("Recomendación:", model.predict(internal_data))

    print_section("3. Predicción por lotes")
    print(model.predict(dataset.head(5)))

    print_section("4. Evaluación sin modificar el modelo")
    medians_before = deepcopy(model.numeric_medians)
    thresholds_before = (model.stage1_threshold, model.stage2_threshold)
    evaluation_data = dataset.iloc[model.split_indices["test"]]
    evaluation = model.evaluar(evaluation_data)
    print("Evaluación:", evaluation)
    print("Medianas sin cambios:", medians_before == model.numeric_medians)
    print(
        "Umbrales sin cambios:",
        thresholds_before == (model.stage1_threshold, model.stage2_threshold),
    )

    print_section("5. Contrato del servicio FastAPI")
    service = RIA03Service(model)
    service.set_model(model)
    print("Respuesta:", service.predict(internal_data))

    print_section("6. Target obligatorio")
    try:
        RecomendadorActividades().train(dataset.drop(columns=["rendimiento"]))
    except ValueError as exc:
        print("Error controlado:", exc)


if __name__ == "__main__":
    main()
