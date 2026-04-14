import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score
from sklearn.preprocessing import LabelEncoder


class ClasificadorTiempo:

    def __init__(self, verbose=False):
        self.model = RandomForestClassifier(
            n_estimators=200,
            max_depth=10,
            class_weight="balanced",
            random_state=42
        )

        self.verbose = verbose
        self.le_nivel = LabelEncoder()
        self.le_target = LabelEncoder()

        self.accuracy = 0
        self.precision = 0
        self.recall = 0

        # 🔥 FEATURES NUEVAS (NO DIRECTAMENTE LAS MISMAS DEL TARGET)
        self.feature_columns = [
            "ratio_error",
            "ratio_codigo",
            "interaccion_relativa",
            "complejidad",
            "nivel_logico"
        ]

    def construir_target(self, df):
        df = df.copy()

        df["tiempo_score"] = (
            df["intentos"] * 2 +
            df["errores"] * 3 +
            df["interacciones_ia"] * 1.5 -
            df["uso_codigo"] * 1.5 -
            df["nivel_logico"] * 2
        )

        q1 = df["tiempo_score"].quantile(0.33)
        q2 = df["tiempo_score"].quantile(0.66)

        df["categoria_tiempo"] = pd.cut(
            df["tiempo_score"],
            bins=[-np.inf, q1, q2, np.inf],
            labels=["corto", "medio", "largo"]
        ).astype(str)

        return df

    def preprocess(self, df, is_training=False):
        df = df.copy()

        base_cols = [
            "intentos",
            "errores",
            "interacciones_ia",
            "uso_codigo",
            "nivel_logico"
        ]

        # asegurar columnas
        for col in base_cols:
            if col not in df.columns:
                df[col] = 0

        # asegurar numéricos
        for col in base_cols:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

        # 🔥 TARGET (solo en entrenamiento)
        if is_training:
            df = self.construir_target(df)

        # 🔥 FEATURES TRANSFORMADAS (NO SON LA MISMA FÓRMULA)
        df["ratio_error"] = df["errores"] / (df["intentos"] + 1)
        df["ratio_codigo"] = df["uso_codigo"] / (df["interacciones_ia"] + 1)
        df["interaccion_relativa"] = df["interacciones_ia"] / (df["intentos"] + 1)
        df["complejidad"] = df["errores"] * df["interacciones_ia"]

        # limpieza
        df.replace([np.inf, -np.inf], 0, inplace=True)
        df.fillna(0, inplace=True)

        # encoding
        df["nivel_logico"] = df["nivel_logico"].astype(str)

        if is_training:
            df["nivel_logico"] = self.le_nivel.fit_transform(df["nivel_logico"])
            df["categoria_tiempo"] = self.le_target.fit_transform(df["categoria_tiempo"])
        else:
            df["nivel_logico"] = df["nivel_logico"].apply(
                lambda x: x if x in self.le_nivel.classes_ else self.le_nivel.classes_[0]
            )
            df["nivel_logico"] = self.le_nivel.transform(df["nivel_logico"])

        return df

    def train(self, df):
        df = self.preprocess(df, is_training=True)

        X = df[self.feature_columns]
        y = df["categoria_tiempo"]

        if self.verbose:
            print("\n📊 Distribución clases tiempo:")
            print(pd.Series(y).value_counts())

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, stratify=y, random_state=42
        )

        self.model.fit(X_train, y_train)

        y_pred = self.model.predict(X_test)

        self.accuracy = accuracy_score(y_test, y_pred)
        self.precision = precision_score(
            y_test, y_pred, average="weighted", zero_division=0
        )
        self.recall = recall_score(
            y_test, y_pred, average="weighted", zero_division=0
        )

    def predict(self, data):
        data = self.preprocess(data, is_training=False)

        for col in self.feature_columns:
            if col not in data.columns:
                data[col] = 0

        X = data[self.feature_columns]

        pred = self.model.predict(X)[0]

        return self.le_target.inverse_transform([pred])[0]