import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, confusion_matrix
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier


class ClasificadorDesempeno:

    def __init__(self, verbose=False):
        self.model = None
        self.le_nivel = LabelEncoder()
        self.le_target = LabelEncoder()
        self.verbose = verbose
        self.model_version = "ria01-v4"

        self.feature_columns = [
            "intentos",
            "errores",
            "nivel_logico",
            "interacciones_ia",
            "ratio_error",
            "dependencia_ia"
        ]

    def construir_rendimiento(self, df):
        df = df.copy()

        if "rendimiento" in df.columns:
            rendimiento = (
                df["rendimiento"]
                .astype(str)
                .str.strip()
                .str.lower()
                .replace({
                    "desempeño bajo": "bajo",
                    "desempeno bajo": "bajo",
                    "desempeño medio": "medio",
                    "desempeno medio": "medio",
                    "desempeño alto": "alto",
                    "desempeno alto": "alto",
                })
            )
            valid_labels = {"bajo", "medio", "alto"}
            if rendimiento.isin(valid_labels).all() and rendimiento.nunique() >= 2:
                df["rendimiento"] = rendimiento
                return df

        tasa_exito = pd.to_numeric(df["tasa_exito"], errors="coerce").fillna(0)
        if tasa_exito.max() > 1:
            tasa_exito = tasa_exito / 100

        score = (
            (pd.to_numeric(df["puntaje"], errors="coerce").fillna(0) * 0.5) +
            (tasa_exito * 100 * 0.5)
        )

        df["rendimiento"] = pd.cut(
            score,
            bins=[-float("inf"), 67, 83, float("inf")],
            labels=["bajo", "medio", "alto"]
        )

        df["rendimiento"] = df["rendimiento"].fillna("medio")

        return df

    def preprocess_data(self, df, is_training=False):
        df = df.copy()  # 🔥 NO modificar original

        base_cols = [
            "errores", "intentos", "nivel_logico", "interacciones_ia"
        ]

        # asegurar columnas base
        for col in base_cols:
            if col not in df.columns:
                df[col] = 0

        #  SOLO en entrenamiento se usa puntaje/tasa_exito
        if is_training:
            if "puntaje" not in df.columns or "tasa_exito" not in df.columns:
                raise ValueError("Faltan columnas necesarias para construir el target")

            df = self.construir_rendimiento(df)

        # FEATURES (SIN usar puntaje ni tasa_exito)
        df["ratio_error"] = df["errores"] / (df["intentos"] + 1)
        df["dependencia_ia"] = df["interacciones_ia"] / (df["intentos"] + 1)

        df["nivel_logico"] = self._encode_logical_level(df["nivel_logico"])

        #  encoding
        if is_training:
            df["rendimiento"] = self.le_target.fit_transform(df["rendimiento"])

        return df

    def _encode_logical_level(self, values):
        return (
            values
            .astype(str)
            .str.strip()
            .str.lower()
            .map({"bajo": 0, "medio": 1, "alto": 2})
            .fillna(1)
        )

    def train(self, df):
        df = self.preprocess_data(df, is_training=True)

        X = df[self.feature_columns]
        y = df["rendimiento"]

        if self.verbose:
            print("Distribución clases:")
            print(pd.Series(y).value_counts())

        X_train, X_test, y_train, y_test = train_test_split(
            X, y,
            test_size=0.2,
            stratify=y,
            random_state=42
        )

        #  RandomForest NO necesita scaler → eliminado
        self.model = RandomForestClassifier(
            n_estimators=300,
            max_depth=8,
            min_samples_split=10,
            class_weight="balanced",
            random_state=42
        )

        self.model.fit(X_train, y_train)

        y_pred = self.model.predict(X_test)

        self.accuracy = accuracy_score(y_test, y_pred)
        self.precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
        self.recall = recall_score(y_test, y_pred, average="weighted", zero_division=0)

        cm = confusion_matrix(y_test, y_pred)
        fn = cm.sum(axis=1) - cm.diagonal()
        self.fn_rate = fn.sum() / cm.sum()

        if self.verbose:
            print("\n📊 Importancia de variables:")
            for name, val in zip(self.feature_columns, self.model.feature_importances_):
                print(f"{name}: {round(val, 3)}")

    def predict(self, data):
        if self.model is None:
            raise ValueError("El modelo debe entrenarse antes de predecir.")

        data = self.preprocess_data(data, is_training=False)

        for col in self.feature_columns:
            if col not in data.columns:
                data[col] = 0

        data = data[self.feature_columns]

        pred = self.model.predict(data)[0]
        label = self.le_target.inverse_transform([pred])[0]

        return label
