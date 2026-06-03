import pandas as pd

from app.application.metrics import round_metric


class RIA03Service:
    MODEL_VERSION = "ria03-v3"

    RESULT_LABELS = {
        "bas": "basic",
        "intermed": "intermediate",
        "avanz": "advanced",
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
        recommendation = self.model.predict(df)

        return {
            "result": self._normalize_recommendation(recommendation),
            "accuracy": round_metric(getattr(self.model, "accuracy", None)),
            "precision": round_metric(getattr(self.model, "precision", None)),
        }

    def _normalize_recommendation(self, recommendation):
        text = str(recommendation).lower()

        if "intermed" in text:
            return self.RESULT_LABELS["intermed"]

        if "avanz" in text:
            return self.RESULT_LABELS["avanz"]

        if "recomendar actividades" in text:
            return self.RESULT_LABELS["bas"]

        return recommendation
