import pandas as pd
from models.ria01_desempeño import ClasificadorDesempeno

class RIA01Service:

    def __init__(self):
        self.model = ClasificadorDesempeno()
        self._trained = False

    def train(self, df):
        self.model.train(df)
        self._trained = True

    def predict(self, data_dict):
        if not self._trained:
            raise Exception("Modelo no entrenado")

        df = pd.DataFrame([data_dict])
        resultado = self.model.predict(df)

        return {
            "resultado": resultado,
            "accuracy": getattr(self.model, "accuracy", None),
            "precision": getattr(self.model, "precision", None),
            "features_used": self.model.feature_columns
        }