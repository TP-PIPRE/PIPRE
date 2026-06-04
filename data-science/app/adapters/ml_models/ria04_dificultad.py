import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import ExtraTreesClassifier


class AjusteAdaptativoDificultad:

    def __init__(self, verbose=False):
        self.model = ExtraTreesClassifier(
            n_estimators=300,
            max_depth=None,
            min_samples_split=2,
            class_weight="balanced",
            random_state=42,
        )

        self.verbose = verbose
        self.le_nivel = LabelEncoder()
        self.le_target = LabelEncoder()

        self.accuracy = 0
        self.precision = 0
        self.recall = 0
        self.fn_rate = 0

        self.feature_columns = [
            "puntaje",
            "tasa_exito",
            "errores",
            "intentos",
            "ayuda_solicitada",
            "actividades_completadas",
            "dias_inactivo",
            "nivel_logico",
            "ratio_error",
            "frustracion",
            "progreso_reciente",
            "estabilidad",
        ]

    def construir_nivel_dificultad(self, df):
        df = df.copy()

        nivel_score = (
            df["nivel_logico"]
            .astype(str)
            .str.lower()
            .map({"bajo": 0, "medio": 1, "alto": 2})
            .fillna(1)
        )

        success_rate = self._normalize_success_rate(df["tasa_exito"])
        result_score = pd.to_numeric(df["puntaje"], errors="coerce").fillna(0).clip(0, 100) / 100

        frustration = (
            df["errores"].clip(lower=0, upper=10) * 0.45 +
            df["ayuda_solicitada"].clip(lower=0, upper=10) * 0.25 +
            df["dias_inactivo"].clip(lower=0, upper=30) * 0.12
        )

        recent_progress = (
            df["actividades_completadas"].clip(lower=0, upper=20) * 0.06 +
            df["intentos"].clip(lower=0, upper=10) * 0.04 +
            nivel_score * 0.2
        )

        df["difficulty_score"] = (
            result_score * 4.0 +
            success_rate * 4.0 +
            recent_progress -
            frustration
        )

        df["nivel_dificultad"] = pd.cut(
            df["difficulty_score"],
            bins=[-np.inf, 2.0, 5.0, np.inf],
            labels=["low", "medium", "high"],
        ).astype(str)

        return df

    def preprocess(self, df, is_training=False):
        df = df.copy()

        base_cols = [
            "puntaje",
            "tasa_exito",
            "errores",
            "intentos",
            "ayuda_solicitada",
            "actividades_completadas",
            "dias_inactivo",
            "nivel_logico",
        ]

        for col in base_cols:
            if col not in df.columns:
                df[col] = 0

        numeric_cols = [
            "puntaje",
            "tasa_exito",
            "errores",
            "intentos",
            "ayuda_solicitada",
            "actividades_completadas",
            "dias_inactivo",
        ]

        for col in numeric_cols:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

        df["tasa_exito"] = self._normalize_success_rate(df["tasa_exito"])
        df["nivel_logico"] = df["nivel_logico"].astype(str)

        if is_training:
            df = self.construir_nivel_dificultad(df)

        df["ratio_error"] = df["errores"] / (df["intentos"] + 1)
        df["frustracion"] = (
            df["errores"] * 0.5 +
            df["ayuda_solicitada"] * 0.3 +
            df["dias_inactivo"] * 0.2
        )
        df["progreso_reciente"] = df["actividades_completadas"] / (df["intentos"] + 1)
        df["estabilidad"] = df["tasa_exito"] - df["ratio_error"]

        df.replace([np.inf, -np.inf], 0, inplace=True)
        df.fillna(0, inplace=True)

        if is_training:
            df["nivel_logico"] = self.le_nivel.fit_transform(df["nivel_logico"])
            df["nivel_dificultad"] = self.le_target.fit_transform(df["nivel_dificultad"])
        else:
            df["nivel_logico"] = df["nivel_logico"].apply(
                lambda x: x if x in self.le_nivel.classes_ else self.le_nivel.classes_[0]
            )
            df["nivel_logico"] = self.le_nivel.transform(df["nivel_logico"])

        return df

    def train(self, df):
        df = self.preprocess(df, is_training=True)

        X = df[self.feature_columns]
        y = df["nivel_dificultad"]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, stratify=y, random_state=42
        )

        self.model.fit(X_train, y_train)

        y_pred = self.model.predict(X_test)

        self.accuracy = accuracy_score(y_test, y_pred)
        self.precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
        self.recall = recall_score(y_test, y_pred, average="weighted", zero_division=0)
        self.fn_rate = 1 - self.recall

        if self.verbose:
            print("Distribucion nivel dificultad:")
            print(pd.Series(y).value_counts())

    def predict(self, data):
        data = self.preprocess(data, is_training=False)

        for col in self.feature_columns:
            if col not in data.columns:
                data[col] = 0

        pred = self.model.predict(data[self.feature_columns])[0]
        return self.le_target.inverse_transform([pred])[0]

    def predict_detailed(self, data):
        data = self.preprocess(data, is_training=False)

        for col in self.feature_columns:
            if col not in data.columns:
                data[col] = 0

        X = data[self.feature_columns]
        pred = self.model.predict(X)[0]
        label = self.le_target.inverse_transform([pred])[0]
        probabilities = self.model.predict_proba(X)[0]

        return {
            "difficulty_level": label,
            "confidence": float(max(probabilities)),
            "reasons": self._build_reasons(data.iloc[0], label),
        }

    def _build_reasons(self, row, label):
        reasons = []

        if row["tasa_exito"] >= 0.8 and row["puntaje"] >= 80:
            reasons.append("strong_results")

        if row["ratio_error"] >= 1:
            reasons.append("high_error_ratio")

        if row["frustracion"] >= 5:
            reasons.append("high_frustration")

        if row["progreso_reciente"] >= 2:
            reasons.append("strong_recent_progress")

        if row["estabilidad"] < 0:
            reasons.append("unstable_performance")

        if label == "medium" and not reasons:
            reasons.append("balanced_performance")

        return reasons or ["mixed_adaptation_signals"]

    def _normalize_success_rate(self, value):
        value = pd.to_numeric(value, errors="coerce").fillna(0)

        if value.max() > 1:
            return value / 100

        return value
