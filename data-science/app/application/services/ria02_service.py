import pandas as pd

from app.application.metrics import round_metric


class RIA02Service:
    MODEL_VERSION = "ria02-v4"

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
            "result": result["result"],
            "accuracy": round_metric(getattr(self.model, "accuracy", None)),
            "precision": round_metric(getattr(self.model, "precision", None)),
            "recall": round_metric(getattr(self.model, "recall", None)),
            "f1": round_metric(getattr(self.model, "f1", None)),
            "details": {
                "needs_feedback": result["needs_feedback"],
                "feedback_type": result["feedback_type"],
                "priority": result["priority"],
                "risk_score": result["risk_score"],
                "risk_cutoff": result["risk_cutoff"],
                "reasons": result["reasons"],
                "recurrent_errors": result["recurrent_errors"],
                "code_complexity": result["code_complexity"],
                "suggestions": result["suggestions"],
                "evidence": result["evidence"],
                "input_warnings": result["input_warnings"],
                "llm_context": result["llm_context"],
            },
        }
