import pandas as pd

from app.application.metrics import round_metric


class RIA04Service:
    MODEL_VERSION = "ria04-v1"

    DIFFICULTY_LABELS = {
        "low": "dificultad baja",
        "medium": "dificultad media",
        "high": "dificultad alta",
    }

    RECOMMENDATION_MESSAGES = {
        "low": "Bajar dificultad y reforzar bases.",
        "medium": "Mantener dificultad actual.",
        "high": "Subir dificultad con mayor reto.",
    }

    REASON_MESSAGES = {
        "strong_results": "Buen rendimiento.",
        "high_error_ratio": "Errores altos.",
        "high_frustration": "Frustracion elevada.",
        "strong_recent_progress": "Buen progreso reciente.",
        "unstable_performance": "Desempeno inestable.",
        "balanced_performance": "Desempeno equilibrado.",
        "mixed_adaptation_signals": "Senales mixtas.",
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
        result = self.model.predict_detailed(df)
        difficulty_level = result["difficulty_level"]

        return {
            "result": difficulty_level,
            "accuracy": round_metric(getattr(self.model, "accuracy", None)),
            "precision": round_metric(getattr(self.model, "precision", None)),
            "details": {
                "recommendation": self._recommendation_message(difficulty_level),
                "reasons": self._reason_messages(result["reasons"]),
            },
        }

    def _difficulty_label(self, difficulty_level):
        return self.DIFFICULTY_LABELS.get(difficulty_level, difficulty_level)

    def _recommendation_message(self, difficulty_level):
        return self.RECOMMENDATION_MESSAGES.get(
            difficulty_level,
            "Ajustar dificultad segun desempeno.",
        )

    def _reason_messages(self, reasons):
        return [
            self.REASON_MESSAGES.get(reason, reason)
            for reason in reasons
        ]
