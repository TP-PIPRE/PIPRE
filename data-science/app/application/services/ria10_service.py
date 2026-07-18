import pandas as pd

from app.application.metrics import round_metric


class RIA10Service:
    MODEL_VERSION = "ria10-v2-grade-comparison"

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
            "result": result["pedagogical_recommendation"],
            "accuracy": round_metric(getattr(self.model, "accuracy", None)),
            "precision": round_metric(getattr(self.model, "precision", None)),
            "details": {
                "pedagogical_profile": result["pedagogical_profile"],
                "pedagogical_risk": result["pedagogical_risk"],
                "confidence": result["confidence"],
                "grade_comparison": result["grade_comparison"],
                "reasons": result["reasons"],
                "teacher_suggestion": result["teacher_suggestion"],
            },
        }
