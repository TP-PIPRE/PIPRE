from sklearn.ensemble import IsolationForest
import pandas as pd


class DetectorAnomalias:

    def __init__(self):
        self.model = IsolationForest(contamination=0.1, random_state=42)

        self.feature_columns = [
            "intentos",
            "errores",
            "puntaje",
            "dias_inactivo"
        ]

        self.anomaly_ratio = 0
        self.thresholds = {
            "high_attempts": 0,
            "high_errors": 0,
            "low_score": 0,
            "high_inactivity": 0,
        }

    def preprocess(self, df):
        df = df.copy()

        for col in self.feature_columns:
            if col not in df.columns:
                df[col] = 0

            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

        return df[self.feature_columns]

    def train(self, df):
        X = self.preprocess(df)

        self.model.fit(X)

        preds = self.model.predict(X)
        self.anomaly_ratio = float((preds == -1).mean())
        self._calculate_thresholds(X)

    def predict(self, data):
        result = self.predict_detailed(data)

        if result["result"] == "anomaly":
            return "Anomalía detectada"

        return "Comportamiento normal"

    def predict_detailed(self, data):
        X = self.preprocess(data)

        result = self.model.predict(X)[0]

        if result != -1:
            return {
                "result": "normal",
                "reasons": [],
                "dataset_anomaly_ratio": self.anomaly_ratio,
            }

        return {
            "result": "anomaly",
            "reasons": self._interpret_anomaly(X.iloc[0]),
            "dataset_anomaly_ratio": self.anomaly_ratio,
        }

    def _calculate_thresholds(self, X):
        self.thresholds = {
            "high_attempts": float(X["intentos"].quantile(0.85)),
            "high_errors": float(X["errores"].quantile(0.85)),
            "low_score": float(X["puntaje"].quantile(0.15)),
            "high_inactivity": float(X["dias_inactivo"].quantile(0.85)),
        }

    def _interpret_anomaly(self, row):
        reasons = []

        if row["dias_inactivo"] >= self.thresholds["high_inactivity"]:
            reasons.append("high_inactivity")

        if row["errores"] >= self.thresholds["high_errors"]:
            reasons.append("high_errors")

        if row["puntaje"] <= self.thresholds["low_score"]:
            reasons.append("low_score")

        if row["intentos"] >= self.thresholds["high_attempts"]:
            reasons.append("high_attempts")

        if (
            row["intentos"] >= self.thresholds["high_attempts"]
            and row["puntaje"] <= self.thresholds["low_score"]
        ):
            reasons.append("high_effort_low_score")

        if (
            row["errores"] >= self.thresholds["high_errors"]
            and row["puntaje"] > self.thresholds["low_score"]
        ):
            reasons.append("inconsistent_performance")

        return reasons or ["unusual_combination"]

    def calcular_importancia(self, df):
        X = self.preprocess(df)

        importancias = X.std().to_dict()

        total = sum(importancias.values())
        if total > 0:
            importancias = {k: v / total for k, v in importancias.items()}

        return importancias
