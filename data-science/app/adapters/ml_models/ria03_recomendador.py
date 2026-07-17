from __future__ import annotations

import inspect
import warnings
from copy import deepcopy
from typing import Any

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GroupShuffleSplit, train_test_split
from xgboost import XGBClassifier

from app.adapters.ml_support.ria03_model_selection import (
    RIA03ModelSelector,
    TARGET_TO_INT,
)


class RecomendadorActividades:
    """RIA-03: recomienda dificultad a partir de rendimiento observado.

    Compara un modelo de dos etapas (``bajo`` frente a ``no bajo`` y luego
    ``medio`` frente a ``alto``) con un XGBoost multiclase. La columna
    ``rendimiento`` debe existir antes de entrenar y nunca se genera desde las
    features.
    """

    REQUIRED_COLUMNS = (
        "nivel_logico",
        "dias_inactivo",
        "interacciones_ia",
        "intentos",
    )
    NUMERIC_COLUMNS = ("dias_inactivo", "interacciones_ia", "intentos")
    OPTIONAL_NUMERIC_COLUMNS = (
        "errores",
        "ayuda_solicitada",
        "intentos_historicos_promedio",
        "errores_historicos_promedio",
        "ayuda_historica_promedio",
    )
    OPTIONAL_CATEGORICAL_COLUMNS = ("rendimiento_previo",)
    ALL_NUMERIC_COLUMNS = NUMERIC_COLUMNS + OPTIONAL_NUMERIC_COLUMNS
    TARGET_COLUMN = "rendimiento"
    TARGET_SOURCE = "historical_student_outcome"
    TARGET_CLASSES = ("bajo", "medio", "alto")
    NIVEL_LOGICO_MAP = {"bajo": 0.0, "medio": 1.0, "alto": 2.0}
    GROUP_COLUMN_CANDIDATES = (
        "id_estudiante",
        "estudiante_id",
        "student_id",
        "usuario_id",
        "id_usuario",
    )
    TIME_COLUMN_CANDIDATES = ("fecha", "fecha_sesion", "timestamp")
    RECOMMENDATIONS = {
        "bajo": "Recomendar actividades básicas",
        "medio": "Recomendar actividades intermedias",
        "alto": "Recomendar actividades avanzadas",
    }
    CORE_FEATURE_COLUMNS = (
        "nivel_logico",
        "dias_inactivo",
        "interacciones_ia",
        "intentos",
        "ratio_ia",
        "inactividad_relativa",
        "engagement",
        "consistencia",
        "intensidad_total",
        "eficiencia",
    )

    def __init__(
        self,
        verbose: bool = False,
        split_strategy: str = "auto",
        group_column: str | None = None,
        time_column: str | None = None,
        numeric_missing_strategy: str = "median",
        unknown_category_strategy: str = "error",
        test_size: float = 0.20,
        validation_size: float = 0.20,
        random_state: int = 42,
        threshold_grid: tuple[float, ...] | None = None,
        early_stopping_rounds: int | None = 20,
        xgb_params: dict[str, Any] | None = None,
        search_iterations: int = 8,
        cv_splits: int = 5,
        calibrate_probabilities: bool = True,
    ) -> None:
        self._validate_configuration(
            split_strategy=split_strategy,
            numeric_missing_strategy=numeric_missing_strategy,
            unknown_category_strategy=unknown_category_strategy,
            test_size=test_size,
            validation_size=validation_size,
            early_stopping_rounds=early_stopping_rounds,
        )
        self.verbose = verbose
        self.split_strategy = split_strategy
        self.group_column = group_column
        self.time_column = time_column
        self.numeric_missing_strategy = numeric_missing_strategy
        self.unknown_category_strategy = unknown_category_strategy
        self.test_size = test_size
        self.validation_size = validation_size
        self.random_state = random_state
        self.threshold_grid = np.asarray(
            threshold_grid
            if threshold_grid is not None
            else tuple(np.round(np.arange(0.30, 0.71, 0.05), 2)),
            dtype=float,
        )
        if self.threshold_grid.size == 0 or not np.all(
            (self.threshold_grid > 0) & (self.threshold_grid < 1)
        ):
            raise ValueError("threshold_grid debe contener valores entre 0 y 1.")
        self.early_stopping_rounds = early_stopping_rounds
        self.xgb_params = dict(xgb_params or {})
        if search_iterations < 1:
            raise ValueError("search_iterations debe ser al menos 1.")
        if cv_splits < 2:
            raise ValueError("cv_splits debe ser al menos 2.")
        self.search_iterations = search_iterations
        self.cv_splits = cv_splits
        self.calibrate_probabilities = calibrate_probabilities
        self.model_version = "ria03-v5.1-historical-target"

        self.feature_columns = [
            "nivel_logico",
            "dias_inactivo",
            "interacciones_ia",
            "intentos",
            "errores",
            "ayuda_solicitada",
            "intentos_historicos_promedio",
            "errores_historicos_promedio",
            "ayuda_historica_promedio",
            "rendimiento_previo_score",
            "ratio_ia",
            "inactividad_relativa",
            "engagement",
            "consistencia",
            "intensidad_total",
            "eficiencia",
            "errores_por_intento",
            "ayuda_por_intento",
            "errores_faltante",
            "ayuda_solicitada_faltante",
            "intentos_historicos_promedio_faltante",
            "errores_historicos_promedio_faltante",
            "ayuda_historica_promedio_faltante",
            "rendimiento_previo_faltante",
        ]
        self._reset_training_state()

    def preprocess_data(
        self,
        df: pd.DataFrame | dict[str, Any],
        is_training: bool = False,
    ) -> pd.DataFrame:
        """Transforma features sin crear ni modificar la variable objetivo.

        ``is_training=True`` ajusta las medianas. El flujo principal llama a
        esta opción únicamente con la partición de entrenamiento.
        """
        frame = self._as_dataframe(df)
        return self._prepare_features(frame, fit=is_training)

    def train(self, df: pd.DataFrame) -> dict[str, Any]:
        """Entrena, calibra umbrales en validación y evalúa una vez en test."""
        self._reset_training_state()
        data = self._as_dataframe(df).reset_index(drop=True)
        self._validate_required_columns(data)
        target = self._validate_target(data)
        self.target_consistency_report = self._review_target_consistency(
            data, target
        )
        self._validate_training_target_counts(target)
        self._validate_numeric_values(data)

        split_indices = self._split_data(data, target)
        self.split_indices = {
            name: np.asarray(indices, dtype=int)
            for name, indices in split_indices.items()
        }
        self._validate_split_classes(target, self.split_indices)
        self._build_split_report(data, target, self.split_indices)

        train_idx = self.split_indices["train"]
        validation_idx = self.split_indices["validation"]
        test_idx = self.split_indices["test"]
        raw_features = data.drop(columns=[self.TARGET_COLUMN], errors="ignore")

        X_train = self._prepare_features(raw_features.iloc[train_idx], fit=True)
        self.preprocessor_fit_indices = train_idx.tolist()
        X_validation = self._prepare_features(
            raw_features.iloc[validation_idx], fit=False
        )
        X_test = self._prepare_features(raw_features.iloc[test_idx], fit=False)
        y_train = target.iloc[train_idx].reset_index(drop=True)
        y_validation = target.iloc[validation_idx].reset_index(drop=True)
        y_test = target.iloc[test_idx].reset_index(drop=True)

        self._validate_stage_classes(y_train, y_validation)
        training_groups = self._training_groups(data, train_idx)
        self.model_search_report = self._search_feature_sets(
            X_train,
            y_train,
            training_groups,
        )
        best_hierarchical = self.model_search_report["best"]["hierarchical"]
        best_multiclass = self.model_search_report["best"]["multiclass"]
        self._fit_probability_calibrators(
            y_train,
            best_hierarchical["oof"],
            best_multiclass["oof"],
        )
        X_train = X_train.loc[:, self.selected_feature_columns]
        X_validation = X_validation.loc[:, self.selected_feature_columns]
        X_test = X_test.loc[:, self.selected_feature_columns]
        self.model_stage1 = self._train_stage1(
            X_train,
            y_train,
            X_validation,
            y_validation,
            best_hierarchical["params"],
        )
        self.model_stage2 = self._train_stage2(
            X_train,
            y_train,
            X_validation,
            y_validation,
            best_hierarchical["params"],
        )
        self.model_multiclass = self._train_multiclass(
            X_train,
            y_train,
            X_validation,
            y_validation,
            best_multiclass["params"],
        )

        self.threshold_selection_report = self._optimize_thresholds(
            X_validation, y_validation
        )
        self.architecture_comparison = self._select_architecture(
            X_validation, y_validation
        )
        self.is_trained = True
        test_predictions = self._predict_labels(X_test)
        metrics = self._calculate_metrics(y_test, test_predictions)
        self._store_final_metrics(metrics)
        self.training_result = {
            "metrics": deepcopy(metrics),
            "thresholds": {
                "stage1": self.stage1_threshold,
                "stage2": self.stage2_threshold,
            },
            "split": deepcopy(self.split_report),
            "target_consistency": deepcopy(self.target_consistency_report),
            "threshold_selection": deepcopy(self.threshold_selection_report),
            "selected_architecture": self.selected_architecture,
            "architecture_comparison": deepcopy(self.architecture_comparison),
            "hyperparameter_search": self._search_summary(),
            "calibration": deepcopy(self.calibration_report),
            "preprocessing": {
                "numeric_missing_strategy": self.numeric_missing_strategy,
                "unknown_category_strategy": self.unknown_category_strategy,
                "numeric_medians": deepcopy(self.numeric_medians),
                "fit_rows": len(self.preprocessor_fit_indices),
                "available_optional_features": deepcopy(
                    self.available_optional_features
                ),
            },
            "early_stopping": deepcopy(self.early_stopping_report),
        }

        if self.verbose:
            print(self.training_result)
        return deepcopy(self.training_result)

    def evaluar(self, df: pd.DataFrame) -> dict[str, Any]:
        """Evalúa datos etiquetados sin reajustar ni modificar el modelo."""
        self._check_fitted()
        data = self._as_dataframe(df)
        self._validate_required_columns(data)
        target = self._validate_target(data)
        X = self._prepare_features(data, fit=False)
        predictions = self._predict_labels(X)
        return self._calculate_metrics(target, predictions)

    def _predict_labels(self, X: pd.DataFrame) -> np.ndarray:
        """Predice con la arquitectura elegida únicamente en validación."""
        self._check_fitted()
        missing = [
            column for column in self.selected_feature_columns if column not in X
        ]
        if missing:
            raise ValueError(f"Faltan features transformadas: {missing}")
        if X.empty:
            return np.asarray([], dtype=object)

        if self.selected_architecture == "multiclass":
            probabilities = self._multiclass_probabilities(X)
            return np.asarray(self.TARGET_CLASSES, dtype=object)[
                np.argmax(probabilities, axis=1)
            ]

        probability_low = self._stage1_probability_low(X)
        labels = np.full(len(X), "bajo", dtype=object)
        stage2_indices = np.flatnonzero(
            probability_low < self.stage1_threshold
        )
        if stage2_indices.size:
            probability_medium = self._stage2_probability_medium(
                X.iloc[stage2_indices]
            )
            labels[stage2_indices] = np.where(
                probability_medium >= self.stage2_threshold,
                "medio",
                "alto",
            )
        return labels

    def predict(
        self,
        data: pd.DataFrame | dict[str, Any],
    ) -> str | list[str]:
        """Devuelve una recomendación o una lista en el orden de entrada."""
        self._check_fitted()
        frame = self._as_dataframe(data)
        X = self._prepare_features(frame, fit=False)
        labels = self._predict_labels(X)
        recommendations = [self.RECOMMENDATIONS[label] for label in labels]
        return recommendations[0] if len(recommendations) == 1 else recommendations

    def _validate_required_columns(self, data: pd.DataFrame) -> None:
        missing = [column for column in self.REQUIRED_COLUMNS if column not in data]
        if missing:
            raise ValueError(f"Faltan columnas obligatorias: {missing}")

    def _validate_target(self, data: pd.DataFrame) -> pd.Series:
        if self.TARGET_COLUMN not in data:
            raise ValueError(
                "Se requiere la columna real 'rendimiento', obtenida de "
                "evaluaciones, expertos o resultados observados."
            )
        target = (
            data[self.TARGET_COLUMN]
            .astype("string")
            .str.strip()
            .str.lower()
        )
        invalid = sorted(
            str(value)
            for value in target[~target.isin(self.TARGET_CLASSES)].unique()
        )
        if invalid:
            raise ValueError(
                "rendimiento solo admite bajo, medio o alto. "
                f"Valores inválidos: {invalid}"
            )
        return target.astype(str).reset_index(drop=True)

    def _review_target_consistency(
        self, data: pd.DataFrame, target: pd.Series
    ) -> dict[str, Any]:
        self.disabled_optional_features = set()
        report: dict[str, Any] = {
            "source": self.TARGET_SOURCE,
            "constructed_by_model": False,
            "provenance_status": "confirmed_by_project_definition",
            "role": "supervised_training_label_only",
            "available_at_prediction_time": False,
            "included_in_features": False,
            "distribution": target.value_counts().to_dict(),
            "current_outcomes_excluded": [
                column
                for column in ("puntaje", "tasa_exito")
                if column in data
            ],
            "historical_feature_requirement": (
                "Only values computed before the current activity are valid."
            ),
        }
        group_column = self._available_group_column(data)
        if group_column is not None:
            records_per_student = data[group_column].astype(str).value_counts()
            report["student_history_coverage"] = {
                "group_column": group_column,
                "students": int(records_per_student.size),
                "students_with_multiple_records": int(
                    records_per_student.gt(1).sum()
                ),
                "maximum_records_per_student": int(records_per_student.max()),
            }
        if {"puntaje", "tasa_exito"}.issubset(data.columns):
            score = pd.to_numeric(data["puntaje"], errors="coerce")
            success = pd.to_numeric(data["tasa_exito"], errors="coerce")
            success = success.where(success.le(1), success / 100).clip(0, 1)
            valid = score.notna() & success.notna()
            if int(valid.sum()) >= 20:
                deterministic_score = score.loc[valid] * 0.5 + success.loc[valid] * 50
                try:
                    heuristic = pd.qcut(
                        deterministic_score,
                        q=3,
                        labels=list(self.TARGET_CLASSES),
                        duplicates="drop",
                    ).astype(str)
                    report["score_success_heuristic_agreement"] = float(
                        (heuristic.to_numpy() == target.loc[valid].to_numpy()).mean()
                    )
                except ValueError:
                    report["score_success_heuristic_agreement"] = None
        if "rendimiento_previo" in data:
            previous = (
                data["rendimiento_previo"]
                .astype("string")
                .str.strip()
                .str.lower()
            )
            valid = previous.isin(self.TARGET_CLASSES)
            report["previous_performance_rows"] = int(valid.sum())
            if valid.any():
                agreement = float(
                    (previous.loc[valid].to_numpy() == target.loc[valid].to_numpy()).mean()
                )
                report["previous_current_agreement"] = agreement
                if int(valid.sum()) >= 20 and agreement >= 0.98:
                    self.disabled_optional_features.add("rendimiento_previo")
                    report["previous_performance_disabled"] = True
                    warnings.warn(
                        "rendimiento_previo coincide casi exactamente con el target "
                        "actual; se excluyó por posible fuga de información.",
                        UserWarning,
                        stacklevel=2,
                    )
        return report

    def _validate_numeric_values(self, data: pd.DataFrame) -> None:
        invalid_negatives: dict[str, int] = {}
        for column in self.ALL_NUMERIC_COLUMNS:
            if column not in data:
                continue
            numeric = pd.to_numeric(data[column], errors="coerce")
            count = int(numeric.lt(0).sum())
            if count:
                invalid_negatives[column] = count
        if invalid_negatives:
            raise ValueError(
                "Las variables numéricas no pueden ser negativas: "
                f"{invalid_negatives}"
            )

    def _validate_training_target_counts(self, target: pd.Series) -> None:
        counts = target.value_counts().to_dict()
        missing = [
            label for label in self.TARGET_CLASSES if counts.get(label, 0) == 0
        ]
        if missing:
            raise ValueError(
                "No se pueden entrenar ambas etapas; faltan clases de rendimiento "
                f"{missing}. Conteos: {counts}"
            )
        scarce = {
            label: counts[label]
            for label in self.TARGET_CLASSES
            if counts[label] < 5
        }
        if scarce:
            raise ValueError(
                "No hay suficientes ejemplos para crear train, validación y test. "
                f"Se requieren al menos 5 por clase. Conteos insuficientes: {scarce}"
            )

    def _normalize_nivel_logico(self, values: pd.Series) -> pd.Series:
        normalized = values.astype("string").str.strip().str.lower()
        encoded = normalized.map(self.NIVEL_LOGICO_MAP)
        unknown_mask = encoded.isna()
        if unknown_mask.any():
            unknown = sorted(
                str(value) for value in normalized[unknown_mask].unique()
            )
            if self.unknown_category_strategy == "error":
                raise ValueError(
                    "nivel_logico contiene categorías desconocidas: "
                    f"{unknown}"
                )
            encoded = encoded.fillna(-1.0)
        return encoded.astype(float)

    def _normalize_previous_performance(
        self, values: pd.Series
    ) -> tuple[pd.Series, pd.Series]:
        normalized = values.astype("string").str.strip().str.lower()
        missing = values.isna() | normalized.eq("")
        encoded = normalized.map(self.NIVEL_LOGICO_MAP)
        unknown = encoded.isna() & ~missing
        if unknown.any() and self.unknown_category_strategy == "error":
            invalid = sorted(str(value) for value in normalized[unknown].unique())
            raise ValueError(
                "rendimiento_previo solo admite bajo, medio o alto. "
                f"Valores inválidos: {invalid}"
            )
        return encoded.fillna(-1.0).astype(float), missing.astype(float)

    def _prepare_features(self, data: pd.DataFrame, fit: bool) -> pd.DataFrame:
        self._validate_required_columns(data)
        frame = data.loc[:, list(self.REQUIRED_COLUMNS)].copy()
        for column in self.OPTIONAL_NUMERIC_COLUMNS:
            frame[column] = data[column] if column in data else np.nan
        for column in self.OPTIONAL_CATEGORICAL_COLUMNS:
            frame[column] = (
                data[column]
                if column in data and column not in self.disabled_optional_features
                else pd.NA
            )
        self._validate_numeric_values(frame)

        numeric_data = pd.DataFrame(index=frame.index)
        missing_counts: dict[str, int] = {}
        for column in self.ALL_NUMERIC_COLUMNS:
            numeric = pd.to_numeric(frame[column], errors="coerce")
            numeric = numeric.mask(~np.isfinite(numeric), np.nan)
            missing_count = int(numeric.isna().sum())
            missing_counts[column] = missing_count

            if fit:
                median = numeric.median(skipna=True)
                if pd.isna(median):
                    if column in self.NUMERIC_COLUMNS:
                        raise ValueError(
                            f"No se puede calcular una mediana para {column}."
                        )
                    median = 0.0
                self.numeric_medians[column] = float(median)
            elif not self.preprocessor_fitted:
                raise RuntimeError(
                    "El preprocesamiento debe ajustarse antes de transformar datos."
                )

            supplied = column in data and bool(frame[column].notna().any())
            if missing_count and supplied:
                if self.numeric_missing_strategy == "error":
                    raise ValueError(
                        f"{column} contiene {missing_count} valores no numéricos o nulos."
                    )
                warnings.warn(
                    f"Se imputaron {missing_count} valores de {column} con la mediana de train.",
                    UserWarning,
                    stacklevel=2,
                )
            numeric_data[column] = numeric.fillna(self.numeric_medians[column])

        if fit:
            self.preprocessor_fitted = True
            self.training_missing_report = missing_counts
            self.available_optional_features = {
                column: bool(frame[column].notna().any())
                for column in (
                    *self.OPTIONAL_NUMERIC_COLUMNS,
                    *self.OPTIONAL_CATEGORICAL_COLUMNS,
                )
            }

        features = pd.DataFrame(index=frame.index)
        features["nivel_logico"] = self._normalize_nivel_logico(
            frame["nivel_logico"]
        )
        for column in self.ALL_NUMERIC_COLUMNS:
            features[column] = numeric_data[column].astype(float)
        for column in self.OPTIONAL_NUMERIC_COLUMNS:
            features[f"{column}_faltante"] = frame[column].isna().astype(float)
        (
            features["rendimiento_previo_score"],
            features["rendimiento_previo_faltante"],
        ) = self._normalize_previous_performance(frame["rendimiento_previo"])
        return self._create_features(features).reset_index(drop=True)

    def _create_features(self, features: pd.DataFrame) -> pd.DataFrame:
        result = features.copy()
        attempts = result["intentos"]
        inactive = result["dias_inactivo"]
        interactions = result["interacciones_ia"]
        errors = result["errores"]
        help_requested = result["ayuda_solicitada"]

        result["ratio_ia"] = interactions / (attempts + 1.0)
        result["inactividad_relativa"] = inactive / (
            inactive + attempts + 1.0
        )
        result["engagement"] = interactions / (inactive + 1.0)
        result["consistencia"] = attempts / (inactive + 1.0)
        result["intensidad_total"] = interactions + attempts
        result["eficiencia"] = attempts / (interactions + 1.0)
        result["errores_por_intento"] = errors / (attempts + 1.0)
        result["ayuda_por_intento"] = help_requested / (attempts + 1.0)

        result = result.loc[:, self.feature_columns].replace(
            [np.inf, -np.inf], np.nan
        )
        if result.isna().any().any():
            columns = result.columns[result.isna().any()].tolist()
            raise ValueError(
                "El preprocessing generó valores no finitos en: "
                f"{columns}"
            )
        return result.astype(float)

    def _split_data(
        self,
        data: pd.DataFrame,
        target: pd.Series,
    ) -> dict[str, np.ndarray]:
        strategy, column = self._resolve_split_strategy(data)
        self.selected_split_strategy = strategy
        self.selected_split_column = column
        indices = np.arange(len(data))

        if strategy == "temporal":
            timestamps = pd.to_datetime(data[column], errors="coerce", utc=True)
            if timestamps.isna().any():
                raise ValueError(
                    f"La columna temporal {column} contiene fechas inválidas."
                )
            order = np.argsort(timestamps.to_numpy(), kind="stable")
            train_end = int(len(order) * (1 - self.test_size - self.validation_size))
            validation_end = int(len(order) * (1 - self.test_size))
            if train_end <= 0 or validation_end <= train_end or validation_end >= len(order):
                raise ValueError("No hay suficientes registros para el split temporal.")
            result = {
                "train": order[:train_end],
                "validation": order[train_end:validation_end],
                "test": order[validation_end:],
            }
            self._validate_temporal_order(timestamps, result)
            self._validate_group_overlap_if_present(data, result)
            return result

        if strategy == "group":
            groups = data[column].astype("string")
            if groups.isna().any() or groups.str.strip().eq("").any():
                raise ValueError(f"La columna de grupo {column} contiene IDs vacíos.")
            train_validation, test = self._best_group_holdout(
                indices, target, groups, self.test_size
            )
            validation_ratio = self.validation_size / (1 - self.test_size)
            train, validation = self._best_group_holdout(
                train_validation, target, groups, validation_ratio
            )
            result = {
                "train": train,
                "validation": validation,
                "test": test,
            }
            self._validate_group_overlap(data[column], result)
            return result

        warnings.warn(
            "No se encontró id_estudiante; no se pudo controlar fuga entre estudiantes.",
            UserWarning,
            stacklevel=2,
        )
        train_validation, test = train_test_split(
            indices,
            test_size=self.test_size,
            stratify=target,
            random_state=self.random_state,
        )
        validation_ratio = self.validation_size / (1 - self.test_size)
        train, validation = train_test_split(
            train_validation,
            test_size=validation_ratio,
            stratify=target.iloc[train_validation],
            random_state=self.random_state,
        )
        return {
            "train": np.asarray(train),
            "validation": np.asarray(validation),
            "test": np.asarray(test),
        }

    def _resolve_split_strategy(
        self, data: pd.DataFrame
    ) -> tuple[str, str | None]:
        if self.split_strategy == "auto":
            time_columns = [
                column for column in self.TIME_COLUMN_CANDIDATES if column in data
            ]
            if time_columns:
                return "temporal", time_columns[0]
            group_columns = [
                column for column in self.GROUP_COLUMN_CANDIDATES if column in data
            ]
            if group_columns:
                return "group", group_columns[0]
            return "stratified", None

        if self.split_strategy == "temporal":
            column = self.time_column
            if column is None:
                available = [
                    candidate
                    for candidate in self.TIME_COLUMN_CANDIDATES
                    if candidate in data
                ]
                column = available[0] if available else None
            if column is None or column not in data:
                raise ValueError(
                    "split_strategy='temporal' requiere una columna de fecha válida."
                )
            return "temporal", column

        if self.split_strategy == "group":
            column = self.group_column
            if column is None:
                available = [
                    candidate
                    for candidate in self.GROUP_COLUMN_CANDIDATES
                    if candidate in data
                ]
                column = available[0] if len(available) == 1 else None
            if column is None or column not in data:
                raise ValueError(
                    "split_strategy='group' requiere una columna de estudiante no ambigua."
                )
            return "group", column

        return "stratified", None

    def _best_group_holdout(
        self,
        indices: np.ndarray,
        target: pd.Series,
        groups: pd.Series,
        holdout_size: float,
    ) -> tuple[np.ndarray, np.ndarray]:
        subset_target = target.iloc[indices].reset_index(drop=True)
        subset_groups = groups.iloc[indices].reset_index(drop=True)
        expected = set(self.TARGET_CLASSES)
        overall = subset_target.value_counts(normalize=True)
        splitter = GroupShuffleSplit(
            n_splits=300,
            test_size=holdout_size,
            random_state=self.random_state,
        )
        candidates: list[tuple[float, np.ndarray, np.ndarray]] = []
        for train_relative, holdout_relative in splitter.split(
            indices, subset_target, subset_groups
        ):
            train_labels = subset_target.iloc[train_relative]
            holdout_labels = subset_target.iloc[holdout_relative]
            if set(train_labels) != expected or set(holdout_labels) != expected:
                continue
            actual_size = len(holdout_relative) / len(indices)
            holdout_distribution = holdout_labels.value_counts(normalize=True)
            distribution_error = sum(
                abs(holdout_distribution.get(label, 0.0) - overall.get(label, 0.0))
                for label in self.TARGET_CLASSES
            )
            objective = abs(actual_size - holdout_size) + distribution_error * 0.35
            candidates.append(
                (
                    objective,
                    indices[train_relative],
                    indices[holdout_relative],
                )
            )
        if not candidates:
            group_counts = (
                pd.DataFrame({"target": subset_target, "group": subset_groups})
                .groupby("target")["group"]
                .nunique()
                .to_dict()
            )
            raise ValueError(
                "No se pudo crear un split agrupado con las tres clases. "
                f"Grupos por clase: {group_counts}"
            )
        _, train, holdout = min(candidates, key=lambda item: item[0])
        return np.asarray(train), np.asarray(holdout)

    def _validate_split_classes(
        self,
        target: pd.Series,
        split_indices: dict[str, np.ndarray],
    ) -> None:
        expected = set(self.TARGET_CLASSES)
        for name, indices in split_indices.items():
            counts = target.iloc[indices].value_counts().to_dict()
            missing = sorted(expected - set(counts))
            if missing:
                raise ValueError(
                    f"La partición {name} no contiene todas las clases. "
                    f"Ausentes: {missing}. Conteos: {counts}"
                )

    def _validate_stage_classes(
        self,
        y_train: pd.Series,
        y_validation: pd.Series,
    ) -> None:
        for partition_name, labels in (
            ("entrenamiento", y_train),
            ("validación", y_validation),
        ):
            counts = labels.value_counts().to_dict()
            if counts.get("bajo", 0) == 0 or (
                counts.get("medio", 0) + counts.get("alto", 0)
            ) == 0:
                raise ValueError(
                    f"La etapa 1 no puede usar {partition_name}. Conteos: {counts}"
                )
            missing_stage2 = [
                label for label in ("medio", "alto") if counts.get(label, 0) == 0
            ]
            if missing_stage2:
                raise ValueError(
                    f"La etapa 2 no puede usar {partition_name}; faltan "
                    f"{missing_stage2}. Conteos: {counts}"
                )

    def _train_stage1(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        X_validation: pd.DataFrame,
        y_validation: pd.Series,
        tuned_params: dict[str, Any],
    ) -> XGBClassifier:
        y_binary_train = (y_train != "bajo").astype(int)
        y_binary_validation = (y_validation != "bajo").astype(int)
        scale = self._safe_scale_pos_weight(y_binary_train, "etapa 1")
        model, used = self._fit_xgb(
            X_train,
            y_binary_train,
            X_validation,
            y_binary_validation,
            scale,
            "stage1",
            tuned_params,
        )
        self.early_stopping_report["stage1"] = used
        return model

    def _train_stage2(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        X_validation: pd.DataFrame,
        y_validation: pd.Series,
        tuned_params: dict[str, Any],
    ) -> XGBClassifier:
        train_mask = y_train.isin(("medio", "alto"))
        validation_mask = y_validation.isin(("medio", "alto"))
        X_stage2_train = X_train.loc[train_mask.to_numpy()].reset_index(drop=True)
        X_stage2_validation = X_validation.loc[
            validation_mask.to_numpy()
        ].reset_index(drop=True)
        y_stage2_train = y_train.loc[train_mask].map(
            {"medio": 0, "alto": 1}
        ).astype(int).reset_index(drop=True)
        y_stage2_validation = y_validation.loc[validation_mask].map(
            {"medio": 0, "alto": 1}
        ).astype(int).reset_index(drop=True)
        scale = self._safe_scale_pos_weight(y_stage2_train, "etapa 2")
        model, used = self._fit_xgb(
            X_stage2_train,
            y_stage2_train,
            X_stage2_validation,
            y_stage2_validation,
            scale,
            "stage2",
            tuned_params,
        )
        self.early_stopping_report["stage2"] = used
        return model

    def _train_multiclass(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        X_validation: pd.DataFrame,
        y_validation: pd.Series,
        tuned_params: dict[str, Any],
    ) -> XGBClassifier:
        parameters = {
            "objective": "multi:softprob",
            "num_class": 3,
            "eval_metric": "mlogloss",
            "random_state": self.random_state,
            "n_jobs": -1,
            **tuned_params,
            **self.xgb_params,
        }
        model, used = self._fit_xgb_model(
            parameters,
            X_train,
            y_train.map(TARGET_TO_INT).astype(int),
            X_validation,
            y_validation.map(TARGET_TO_INT).astype(int),
            "multiclass",
        )
        self.early_stopping_report["multiclass"] = used
        return model

    def _fit_xgb(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        X_validation: pd.DataFrame,
        y_validation: pd.Series,
        scale_pos_weight: float,
        stage_name: str,
        tuned_params: dict[str, Any],
    ) -> tuple[XGBClassifier, dict[str, Any]]:
        parameters = {
            "objective": "binary:logistic",
            "n_estimators": 200,
            "max_depth": 3,
            "learning_rate": 0.05,
            "min_child_weight": 3,
            "subsample": 0.8,
            "colsample_bytree": 0.8,
            "reg_alpha": 0.1,
            "reg_lambda": 1.0,
            "scale_pos_weight": scale_pos_weight,
            "random_state": self.random_state,
            "eval_metric": "logloss",
            "n_jobs": -1,
        }
        parameters.update(tuned_params)
        parameters.update(self.xgb_params)
        return self._fit_xgb_model(
            parameters,
            X_train,
            y_train,
            X_validation,
            y_validation,
            stage_name,
        )

    def _fit_xgb_model(
        self,
        parameters: dict[str, Any],
        X_train: pd.DataFrame,
        y_train: pd.Series,
        X_validation: pd.DataFrame,
        y_validation: pd.Series,
        stage_name: str,
    ) -> tuple[XGBClassifier, dict[str, Any]]:
        fit_parameters: dict[str, Any] = {
            "eval_set": [(X_validation, y_validation)],
            "verbose": False,
        }
        early_stopping_location = "disabled"
        if self.early_stopping_rounds is not None:
            if "early_stopping_rounds" in inspect.signature(
                XGBClassifier.fit
            ).parameters:
                fit_parameters["early_stopping_rounds"] = self.early_stopping_rounds
                early_stopping_location = "fit"
            else:
                parameters["early_stopping_rounds"] = self.early_stopping_rounds
                early_stopping_location = "constructor"

        try:
            model = XGBClassifier(**parameters)
            model.fit(X_train, y_train, **fit_parameters)
            return model, {
                "used": self.early_stopping_rounds is not None,
                "location": early_stopping_location,
                "best_iteration": getattr(model, "best_iteration", None),
            }
        except (TypeError, ValueError) as exc:
            if "early_stopping" not in str(exc).lower():
                raise
            parameters.pop("early_stopping_rounds", None)
            fit_parameters.pop("early_stopping_rounds", None)
            model = XGBClassifier(**parameters)
            model.fit(X_train, y_train, **fit_parameters)
            warnings.warn(
                f"{stage_name}: la versión de XGBoost no admite early stopping "
                "con la API detectada; se entrenó sin él.",
                UserWarning,
                stacklevel=2,
            )
            return model, {
                "used": False,
                "location": "unsupported_fallback",
                "best_iteration": None,
            }

    def _safe_scale_pos_weight(self, labels: pd.Series, stage: str) -> float:
        counts = labels.value_counts().to_dict()
        negatives = int(counts.get(0, 0))
        positives = int(counts.get(1, 0))
        if negatives == 0 or positives == 0:
            raise ValueError(
                f"{stage} requiere ambas clases binarias. Conteos: {counts}"
            )
        return negatives / positives

    def _fit_probability_calibrators(
        self,
        y_train: pd.Series,
        hierarchical_oof: dict[str, Any],
        multiclass_oof: dict[str, Any],
    ) -> None:
        self.calibrator_stage1 = None
        self.calibrator_stage2 = None
        self.calibrator_multiclass = None
        if not self.calibrate_probabilities:
            self.calibration_report = {
                "enabled": False,
                "method": None,
                "source": None,
                "test_used": False,
                "validation_used": False,
            }
            return

        hierarchical_mask = np.asarray(hierarchical_oof["mask"], dtype=bool)
        multiclass_mask = np.asarray(multiclass_oof["mask"], dtype=bool)
        y_array = y_train.reset_index(drop=True)

        self.calibrator_stage1 = self._fit_binary_calibrator(
            np.asarray(hierarchical_oof["probability_low"])[hierarchical_mask],
            (y_array.loc[hierarchical_mask] == "bajo").astype(int),
        )
        stage2_mask = hierarchical_mask & y_array.isin(("medio", "alto")).to_numpy()
        self.calibrator_stage2 = self._fit_binary_calibrator(
            np.asarray(hierarchical_oof["probability_medium"])[stage2_mask],
            (y_array.loc[stage2_mask] == "medio").astype(int),
        )

        probabilities = np.asarray(multiclass_oof["probabilities"])[multiclass_mask]
        multiclass_target = y_array.loc[multiclass_mask].map(TARGET_TO_INT).astype(int)
        calibrator = LogisticRegression(
            max_iter=1000,
            random_state=self.random_state,
        )
        calibrator.fit(self._multiclass_log_features(probabilities), multiclass_target)
        self.calibrator_multiclass = calibrator
        self.calibration_report = {
            "enabled": True,
            "method": "logistic_out_of_fold",
            "hierarchical_rows": int(hierarchical_mask.sum()),
            "multiclass_rows": int(multiclass_mask.sum()),
            "source": "training_oof_predictions",
            "test_used": False,
            "validation_used": False,
        }

    def _fit_binary_calibrator(
        self, probabilities: np.ndarray, target: pd.Series
    ) -> LogisticRegression:
        if target.nunique() != 2:
            raise ValueError(
                "La calibración binaria requiere ambas clases en las predicciones OOF."
            )
        calibrator = LogisticRegression(
            max_iter=1000,
            random_state=self.random_state,
        )
        calibrator.fit(self._binary_log_features(probabilities), target)
        return calibrator

    @staticmethod
    def _binary_log_features(probabilities: np.ndarray) -> np.ndarray:
        clipped = np.clip(np.asarray(probabilities, dtype=float), 1e-6, 1 - 1e-6)
        return np.log(clipped / (1 - clipped)).reshape(-1, 1)

    @staticmethod
    def _multiclass_log_features(probabilities: np.ndarray) -> np.ndarray:
        clipped = np.clip(np.asarray(probabilities, dtype=float), 1e-6, 1.0)
        normalized = clipped / clipped.sum(axis=1, keepdims=True)
        return np.log(normalized)

    def _stage1_probability_low(
        self, X: pd.DataFrame, calibrated: bool | None = None
    ) -> np.ndarray:
        raw = self.model_stage1.predict_proba(X[self.selected_feature_columns])
        self._validate_probability_output(raw, "etapa 1")
        probability = raw[:, 0]
        if calibrated is None:
            calibrated = self.hierarchical_probability_mode == "calibrated"
        if calibrated and self.calibrator_stage1 is not None:
            probability = self.calibrator_stage1.predict_proba(
                self._binary_log_features(probability)
            )[:, 1]
        return probability

    def _stage2_probability_medium(
        self, X: pd.DataFrame, calibrated: bool | None = None
    ) -> np.ndarray:
        raw = self.model_stage2.predict_proba(X[self.selected_feature_columns])
        self._validate_probability_output(raw, "etapa 2")
        probability = raw[:, 0]
        if calibrated is None:
            calibrated = self.hierarchical_probability_mode == "calibrated"
        if calibrated and self.calibrator_stage2 is not None:
            probability = self.calibrator_stage2.predict_proba(
                self._binary_log_features(probability)
            )[:, 1]
        return probability

    def _multiclass_probabilities(
        self, X: pd.DataFrame, calibrated: bool | None = None
    ) -> np.ndarray:
        raw = self.model_multiclass.predict_proba(X[self.selected_feature_columns])
        if raw.ndim != 2 or raw.shape[1] != len(self.TARGET_CLASSES):
            raise ValueError("El modelo multiclase debe producir tres probabilidades.")
        if calibrated is None:
            calibrated = self.multiclass_probability_mode == "calibrated"
        if not calibrated or self.calibrator_multiclass is None:
            return raw
        calibrated = self.calibrator_multiclass.predict_proba(
            self._multiclass_log_features(raw)
        )
        ordered = np.zeros_like(raw, dtype=float)
        for output_index, class_id in enumerate(self.calibrator_multiclass.classes_):
            ordered[:, int(class_id)] = calibrated[:, output_index]
        return ordered

    def _select_architecture(
        self,
        X_validation: pd.DataFrame,
        y_validation: pd.Series,
    ) -> dict[str, Any]:
        hierarchical_predictions = self._labels_from_probabilities(
            self._stage1_probability_low(X_validation),
            self._stage2_probability_medium(X_validation),
            self.stage1_threshold,
            self.stage2_threshold,
        )
        multiclass_candidates: dict[str, dict[str, Any]] = {}
        modes = [False, True] if self.calibrator_multiclass is not None else [False]
        for calibrated in modes:
            mode = "calibrated" if calibrated else "raw"
            predictions = np.asarray(self.TARGET_CLASSES, dtype=object)[
                np.argmax(
                    self._multiclass_probabilities(
                        X_validation, calibrated=calibrated
                    ),
                    axis=1,
                )
            ]
            metrics = self._calculate_metrics(y_validation, predictions)
            multiclass_candidates[mode] = {
                "predictions": predictions,
                "metrics": metrics,
            }
        self.multiclass_probability_mode = max(
            multiclass_candidates,
            key=lambda mode: (
                multiclass_candidates[mode]["metrics"]["f1_macro"],
                multiclass_candidates[mode]["metrics"]["balanced_accuracy"],
                multiclass_candidates[mode]["metrics"]["accuracy"],
            ),
        )
        multiclass_predictions = multiclass_candidates[
            self.multiclass_probability_mode
        ]["predictions"]
        prediction_sets = {
            "hierarchical": hierarchical_predictions,
            "multiclass": multiclass_predictions,
        }
        comparison: dict[str, Any] = {}
        for name, predictions in prediction_sets.items():
            metrics = self._calculate_metrics(y_validation, predictions)
            comparison[name] = {
                key: metrics[key]
                for key in (
                    "accuracy",
                    "balanced_accuracy",
                    "precision_macro",
                    "recall_macro",
                    "f1_macro",
                )
            }
        self.selected_architecture = max(
            comparison,
            key=lambda name: (
                comparison[name]["f1_macro"],
                comparison[name]["balanced_accuracy"],
                comparison[name]["accuracy"],
            ),
        )
        self.model = (
            self.model_multiclass
            if self.selected_architecture == "multiclass"
            else self.model_stage1
        )
        self.calibration_report["selected_probability_modes"] = {
            "hierarchical": self.hierarchical_probability_mode,
            "multiclass": self.multiclass_probability_mode,
        }
        self.calibration_report["mode_selection_partition"] = "validation"
        return {
            "selection_partition": "validation",
            "selection_metric": "f1_macro_then_balanced_accuracy",
            "models": comparison,
            "selected": self.selected_architecture,
            "probability_modes": {
                "hierarchical": self.hierarchical_probability_mode,
                "multiclass": self.multiclass_probability_mode,
            },
            "test_used": False,
        }

    def _training_groups(
        self, data: pd.DataFrame, train_idx: np.ndarray
    ) -> pd.Series | None:
        if self.selected_split_strategy != "group" or self.selected_split_column is None:
            return None
        return data.iloc[train_idx][self.selected_split_column].reset_index(drop=True)

    def _search_feature_sets(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        groups: pd.Series | None,
    ) -> dict[str, Any]:
        feature_sets = {
            "core": list(self.CORE_FEATURE_COLUMNS),
            "extended": list(self.feature_columns),
        }
        selector = RIA03ModelSelector(
            random_state=self.random_state,
            search_iterations=self.search_iterations,
            cv_splits=self.cv_splits,
            fixed_params=self.xgb_params,
        )
        reports: dict[str, dict[str, Any]] = {}
        candidates: list[dict[str, Any]] = []
        for feature_set, columns in feature_sets.items():
            report = selector.search(
                X_train.loc[:, columns],
                y_train,
                groups,
                self.selected_split_strategy or "stratified",
            )
            reports[feature_set] = report
            for architecture, payload in report["best"].items():
                metrics = payload["metrics"]
                candidates.append({
                    "feature_set": feature_set,
                    "architecture": architecture,
                    "feature_count": len(columns),
                    "f1_macro": metrics["f1_macro"],
                    "f1_std": metrics["f1_std"],
                    "stability_adjusted_f1": metrics["f1_macro"] - metrics["f1_std"],
                    "balanced_accuracy": metrics["balanced_accuracy"],
                    "accuracy": metrics["accuracy"],
                })
        selected = max(
            candidates,
            key=lambda item: (
                item["stability_adjusted_f1"],
                item["f1_macro"],
                item["balanced_accuracy"],
                item["accuracy"],
                -item["feature_count"],
            ),
        )
        self.selected_feature_set = selected["feature_set"]
        self.selected_feature_columns = feature_sets[self.selected_feature_set]
        self.feature_set_comparison = {
            "selection_source": "training_grouped_cv",
            "selection_metric": "f1_macro_minus_fold_std",
            "candidates": candidates,
            "selected_feature_set": self.selected_feature_set,
            "selected_feature_columns": list(self.selected_feature_columns),
            "test_used": False,
            "validation_used": False,
        }
        self.feature_set_search_reports = reports
        return reports[self.selected_feature_set]

    def _search_summary(self) -> dict[str, Any]:
        best = self.model_search_report.get("best", {})
        return {
            "cv_strategy": self.model_search_report.get("cv_strategy"),
            "cv_splits": self.model_search_report.get("cv_splits"),
            "search_iterations": self.model_search_report.get("search_iterations"),
            "evaluated_models": self.model_search_report.get("evaluated_models"),
            "group_overlap_checked": self.model_search_report.get(
                "group_overlap_checked"
            ),
            "group_overlap": self.model_search_report.get("group_overlap"),
            "best": {
                name: {
                    "params": deepcopy(payload["params"]),
                    "metrics": deepcopy(payload["metrics"]),
                }
                for name, payload in best.items()
            },
            "feature_sets": deepcopy(self.feature_set_comparison),
            "test_used": False,
            "validation_used": False,
        }

    def _optimize_thresholds(
        self,
        X_validation: pd.DataFrame,
        y_validation: pd.Series,
    ) -> dict[str, Any]:
        candidates: list[dict[str, Any]] = []
        modes = [False, True] if self.calibrator_stage1 is not None else [False]
        for calibrated in modes:
            probability_mode = "calibrated" if calibrated else "raw"
            probability_low = self._stage1_probability_low(
                X_validation, calibrated=calibrated
            )
            probability_medium = self._stage2_probability_medium(
                X_validation, calibrated=calibrated
            )
            for stage1_threshold in self.threshold_grid:
                for stage2_threshold in self.threshold_grid:
                    predictions = self._labels_from_probabilities(
                        probability_low,
                        probability_medium,
                        float(stage1_threshold),
                        float(stage2_threshold),
                    )
                    candidates.append({
                        "probability_mode": probability_mode,
                        "stage1_threshold": float(stage1_threshold),
                        "stage2_threshold": float(stage2_threshold),
                        "f1_macro": float(
                            f1_score(
                                y_validation,
                                predictions,
                                labels=list(self.TARGET_CLASSES),
                                average="macro",
                                zero_division=0,
                            )
                        ),
                        "balanced_accuracy": float(
                            balanced_accuracy_score(y_validation, predictions)
                        ),
                        "accuracy": float(
                            accuracy_score(y_validation, predictions)
                        ),
                    })
        best = max(
            candidates,
            key=lambda item: (
                item["f1_macro"],
                item["balanced_accuracy"],
                item["accuracy"],
            ),
        )
        self.stage1_threshold = best["stage1_threshold"]
        self.stage2_threshold = best["stage2_threshold"]
        self.hierarchical_probability_mode = best["probability_mode"]
        self.best_threshold = self.stage2_threshold
        return {
            "metric": "f1_macro",
            "evaluated_combinations": len(candidates),
            "compared_probability_modes": sorted(
                {candidate["probability_mode"] for candidate in candidates}
            ),
            "best": deepcopy(best),
            "used_full_validation_flow": True,
            "test_used": False,
        }

    def _labels_from_probabilities(
        self,
        probability_low: np.ndarray,
        probability_medium: np.ndarray,
        stage1_threshold: float,
        stage2_threshold: float,
    ) -> np.ndarray:
        labels = np.full(len(probability_low), "alto", dtype=object)
        low_mask = probability_low >= stage1_threshold
        labels[low_mask] = "bajo"
        medium_mask = (~low_mask) & (
            probability_medium >= stage2_threshold
        )
        labels[medium_mask] = "medio"
        return labels

    def _calculate_metrics(
        self,
        y_true: pd.Series | np.ndarray,
        y_pred: pd.Series | np.ndarray,
    ) -> dict[str, Any]:
        labels = list(self.TARGET_CLASSES)
        return {
            "accuracy": float(accuracy_score(y_true, y_pred)),
            "balanced_accuracy": float(
                balanced_accuracy_score(y_true, y_pred)
            ),
            "precision_macro": float(
                precision_score(
                    y_true, y_pred, labels=labels, average="macro", zero_division=0
                )
            ),
            "recall_macro": float(
                recall_score(
                    y_true, y_pred, labels=labels, average="macro", zero_division=0
                )
            ),
            "f1_macro": float(
                f1_score(
                    y_true, y_pred, labels=labels, average="macro", zero_division=0
                )
            ),
            "precision_weighted": float(
                precision_score(
                    y_true,
                    y_pred,
                    labels=labels,
                    average="weighted",
                    zero_division=0,
                )
            ),
            "recall_weighted": float(
                recall_score(
                    y_true,
                    y_pred,
                    labels=labels,
                    average="weighted",
                    zero_division=0,
                )
            ),
            "f1_weighted": float(
                f1_score(
                    y_true,
                    y_pred,
                    labels=labels,
                    average="weighted",
                    zero_division=0,
                )
            ),
            "confusion_matrix": confusion_matrix(
                y_true, y_pred, labels=labels
            ).tolist(),
            "classification_report": classification_report(
                y_true,
                y_pred,
                labels=labels,
                target_names=labels,
                zero_division=0,
                output_dict=True,
            ),
        }

    def _store_final_metrics(self, metrics: dict[str, Any]) -> None:
        for key in (
            "accuracy",
            "balanced_accuracy",
            "precision_macro",
            "recall_macro",
            "f1_macro",
            "precision_weighted",
            "recall_weighted",
            "f1_weighted",
            "confusion_matrix",
            "classification_report",
        ):
            setattr(self, key, deepcopy(metrics[key]))
        self.precision = self.precision_weighted
        self.recall = self.recall_weighted
        self.f1 = self.f1_weighted

    def _build_split_report(
        self,
        data: pd.DataFrame,
        target: pd.Series,
        split_indices: dict[str, np.ndarray],
    ) -> None:
        report: dict[str, Any] = {
            "strategy": self.selected_split_strategy,
            "column": self.selected_split_column,
            "train_size": int(len(split_indices["train"])),
            "validation_size": int(len(split_indices["validation"])),
            "test_size": int(len(split_indices["test"])),
            "train_ratio": len(split_indices["train"]) / len(data),
            "validation_ratio": len(split_indices["validation"]) / len(data),
            "test_ratio": len(split_indices["test"]) / len(data),
            "class_distribution": {
                name: target.iloc[indices].value_counts().to_dict()
                for name, indices in split_indices.items()
            },
            "target_source": self.TARGET_SOURCE,
        }
        group_column = self._available_group_column(data)
        if group_column is not None:
            sets = {
                name: set(data.iloc[indices][group_column].astype(str))
                for name, indices in split_indices.items()
            }
            report["group_column"] = group_column
            report["group_overlap"] = {
                "train_validation": len(sets["train"] & sets["validation"]),
                "train_test": len(sets["train"] & sets["test"]),
                "validation_test": len(sets["validation"] & sets["test"]),
            }
        if self.selected_split_strategy == "temporal":
            timestamps = pd.to_datetime(
                data[self.selected_split_column], errors="coerce", utc=True
            )
            report["time_ranges"] = {
                name: {
                    "min": str(timestamps.iloc[indices].min()),
                    "max": str(timestamps.iloc[indices].max()),
                }
                for name, indices in split_indices.items()
            }
        self.split_report = report

    def _validate_group_overlap(
        self,
        groups: pd.Series,
        split_indices: dict[str, np.ndarray],
    ) -> None:
        sets = {
            name: set(groups.iloc[indices].astype(str))
            for name, indices in split_indices.items()
        }
        overlaps = {
            "train-validation": sets["train"] & sets["validation"],
            "train-test": sets["train"] & sets["test"],
            "validation-test": sets["validation"] & sets["test"],
        }
        non_empty = {
            name: sorted(values)[:5]
            for name, values in overlaps.items()
            if values
        }
        if non_empty:
            raise ValueError(
                "Se detectaron estudiantes compartidos entre particiones: "
                f"{non_empty}"
            )

    def _validate_group_overlap_if_present(
        self,
        data: pd.DataFrame,
        split_indices: dict[str, np.ndarray],
    ) -> None:
        group_column = self._available_group_column(data)
        if group_column is not None:
            self._validate_group_overlap(data[group_column], split_indices)

    def _available_group_column(self, data: pd.DataFrame) -> str | None:
        if self.group_column is not None and self.group_column in data:
            return self.group_column
        available = [
            column for column in self.GROUP_COLUMN_CANDIDATES if column in data
        ]
        return available[0] if len(available) == 1 else None

    def _validate_temporal_order(
        self,
        timestamps: pd.Series,
        split_indices: dict[str, np.ndarray],
    ) -> None:
        train_max = timestamps.iloc[split_indices["train"]].max()
        validation_min = timestamps.iloc[split_indices["validation"]].min()
        validation_max = timestamps.iloc[split_indices["validation"]].max()
        test_min = timestamps.iloc[split_indices["test"]].min()
        if train_max > validation_min or validation_max > test_min:
            raise ValueError("El split temporal no respeta el orden cronológico.")

    def _validate_probability_output(
        self, probabilities: np.ndarray, stage: str
    ) -> None:
        if probabilities.ndim != 2 or probabilities.shape[1] != 2:
            raise ValueError(
                f"{stage} debe producir probabilidades para dos clases."
            )

    def _check_fitted(self) -> None:
        if (
            not self.is_trained
            or not self.preprocessor_fitted
            or self.model_stage1 is None
            or self.model_stage2 is None
            or self.model_multiclass is None
            or self.model is None
        ):
            raise RuntimeError(
                "El modelo debe entrenarse antes de realizar predicciones"
            )

    def _reset_training_state(self) -> None:
        self.model: XGBClassifier | None = None
        self.model_stage1: XGBClassifier | None = None
        self.model_stage2: XGBClassifier | None = None
        self.model_multiclass: XGBClassifier | None = None
        self.calibrator_stage1: LogisticRegression | None = None
        self.calibrator_stage2: LogisticRegression | None = None
        self.calibrator_multiclass: LogisticRegression | None = None
        self.is_trained = False
        self.preprocessor_fitted = False
        self.numeric_medians: dict[str, float] = {}
        self.training_missing_report: dict[str, int] = {}
        self.available_optional_features: dict[str, bool] = {}
        self.disabled_optional_features: set[str] = set()
        self.selected_feature_set = "extended"
        self.selected_feature_columns = list(self.feature_columns)
        self.feature_set_comparison: dict[str, Any] = {}
        self.feature_set_search_reports: dict[str, dict[str, Any]] = {}
        self.preprocessor_fit_indices: list[int] = []
        self.stage1_threshold = 0.5
        self.stage2_threshold = 0.5
        self.best_threshold = 0.5
        self.hierarchical_probability_mode = "raw"
        self.multiclass_probability_mode = "raw"
        self.selected_split_strategy: str | None = None
        self.selected_split_column: str | None = None
        self.split_indices: dict[str, np.ndarray] = {}
        self.split_report: dict[str, Any] = {}
        self.threshold_selection_report: dict[str, Any] = {}
        self.model_search_report: dict[str, Any] = {}
        self.calibration_report: dict[str, Any] = {}
        self.architecture_comparison: dict[str, Any] = {}
        self.selected_architecture: str | None = None
        self.target_consistency_report: dict[str, Any] = {}
        self.early_stopping_report: dict[str, Any] = {}
        self.training_result: dict[str, Any] = {}
        self.accuracy: float | None = None
        self.balanced_accuracy: float | None = None
        self.precision: float | None = None
        self.recall: float | None = None
        self.f1: float | None = None
        self.precision_macro: float | None = None
        self.recall_macro: float | None = None
        self.f1_macro: float | None = None
        self.precision_weighted: float | None = None
        self.recall_weighted: float | None = None
        self.f1_weighted: float | None = None
        self.confusion_matrix: list[list[int]] = []
        self.classification_report: dict[str, Any] = {}

    def _validate_configuration(
        self,
        split_strategy: str,
        numeric_missing_strategy: str,
        unknown_category_strategy: str,
        test_size: float,
        validation_size: float,
        early_stopping_rounds: int | None,
    ) -> None:
        if split_strategy not in {"auto", "group", "temporal", "stratified"}:
            raise ValueError(
                "split_strategy debe ser auto, group, temporal o stratified."
            )
        if numeric_missing_strategy not in {"median", "error"}:
            raise ValueError(
                "numeric_missing_strategy debe ser median o error."
            )
        if unknown_category_strategy not in {"error", "unknown"}:
            raise ValueError(
                "unknown_category_strategy debe ser error o unknown."
            )
        if test_size <= 0 or validation_size <= 0:
            raise ValueError("test_size y validation_size deben ser mayores que cero.")
        if test_size + validation_size >= 0.6:
            raise ValueError(
                "Train debe conservar más del 40% de los registros."
            )
        if early_stopping_rounds is not None and early_stopping_rounds < 1:
            raise ValueError("early_stopping_rounds debe ser positivo o None.")

    @staticmethod
    def _as_dataframe(data: Any) -> pd.DataFrame:
        if isinstance(data, pd.DataFrame):
            return data.copy()
        if isinstance(data, dict):
            return pd.DataFrame([data])
        return pd.DataFrame(data)
