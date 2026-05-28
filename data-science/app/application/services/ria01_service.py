import pandas as pd
from app.application.metrics import round_metric
from app.domain.ports.ria01_usecase import RIA01UseCase


class RIA01Service(RIA01UseCase):
    RESULT_LABELS = {
        "bajo": "low",
        "medio": "medium",
        "alto": "high",
    }

    def __init__(self, model):
        self.model = model
        self._trained = False

    def set_model(self, model):
        self.model = model
        self._trained = True

    def train(self, df):
        self.model.train(df)
        self._trained = True

    def predict(self, data_dict):
        if not self._trained:
            raise RuntimeError("Model is not trained")

        df = pd.DataFrame([data_dict])
        label = self.model.predict(df)

        return {
            "result": self.RESULT_LABELS.get(label, label),
            "accuracy": round_metric(getattr(self.model, "accuracy", None)),
            "precision": round_metric(getattr(self.model, "precision", None))
        }
