from __future__ import annotations

from typing import Any

import pandas as pd


class RIA07Service:
    MODEL_VERSION = "ria07-v5-reliable"

    def __init__(self, model) -> None:
        self.model = model
        self._trained = False

    def set_model(self, model) -> None:
        if not getattr(model, "is_fitted", False):
            raise ValueError("El modelo RIA07 persistido no está entrenado.")
        if getattr(model, "model_version", None) != self.MODEL_VERSION:
            raise ValueError("El modelo RIA07 persistido tiene una versión incompatible.")
        expected_schema = self.model.FEATURE_SCHEMA_VERSION
        if getattr(model, "feature_schema_version", None) != expected_schema:
            raise ValueError(
                "El modelo RIA07 persistido tiene un esquema incompatible."
            )
        self.model = model
        self._trained = True

    def train(self, data: pd.DataFrame) -> None:
        self.model.train(data)
        self.model.model_version = self.MODEL_VERSION
        self._trained = True

    def predict(self, data: dict[str, Any]) -> dict[str, Any]:
        self._ensure_trained()
        details = self.model.predict_detailed(data)
        return {
            "result": details["segment_id"],
            **details,
        }

    def predict_batch(
        self,
        data: list[dict[str, Any]],
    ) -> dict[str, Any]:
        self._ensure_trained()
        students = self.model.predict_batch(data)
        counts: dict[str, int] = {
            segment_id: 0
            for segment_id in self.model.segment_profiles
        }
        for student in students:
            counts[student["segment_id"]] += 1

        return {
            "summary": {
                "total_students": len(students),
                "segment_counts": counts,
                "segments": list(self.model.segment_profiles.values()),
                "model_quality": self.model.quality_summary(),
            },
            "students": students,
        }

    def _ensure_trained(self) -> None:
        if not self._trained:
            raise RuntimeError("Model is not trained")
