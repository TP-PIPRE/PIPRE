import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, precision_score
from xgboost import XGBClassifier


class RecomendadorActividades:

    def __init__(self, verbose=False):
        self.model_stage1 = None
        self.model_stage2 = None

        self.best_threshold = 0.5
        self.stage1_threshold = 0.6

        self.accuracy = 0
        self.precision = 0

        self.le_nivel = LabelEncoder()
        self.verbose = verbose

        self.feature_columns = [
            "nivel_logico",
            "dias_inactivo",
            "interacciones_ia",
            "intentos",
            "ratio_ia",
            "inactividad_relativa",
            "engagement",
            "consistencia",
            "intensidad_total",
            "eficiencia"
        ]

    def preprocess_data(self, df, is_training=False):
        df = df.copy()

        base_cols = [
            "nivel_logico", "dias_inactivo",
            "interacciones_ia", "intentos"
        ]

        for col in base_cols:
            if col not in df.columns:
                df[col] = 0

        numeric_cols = ["dias_inactivo", "interacciones_ia", "intentos"]

        for col in numeric_cols:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

        df["nivel_logico"] = df["nivel_logico"].astype(str)

        if is_training:
            nivel_score = (
                df["nivel_logico"]
                .str.lower()
                .map({"bajo": 0, "medio": 1, "alto": 2})
                .fillna(1)
            )

            df["score_final"] = (
                nivel_score * 2.0 +
                df["intentos"].clip(lower=0, upper=10) * 0.45 +
                df["interacciones_ia"].clip(lower=0, upper=10) * 0.25 -
                df["dias_inactivo"].clip(lower=0, upper=30) * 0.35
            )

            df["rendimiento"] = pd.cut(
                df["score_final"],
                bins=[-float("inf"), 2.0, 5.5, float("inf")],
                labels=["bajo", "medio", "alto"]
            )

            df["rendimiento"] = df["rendimiento"].astype(str).fillna("medio")

        # FEATURES
        df["ratio_ia"] = df["interacciones_ia"] / (df["intentos"] + 1)
        df["inactividad_relativa"] = df["dias_inactivo"] / (df["dias_inactivo"] + df["intentos"] + 1)

        df["engagement"] = df["interacciones_ia"] / (df["dias_inactivo"] + 1)
        df["consistencia"] = df["intentos"] / (df["dias_inactivo"] + 1)

        df["intensidad_total"] = df["interacciones_ia"] + df["intentos"]
        df["eficiencia"] = df["intentos"] / (df["interacciones_ia"] + 1)

        df.replace([np.inf, -np.inf], 0, inplace=True)
        df.fillna(0, inplace=True)

        if is_training:
            df["nivel_logico"] = self.le_nivel.fit_transform(df["nivel_logico"])
        else:
            df["nivel_logico"] = df["nivel_logico"].apply(
                lambda x: x if x in self.le_nivel.classes_ else self.le_nivel.classes_[0]
            )
            df["nivel_logico"] = self.le_nivel.transform(df["nivel_logico"])

        return df

    def train(self, df):
        df = self.preprocess_data(df, is_training=True)

        X = df[self.feature_columns]
        y = df["rendimiento"]

        X_model, X_test, y_model, y_test = train_test_split(
            X, y, test_size=0.2, stratify=y, random_state=42
        )

        X_train, X_val, y_train, y_val = train_test_split(
            X_model, y_model, test_size=0.25, stratify=y_model, random_state=42
        )

        # ===== STAGE 1 =====
        y1_train = y_train.apply(lambda x: 0 if x == "bajo" else 1)
        y1_val = y_val.apply(lambda x: 0 if x == "bajo" else 1)

        self.model_stage1 = XGBClassifier(
            n_estimators=400,
            max_depth=7,
            learning_rate=0.03,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            eval_metric="logloss"
        )

        self.model_stage1.fit(X_train, y1_train)

        probs1 = self.model_stage1.predict_proba(X_val)

        best_acc1 = 0
        for thr in np.arange(0.4, 0.8, 0.02):
            preds = np.where(probs1[:, 0] > thr, 0, 1)
            acc = accuracy_score(y1_val, preds)
            if acc > best_acc1:
                best_acc1 = acc
                self.stage1_threshold = thr

        # ===== STAGE 2 =====
        train_mask = y_train != "bajo"
        val_mask = y_val != "bajo"

        X2_train = X_train[train_mask]
        y2_train = y_train[train_mask].map({"medio": 0, "alto": 1})
        X2_val = X_val[val_mask]
        y2_val = y_val[val_mask].map({"medio": 0, "alto": 1})

        scale_pos_weight = (len(y2_train) - sum(y2_train)) / sum(y2_train)

        self.model_stage2 = XGBClassifier(
            n_estimators=400,
            max_depth=7,
            learning_rate=0.03,
            subsample=0.8,
            colsample_bytree=0.8,
            scale_pos_weight=scale_pos_weight,
            random_state=42,
            eval_metric="logloss"
        )

        self.model_stage2.fit(X2_train, y2_train)

        probs2 = self.model_stage2.predict_proba(X2_val)

        best_acc2 = 0
        for thr in np.arange(0.3, 0.8, 0.01):
            preds = np.where(probs2[:, 0] > thr, 0, 1)
            acc = accuracy_score(y2_val, preds)
            if acc > best_acc2:
                best_acc2 = acc
                self.best_threshold = thr

        test_preds = self._predict_labels(X_test)
        self.accuracy = accuracy_score(y_test, test_preds)
        self.precision = precision_score(y_test, test_preds, average="weighted", zero_division=0)

    def evaluar(self, df):
        df = self.preprocess_data(df, is_training=True)

        X = df[self.feature_columns]
        y_real = df["rendimiento"]

        preds = self._predict_labels(X)

        self.accuracy = accuracy_score(y_real, preds)
        self.precision = precision_score(y_real, preds, average="weighted", zero_division=0)

    def _predict_labels(self, X):
        preds = []

        for i in range(len(X)):
            row = X.iloc[[i]]
            probs1 = self.model_stage1.predict_proba(row)[0]

            if probs1[0] > self.stage1_threshold:
                preds.append("bajo")
            else:
                probs2 = self.model_stage2.predict_proba(row)[0]

                if probs2[0] > self.best_threshold:
                    preds.append("medio")
                else:
                    preds.append("alto")

        return preds

    def predict(self, data):
        data = self.preprocess_data(data, is_training=False)
        X = data[self.feature_columns]

        probs1 = self.model_stage1.predict_proba(X)[0]

        if probs1[0] > self.stage1_threshold:
            return "Recomendar actividades básicas"

        probs2 = self.model_stage2.predict_proba(X)[0]

        if probs2[0] > self.best_threshold:
            return "Recomendar actividades intermedias"
        else:
            return "Recomendar actividades avanzadas"
