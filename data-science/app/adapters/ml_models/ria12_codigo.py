from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score
from sklearn.preprocessing import LabelEncoder
import pandas as pd
import numpy as np


class EvaluadorCodigo:

    def __init__(self):
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            class_weight="balanced",
            random_state=42
        )

        self.le_nivel = LabelEncoder()
        self.le_emocion = LabelEncoder()

        # FEATURES TRANSFORMADAS (sin leak)
        self.feature_columns = [
            "errores",
            "intentos",
            "interacciones_ia",
            "ayuda_solicitada",
            "actividades_completadas",
            "dias_inactivo",
            "edad",
            "grado",
            "ratio_error",
            "intentos_normalizados",
            "ia_por_error",
            "ayuda_por_error",
            "actividad_por_inactividad",
            "nivel_logico",
            "emocion_detectada"
        ]

        self.accuracy = 0
        self.precision = 0

    # =========================
    #  PREPROCESS
    # =========================
    def preprocess_data(self, df, is_training=False):

        df = df.copy()

        base_cols = [
            "errores",
            "intentos",
            "interacciones_ia",
            "ayuda_solicitada",
            "actividades_completadas",
            "dias_inactivo",
            "edad",
            "grado",
            "nivel_logico",
            "emocion_detectada"
        ]

        #  asegurar columnas
        for col in base_cols:
            if col not in df.columns:
                df[col] = 0

        #  asegurar numéricos
        for col in [
            "errores",
            "intentos",
            "interacciones_ia",
            "ayuda_solicitada",
            "actividades_completadas",
            "dias_inactivo",
            "edad",
            "grado"
        ]:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

        # 🔥 encoding nivel lógico (ANTES del target)
        df["nivel_logico"] = df["nivel_logico"].astype(str)
        df["emocion_detectada"] = df["emocion_detectada"].astype(str)

        if is_training:
            df["nivel_logico"] = self.le_nivel.fit_transform(df["nivel_logico"])
            df["emocion_detectada"] = self.le_emocion.fit_transform(df["emocion_detectada"])
        else:
            df["nivel_logico"] = df["nivel_logico"].apply(
                lambda x: x if x in self.le_nivel.classes_ else self.le_nivel.classes_[0]
            )
            df["nivel_logico"] = self.le_nivel.transform(df["nivel_logico"])
            df["emocion_detectada"] = df["emocion_detectada"].apply(
                lambda x: x if x in self.le_emocion.classes_ else self.le_emocion.classes_[0]
            )
            df["emocion_detectada"] = self.le_emocion.transform(df["emocion_detectada"])

        #  TARGET (sin error ahora)
        if is_training:
            df["calidad_codigo"] = (
                -df["errores"] * 3 +
                df["intentos"] * 1.5 +
                df["interacciones_ia"] * 1.2 +
                df["actividades_completadas"] * 1.4 -
                df["ayuda_solicitada"] * 1.1 -
                df["dias_inactivo"] * 1.2 +
                df["nivel_logico"] * 5
            )

            df["calidad_codigo"] = pd.cut(
                df["calidad_codigo"],
                bins=3,
                labels=[0, 1, 2]
            )

        # 🔥 FEATURES DERIVADAS (sin copiar fórmula)
        df["ratio_error"] = df["errores"] / (df["intentos"] + 1)
        df["intentos_normalizados"] = df["intentos"] / (df["errores"] + 1)
        df["ia_por_error"] = df["interacciones_ia"] / (df["errores"] + 1)
        df["ayuda_por_error"] = df["ayuda_solicitada"] / (df["errores"] + 1)
        df["actividad_por_inactividad"] = df["actividades_completadas"] / (df["dias_inactivo"] + 1)

        # 🔧 limpieza
        df.replace([np.inf, -np.inf], 0, inplace=True)
        df.fillna(0, inplace=True)

        return df

    # =========================
    #  TRAIN
    # =========================
    def train(self, df):

        df = self.preprocess_data(df, is_training=True)

        X = df[self.feature_columns]
        y = df["calidad_codigo"]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        self.model.fit(X_train, y_train)

        y_pred = self.model.predict(X_test)

        self.accuracy = accuracy_score(y_test, y_pred)
        self.precision = precision_score(
            y_test, y_pred, average="weighted", zero_division=0
        )

    # =========================
    #  PREDICT
    # =========================
    def predict(self, data):

        data = self.preprocess_data(data, is_training=False)

        for col in self.feature_columns:
            if col not in data.columns:
                data[col] = 0

        X = data[self.feature_columns]

        pred = self.model.predict(X)[0]

        if pred == 0:
            return "Código básico"
        elif pred == 1:
            return "Código intermedio"
        else:
            return "Código avanzado"
