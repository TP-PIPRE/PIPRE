import pandas as pd
from app.domain.ports.ria01_usecase import RIA01UseCase


class RIA01Service(RIA01UseCase):
    RESULT_MESSAGES = {
        "bajo": "Desempeño bajo",
        "medio": "Desempeño medio",
        "alto": "Desempeño alto",
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
            raise RuntimeError("Modelo no entrenado")

        df = pd.DataFrame([data_dict])
        label = self.model.predict(df)

        return {
            "resultado": self.RESULT_MESSAGES.get(label, label),
            "label": label,
            "accuracy": getattr(self.model, "accuracy", None),
            "precision": getattr(self.model, "precision", None),
            "features_used": self.model.feature_columns
        }
