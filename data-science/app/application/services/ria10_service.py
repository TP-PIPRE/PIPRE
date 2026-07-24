import pandas as pd

from app.application.metrics import round_metric


class RIA10Service:
    MODEL_VERSION = "ria10-code-v2"

    def __init__(self, model):
        self.model = model
        self._trained = False

    def set_model(self, model):
        if not getattr(model, "is_fitted", False):
            raise ValueError("El modelo RIA10 persistido no está entrenado.")
        if getattr(model, "model_version", None) != self.MODEL_VERSION:
            raise ValueError(
                "El modelo RIA10 persistido tiene una versión incompatible."
            )
        self.model = model
        self._trained = True

    def train(self, df):
        self.model.train(df)
        self.model.model_version = self.MODEL_VERSION
        self._trained = True

    def predict(self, data_dict):
        if not self._trained:
            raise RuntimeError("Model is not trained")

        data = (
            data_dict
            if isinstance(data_dict, pd.DataFrame)
            else pd.DataFrame([data_dict])
        )
        return {
            "result": self.model.predict(data),
            "student_id": data_dict.get("student_id"),
            "student_name": data_dict.get("student_name"),
            "accuracy": round_metric(getattr(self.model, "accuracy", None)),
            "precision": round_metric(getattr(self.model, "precision", None)),
            "details": {
                "model_version": self.MODEL_VERSION,
                "target_source": "heuristic_rule",
                "metrics_note": self.model.metrics_note,
            },
        }

    def predict_batch(self, rows):
        if not self._trained:
            raise RuntimeError("Model is not trained")
        if not rows:
            raise ValueError("RIA10 requiere al menos un registro.")
        if len(rows) > 500:
            raise ValueError("RIA10 admite como máximo 500 registros.")

        frame = pd.DataFrame(rows)
        predictions = self.model.predict_batch(frame)
        results = [
            {
                "result": prediction,
                "student_id": row.get("student_id"),
                "student_name": row.get("student_name"),
            }
            for row, prediction in zip(rows, predictions)
        ]
        counts = {
            label: sum(item["result"] == label for item in results)
            for label in self.model.RESULT_LABELS.values()
        }
        return {
            "summary": {
                "total_students": len(results),
                "quality_counts": counts,
                "accuracy": round_metric(
                    getattr(self.model, "accuracy", None)
                ),
                "precision": round_metric(
                    getattr(self.model, "precision", None)
                ),
                "metrics_note": self.model.metrics_note,
            },
            "students": results,
        }
