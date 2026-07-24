import pandas as pd


class RIA07Service:
    MODEL_VERSION = "ria07-risk-anomaly-v3.0"

    def __init__(self, model):
        self.model = model
        self._trained = False

    def set_model(self, model):
        if not getattr(model, "is_fitted", False):
            raise ValueError("El modelo RIA07 persistido no esta entrenado")
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
            "result": result["risk_level"],
            "student_id": result["student_id"],
            "student_name": result["student_name"],
            "risk_level": result["risk_level"],
            "risk_label": result["risk_label"],
            "risk_score": result["risk_score"],
            "anomaly": result["anomaly"],
            "anomaly_score": result["anomaly_score"],
            "reasons": result["reasons"],
            "evidence": result["evidence"],
            "teacher_recommendation": result["teacher_recommendation"],
            "details": {
                "reason_codes": result["reason_codes"],
                "historical_data_used": result["historical_data_used"],
                "student_history_used": result["student_history_used"],
                "reference_cohort_used": result["reference_cohort_used"],
                "reference_anomaly_ratio": self.model.reference_anomaly_ratio,
                "dataset_anomaly_ratio": self.model.anomaly_ratio,
                "anomaly_ratio_note": (
                    "Proporcion de la cohorte de referencia marcada como "
                    "anomala; no es una metrica de calidad."
                ),
            },
        }

    def predict_batch(self, data, sort_by_risk=True):
        if not self._trained:
            raise RuntimeError("Model is not trained")

        rows = self.model.predict_batch(
            pd.DataFrame(data),
            sort_by_risk=sort_by_risk,
        )
        counts = {"low": 0, "medium": 0, "high": 0}
        for row in rows:
            counts[row["risk_level"]] += 1

        return {
            "summary": {
                "total_students": len(rows),
                "normal": counts["low"],
                "attention": counts["medium"],
                "critical": counts["high"],
                "anomalies": sum(1 for row in rows if row["anomaly"]),
                "historical_data_used": False,
                "student_history_used": False,
                "reference_cohort_used": True,
            },
            "students": rows,
        }
