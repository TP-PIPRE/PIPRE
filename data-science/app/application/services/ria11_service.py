import pandas as pd

from app.application.metrics import round_metric


class RIA11Service:
    MODEL_VERSION = "ria11-v2"

    RESULT_LABELS = {
        "corto": "short",
        "medio": "medium",
        "largo": "long",
    }

    def __init__(self, model):
        self.model = model
        self._trained = False

    def set_model(self, model):
        self.model = model
        self._trained = True

    def train(self, df):
        self.model.train(df)
        self.model.model_version = self.MODEL_VERSION
        self._trained = True

    def predict(self, data_dict):
        if not self._trained:
            raise RuntimeError("Model is not trained")

        df = pd.DataFrame([data_dict])
        label = self.model.predict(df)

        return {
            "result": self._normalize_result(label),
            "accuracy": round_metric(getattr(self.model, "accuracy", None)),
            "precision": round_metric(getattr(self.model, "precision", None)),
            "details": {
                "recall": round_metric(getattr(self.model, "recall", None)),
            },
        }

    def _normalize_result(self, label):
        text = str(label).lower()

        for key, value in self.RESULT_LABELS.items():
            if key in text:
                return value

        return label
