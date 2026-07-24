from __future__ import annotations

from typing import Any

import pandas as pd


class RIA05Service:
    MODEL_VERSION = "ria05-errors-v2"

    def __init__(self, model) -> None:
        self.model = model
        self._trained = False

    def set_model(self, model) -> None:
        if not getattr(model, "is_fitted", False):
            raise ValueError("El modelo RIA05 persistido no está entrenado.")
        if getattr(model, "model_version", None) != self.MODEL_VERSION:
            raise ValueError(
                "El modelo RIA05 persistido tiene una versión incompatible."
            )
        self.model = model
        self._trained = True

    def train(self, data: pd.DataFrame | None = None) -> None:
        training_data = (
            data
            if data is not None
            and self.model.TARGET_COLUMN in data.columns
            else None
        )
        self.model.train(training_data)
        self.model.model_version = self.MODEL_VERSION
        self._trained = True

    def predict(self, data: dict[str, Any]) -> dict[str, Any]:
        self._ensure_trained()
        return self.model.predict_detailed(data)

    def predict_batch(
        self,
        data: list[dict[str, Any]],
    ) -> dict[str, Any]:
        self._ensure_trained()
        rows = self.model.predict_batch(data)
        counts = {
            error_type: sum(
                row["error_type"] == error_type for row in rows
            )
            for error_type in self.model.ERROR_LABELS
        }
        return {
            "summary": {
                "total_executions": len(rows),
                "error_counts": counts,
                "requires_review": sum(
                    bool(row["requires_review"]) for row in rows
                ),
            },
            "executions": rows,
        }

    def _ensure_trained(self) -> None:
        if not self._trained:
            raise RuntimeError("Model is not trained")
