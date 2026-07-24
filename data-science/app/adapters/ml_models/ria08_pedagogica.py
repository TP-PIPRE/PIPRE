"""RIA08: recomendación pedagógica (renumerado desde RIA10)."""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, OneHotEncoder


class RecomendadorPedagogico:

    def __init__(self, verbose=False):
        self.model = RandomForestClassifier(
            n_estimators=800,
            max_depth=10,
            min_samples_split=4,
            min_samples_leaf=1,
            max_features="sqrt",
            class_weight="balanced_subsample",
            random_state=42,
        )

        self.verbose = verbose
        self.le_target = LabelEncoder()
        self.onehot_encoder = self._build_onehot_encoder()

        self.accuracy = 0
        self.precision = 0
        self.recall = 0
        self.f1 = 0
        self.classification_report = {}
        self.confusion_matrix = []
        self.is_trained = False

        self.global_target_thresholds = {}
        self.grade_target_thresholds = {}
        self.global_group_stats = {}
        self.grade_group_stats = {}
        self.model_feature_columns = []

        self.numeric_feature_columns = [
            "errores",
            "intentos",
            "dias_inactivo",
            "actividades_completadas",
            "ayuda_solicitada",
            "interacciones_ia",
            "grado",
            "brecha_errores",
            "brecha_inactividad",
            "brecha_actividades",
            "ratio_error",
            "dependencia_ia",
            "necesidad_apoyo",
            "errores_por_actividad",
            "intentos_por_actividad",
            "ayuda_por_actividad",
            "ia_por_actividad",
        ]
        self.categorical_feature_columns = ["nivel_logico"]
        self.feature_columns = self.numeric_feature_columns + self.categorical_feature_columns

    def build_pedagogical_target(self, df, fit_thresholds=False):
        df = df.copy()

        required_cols = ["puntaje", "tasa_exito", "grado"]
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise ValueError(f"Faltan columnas para construir la etiqueta: {missing_cols}")

        df["puntaje"] = pd.to_numeric(df["puntaje"], errors="coerce").fillna(0)
        df["tasa_exito"] = self._normalize_success_rate(df["tasa_exito"])
        df["grado"] = pd.to_numeric(df["grado"], errors="coerce").fillna(0)

        if fit_thresholds:
            self._fit_target_thresholds(df)

        labels = []
        for _, row in df.iterrows():
            thresholds = self._resolve_target_thresholds(row["grado"])
            low_score = row["puntaje"] <= thresholds["puntaje_low"]
            low_success = row["tasa_exito"] <= thresholds["tasa_exito_low"]
            high_score = row["puntaje"] >= thresholds["puntaje_high"]
            high_success = row["tasa_exito"] >= thresholds["tasa_exito_high"]

            if low_score and low_success:
                labels.append("individual_support")
            elif low_score or low_success:
                labels.append("reinforce_group")
            elif high_score and high_success:
                labels.append("increase_challenge")
            else:
                labels.append("maintain_strategy")

        df["pedagogical_recommendation_target"] = labels
        return df

    def preprocess(self, df, fit_group_stats=False):
        df = df.copy()

        base_cols = [
            "errores",
            "intentos",
            "dias_inactivo",
            "actividades_completadas",
            "ayuda_solicitada",
            "interacciones_ia",
            "grado",
            "nivel_logico",
        ]

        for col in base_cols:
            if col not in df.columns:
                df[col] = 0

        numeric_cols = [
            "errores",
            "intentos",
            "dias_inactivo",
            "actividades_completadas",
            "ayuda_solicitada",
            "interacciones_ia",
            "grado",
        ]

        for col in numeric_cols:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

        df["nivel_logico"] = df["nivel_logico"].astype(str)

        if fit_group_stats:
            self._fit_group_stats(df)

        df = self._apply_group_gaps(df)

        df["ratio_error"] = df["errores"] / (df["intentos"] + 1)
        df["dependencia_ia"] = df["interacciones_ia"] / (df["intentos"] + 1)
        df["necesidad_apoyo"] = df["errores"] + df["ayuda_solicitada"] + df["dias_inactivo"]
        df["errores_por_actividad"] = df["errores"] / (df["actividades_completadas"] + 1)
        df["intentos_por_actividad"] = df["intentos"] / (df["actividades_completadas"] + 1)
        df["ayuda_por_actividad"] = df["ayuda_solicitada"] / (df["actividades_completadas"] + 1)
        df["ia_por_actividad"] = df["interacciones_ia"] / (df["actividades_completadas"] + 1)

        df.replace([np.inf, -np.inf], 0, inplace=True)
        df.fillna(0, inplace=True)

        return df

    def train(self, df):
        split_target = self._build_split_target(df)
        train_df, test_df = train_test_split(
            df.copy(),
            test_size=0.2,
            stratify=split_target,
            random_state=42,
        )

        train_df = self.build_pedagogical_target(train_df, fit_thresholds=True)
        test_df = self.build_pedagogical_target(test_df)

        train_df = self.preprocess(train_df, fit_group_stats=True)
        test_df = self.preprocess(test_df)

        X_train = self._build_model_features(train_df, fit_encoder=True)
        X_test = self._build_model_features(test_df)
        y_train = self.le_target.fit_transform(train_df["pedagogical_recommendation_target"])
        y_test = self.le_target.transform(test_df["pedagogical_recommendation_target"])

        if self.verbose:
            print("Distribucion recomendaciones pedagogicas:")
            print(pd.Series(train_df["pedagogical_recommendation_target"]).value_counts())

        self.model.fit(X_train, y_train)
        y_pred = self.model.predict(X_test)

        self.accuracy = round(accuracy_score(y_test, y_pred), 4)
        self.precision = round(
            precision_score(y_test, y_pred, average="weighted", zero_division=0),
            4,
        )
        self.recall = round(
            recall_score(y_test, y_pred, average="weighted", zero_division=0),
            4,
        )
        self.f1 = round(
            f1_score(y_test, y_pred, average="weighted", zero_division=0),
            4,
        )
        labels = list(range(len(self.le_target.classes_)))
        self.classification_report = classification_report(
            y_test,
            y_pred,
            labels=labels,
            target_names=self.le_target.classes_,
            zero_division=0,
            output_dict=True,
        )
        self.confusion_matrix = confusion_matrix(y_test, y_pred, labels=labels).tolist()

        if self.verbose:
            print(f"Accuracy: {self.accuracy}")
            print(f"Precision: {self.precision}")
            print(f"Recall: {self.recall}")
            print(f"F1: {self.f1}")
            print(classification_report(
                y_test,
                y_pred,
                labels=labels,
                target_names=self.le_target.classes_,
                zero_division=0,
            ))
            print("Matriz de confusion:")
            print(self.confusion_matrix)

        self.is_trained = True

    def predict(self, data):
        self._ensure_trained()
        data = self.preprocess(data)
        predictions = self._predict_target(data)
        labels = self.le_target.inverse_transform(predictions)

        if len(labels) == 1:
            return labels[0]

        return labels.tolist()

    def predict_detailed(self, data):
        self._ensure_trained()
        data = self.preprocess(data)
        X = self._build_model_features(data)
        predictions = self.model.predict(X)
        probabilities = self.model.predict_proba(X)
        recommendations = self.le_target.inverse_transform(predictions)

        results = []
        for recommendation, probability, (_, row) in zip(
            recommendations,
            probabilities,
            data.iterrows(),
        ):
            reasons = self._build_reasons(row, recommendation)
            grade_comparison = self._build_grade_comparison(row)
            results.append({
                "pedagogical_profile": self._profile_from_recommendation(recommendation),
                "pedagogical_risk": self._risk_from_recommendation(recommendation),
                "pedagogical_recommendation": recommendation,
                "confidence": round(float(max(probability)), 4),
                "grade_comparison": grade_comparison,
                "reasons": reasons,
                "teacher_suggestion": self._build_teacher_suggestion(
                    recommendation,
                    reasons,
                    grade_comparison,
                    row,
                ),
            })

        if len(results) == 1:
            return results[0]

        return results

    def _predict_target(self, data):
        for col in self.feature_columns:
            if col not in data.columns:
                data[col] = 0

        X = self._build_model_features(data)
        return self.model.predict(X)

    def _build_model_features(self, df, fit_encoder=False):
        numeric_features = df[self.numeric_feature_columns].reset_index(drop=True)
        categorical_features = df[self.categorical_feature_columns].astype(str)

        if fit_encoder:
            encoded = self.onehot_encoder.fit_transform(categorical_features)
        else:
            encoded = self.onehot_encoder.transform(categorical_features)

        encoded_columns = self.onehot_encoder.get_feature_names_out(
            self.categorical_feature_columns
        )
        encoded_features = pd.DataFrame(encoded, columns=encoded_columns)
        features = pd.concat([numeric_features, encoded_features], axis=1)

        if fit_encoder:
            self.model_feature_columns = list(features.columns)

        return features.reindex(columns=self.model_feature_columns, fill_value=0)

    def _fit_target_thresholds(self, df):
        self.global_target_thresholds = self._target_thresholds_from_df(df)
        self.grade_target_thresholds = {
            grade: self._target_thresholds_from_df(group)
            for grade, group in df.groupby("grado")
        }

    def _target_thresholds_from_df(self, df):
        return {
            "puntaje_low": df["puntaje"].quantile(0.35),
            "puntaje_high": df["puntaje"].quantile(0.75),
            "tasa_exito_low": df["tasa_exito"].quantile(0.35),
            "tasa_exito_high": df["tasa_exito"].quantile(0.75),
        }

    def _resolve_target_thresholds(self, grade):
        if not self.global_target_thresholds:
            return {
                "puntaje_low": 50,
                "puntaje_high": 75,
                "tasa_exito_low": 0.5,
                "tasa_exito_high": 0.75,
            }

        return self.grade_target_thresholds.get(grade, self.global_target_thresholds)

    def _build_split_target(self, df):
        split_df = df.copy()
        required_cols = ["puntaje", "tasa_exito", "grado"]
        missing_cols = [col for col in required_cols if col not in split_df.columns]
        if missing_cols:
            raise ValueError(f"Faltan columnas para estratificar: {missing_cols}")

        split_df["puntaje"] = pd.to_numeric(split_df["puntaje"], errors="coerce").fillna(0)
        split_df["tasa_exito"] = self._normalize_success_rate(split_df["tasa_exito"])
        split_df["grado"] = pd.to_numeric(split_df["grado"], errors="coerce").fillna(0)

        score_bins = pd.cut(
            split_df["puntaje"],
            bins=[-np.inf, 50, 75, np.inf],
            labels=["low_score", "mid_score", "high_score"],
        ).astype(str)
        success_bins = pd.cut(
            split_df["tasa_exito"],
            bins=[-np.inf, 0.5, 0.75, np.inf],
            labels=["low_success", "mid_success", "high_success"],
        ).astype(str)

        combined_target = score_bins + "_" + success_bins
        if combined_target.value_counts().min() >= 2:
            return combined_target

        if score_bins.value_counts().min() >= 2:
            return score_bins

        return None

    def _ensure_trained(self):
        if not self.is_trained:
            raise ValueError("El modelo debe entrenarse antes de predecir.")

    def _fit_group_stats(self, df):
        stat_cols = [
            "errores",
            "dias_inactivo",
            "actividades_completadas",
        ]

        self.global_group_stats = df[stat_cols].mean().to_dict()
        self.grade_group_stats = (
            df.groupby("grado")[stat_cols]
            .mean()
            .to_dict(orient="index")
        )

    def _apply_group_gaps(self, df):
        df = df.copy()

        group_values = df.apply(self._resolve_group_stats, axis=1, result_type="expand")
        group_values.columns = [
            "grupo_errores",
            "grupo_dias_inactivo",
            "grupo_actividades_completadas",
        ]

        df = pd.concat([df, group_values], axis=1)

        df["brecha_errores"] = df["errores"] - df["grupo_errores"]
        df["brecha_inactividad"] = df["dias_inactivo"] - df["grupo_dias_inactivo"]
        df["brecha_actividades"] = df["actividades_completadas"] - df["grupo_actividades_completadas"]

        return df

    def _resolve_group_stats(self, row):
        stats = self.grade_group_stats.get(row["grado"], self.global_group_stats)

        return [
            self._get_group_value(row, "grupo_errores", stats, "errores"),
            self._get_group_value(row, "grupo_dias_inactivo", stats, "dias_inactivo"),
            self._get_group_value(
                row,
                "grupo_actividades_completadas",
                stats,
                "actividades_completadas",
            ),
        ]

    def _get_group_value(self, row, explicit_col, stats, stat_col):
        if explicit_col in row and pd.notna(row[explicit_col]):
            value = pd.to_numeric(row[explicit_col], errors="coerce")
            if pd.notna(value):
                return value

        return stats.get(stat_col, self.global_group_stats.get(stat_col, 0))

    def _profile_from_recommendation(self, recommendation):
        profiles = {
            "individual_support": "requiere apoyo individual",
            "reinforce_group": "requiere refuerzo pedagogico",
            "maintain_strategy": "desempeno estable",
            "increase_challenge": "listo para mayor desafio",
        }
        return profiles.get(recommendation, "perfil pedagogico no definido")

    def _risk_from_recommendation(self, recommendation):
        risks = {
            "individual_support": "high",
            "reinforce_group": "medium",
            "maintain_strategy": "low",
            "increase_challenge": "low",
        }
        return risks.get(recommendation, "medium")

    def _build_reasons(self, row, recommendation):
        reasons = []

        if recommendation == "individual_support":
            reasons.append("El modelo identifica senales de alta necesidad de apoyo")

        if recommendation == "reinforce_group":
            reasons.append("El modelo identifica senales de refuerzo pedagogico")

        if recommendation == "increase_challenge":
            reasons.append("El modelo identifica condiciones para aumentar el desafio")

        if row["brecha_errores"] >= 2:
            reasons.append("Cantidad de errores superior al promedio del grupo")

        if row["brecha_inactividad"] >= 3:
            reasons.append("Inactividad mayor que la del grupo")

        if row["brecha_actividades"] <= -1:
            reasons.append("Menos actividades completadas que el promedio del grupo")

        if row["dependencia_ia"] >= 1:
            reasons.append("Alta dependencia de interacciones con IA por intento")

        if recommendation == "maintain_strategy" and not reasons:
            reasons.append("Senales de comportamiento cercanas al promedio del grupo")

        return reasons or ["Senales mixtas de comportamiento pedagogico"]

    def _build_grade_comparison(self, row):
        grade = self._clean_number(row["grado"])
        uses_grade_reference = row["grado"] in self.grade_group_stats
        reference_scope = (
            "same_grade_training_group"
            if uses_grade_reference
            else "global_training_group"
        )

        return {
            "grade": int(grade) if float(grade).is_integer() else grade,
            "reference_scope": reference_scope,
            "metrics": {
                "errors": self._comparison_metric(
                    row["errores"],
                    row["grupo_errores"],
                    higher_is_better=False,
                ),
                "inactive_days": self._comparison_metric(
                    row["dias_inactivo"],
                    row["grupo_dias_inactivo"],
                    higher_is_better=False,
                ),
                "completed_activities": self._comparison_metric(
                    row["actividades_completadas"],
                    row["grupo_actividades_completadas"],
                    higher_is_better=True,
                ),
            },
        }

    def _comparison_metric(self, student_value, grade_average, higher_is_better):
        student_value = self._clean_number(student_value)
        grade_average = self._clean_number(grade_average)
        difference = student_value - grade_average
        tolerance = max(abs(grade_average) * 0.1, 0.5)

        if abs(difference) <= tolerance:
            status = "near_grade_average"
        elif difference > 0:
            status = "favorable" if higher_is_better else "needs_attention"
        else:
            status = "needs_attention" if higher_is_better else "favorable"

        return {
            "student_value": round(student_value, 2),
            "grade_average": round(grade_average, 2),
            "difference": round(difference, 2),
            "status": status,
        }

    def _build_teacher_suggestion(
        self,
        recommendation,
        reasons,
        grade_comparison,
        row,
    ):
        base_suggestions = {
            "individual_support": {
                "title": "Planificar apoyo individual prioritario",
                "summary": (
                    "El estudiante presenta senales que requieren acompanamiento "
                    "personalizado y seguimiento cercano."
                ),
                "priority": "high",
                "actions": [
                    "Programar una sesion breve de acompanamiento individual.",
                    "Asignar una actividad de refuerzo con dificultad basica.",
                ],
                "review_after_activities": 2,
            },
            "reinforce_group": {
                "title": "Aplicar refuerzo pedagogico",
                "summary": (
                    "El estudiante necesita refuerzo y conviene comprobar si el "
                    "mismo patron se repite en otros estudiantes del grado."
                ),
                "priority": "medium",
                "actions": [
                    "Preparar una explicacion guiada del concepto con mayor dificultad.",
                    "Asignar ejercicios de practica antes del siguiente reto.",
                ],
                "review_after_activities": 3,
            },
            "maintain_strategy": {
                "title": "Mantener la estrategia actual",
                "summary": (
                    "El comportamiento del estudiante es estable respecto al grado "
                    "y no requiere una intervencion inmediata."
                ),
                "priority": "low",
                "actions": [
                    "Continuar con la secuencia de aprendizaje planificada.",
                    "Revisar nuevamente las metricas despues de nuevas actividades.",
                ],
                "review_after_activities": 4,
            },
            "increase_challenge": {
                "title": "Proponer un reto de mayor complejidad",
                "summary": (
                    "El estudiante muestra condiciones para avanzar y asumir una "
                    "actividad con mayor exigencia."
                ),
                "priority": "low",
                "actions": [
                    "Asignar un reto que combine dos conceptos de programacion.",
                    "Mantener disponible una pista opcional sin reducir la dificultad inicial.",
                ],
                "review_after_activities": 3,
            },
        }

        suggestion = base_suggestions.get(
            recommendation,
            {
                "title": "Revisar el caso",
                "summary": "Las senales disponibles requieren evaluacion docente.",
                "priority": "medium",
                "actions": ["Revisar las evidencias del estudiante antes de intervenir."],
                "review_after_activities": 2,
            },
        ).copy()
        actions = list(suggestion["actions"])

        metrics = grade_comparison["metrics"]
        if metrics["errors"]["status"] == "needs_attention":
            actions.append(
                "Revisar los errores recurrentes y modelar paso a paso una solucion correcta."
            )
        if metrics["inactive_days"]["status"] == "needs_attention":
            actions.append(
                "Contactar al estudiante y acordar una actividad corta de reincorporacion."
            )
        if metrics["completed_activities"]["status"] == "needs_attention":
            actions.append(
                "Definir un plan de recuperacion para completar las actividades pendientes."
            )
        if row["dependencia_ia"] >= 1:
            actions.append(
                "Solicitar primero una explicacion propia antes de habilitar ayuda de IA."
            )

        suggestion["actions"] = list(dict.fromkeys(actions))
        suggestion["based_on_reasons"] = reasons
        return suggestion

    @staticmethod
    def _clean_number(value):
        numeric = pd.to_numeric(value, errors="coerce")
        return 0.0 if pd.isna(numeric) else float(numeric)

    def _normalize_success_rate(self, value):
        value = pd.to_numeric(value, errors="coerce").fillna(0)

        if value.max() > 1:
            return value / 100

        return value

    def _build_onehot_encoder(self):
        try:
            return OneHotEncoder(handle_unknown="ignore", sparse_output=False)
        except TypeError:
            return OneHotEncoder(handle_unknown="ignore", sparse=False)
