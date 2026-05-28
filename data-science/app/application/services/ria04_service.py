import pandas as pd

from app.application.metrics import round_metric


class RIA04Service:
    MODEL_VERSION = "ria04-v1"

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
        result = self.model.predict_detailed(df)

        return {
            "difficulty_level": result["difficulty_level"],
            "reasons": result["reasons"],
            "accuracy": round_metric(getattr(self.model, "accuracy", None)),
            "precision": round_metric(getattr(self.model, "precision", None)),
        }
