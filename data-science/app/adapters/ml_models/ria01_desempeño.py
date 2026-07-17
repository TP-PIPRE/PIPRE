from __future__ import annotations

import warnings
import unicodedata
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import (
    ExtraTreesClassifier,
    HistGradientBoostingClassifier,
    RandomForestClassifier,
)
from sklearn.feature_selection import mutual_info_classif
from sklearn.inspection import permutation_importance
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    make_scorer,
    precision_score,
    recall_score,
)
from sklearn.model_selection import (
    GroupShuffleSplit,
    RandomizedSearchCV,
    StratifiedGroupKFold,
    StratifiedKFold,
    cross_validate,
    train_test_split,
)
from sklearn.pipeline import Pipeline
from sklearn.tree import DecisionTreeClassifier

from app.adapters.ml_support.ria01_preprocessing import (
    FULL_FEATURE_COLUMNS,
    KNOWN_LOGICAL_LEVELS,
    NUMERIC_BASE_COLUMNS,
    FeatureSubsetSelector,
    RIA01FeatureEngineer,
)


def _selection_scores(cv_results: dict[str, Any]) -> np.ndarray:
    validation_f1 = np.asarray(cv_results["mean_test_f1_macro"], dtype=float)
    training_f1 = np.asarray(cv_results["mean_train_f1_macro"], dtype=float)
    balanced = np.asarray(cv_results["mean_test_balanced_accuracy"], dtype=float)
    deviation = np.asarray(cv_results["std_test_f1_macro"], dtype=float)
    gap = training_f1 - validation_f1
    scores = (
        validation_f1
        + balanced * 0.05
        - np.maximum(gap - 0.10, 0) * 0.50
        - deviation * 0.25
    )
    return np.nan_to_num(scores, nan=-np.inf)


def _composite_refit_index(cv_results: dict[str, Any]) -> int:
    """Selecciona hiperparametros por F1, balance, estabilidad y sobreajuste."""
    return int(np.argmax(_selection_scores(cv_results)))


class ClasificadorDesempeno:
    """RIA-01 con modo de regla y modo predictivo claramente separados.

    `predict_rule` aplica una formula determinista cuando `puntaje` y
    `tasa_exito` ya existen; no es Machine Learning. `predict` usa un Pipeline
    predictivo que nunca recibe esas columnas. El Pipeline aprende imputacion,
    crea features y selecciona columnas dentro de cada fold.
    """

    BINARY_TARGET_TO_INT = {"bajo": 0, "adecuado": 1}
    BINARY_INT_TO_TARGET = {0: "bajo", 1: "adecuado"}
    MULTICLASS_TARGET_TO_INT = {"bajo": 0, "medio": 1, "alto": 2}
    MULTICLASS_INT_TO_TARGET = {0: "bajo", 1: "medio", 2: "alto"}
    TARGET_LABELS = ("bajo", "adecuado")
    INPUT_FEATURE_SCHEMA = (
        "intentos",
        "errores",
        "nivel_logico",
        "interacciones_ia",
    )
    GROUP_COLUMN_CANDIDATES = (
        "estudiante_id",
        "id_estudiante",
        "usuario_id",
        "student_id",
        "id_usuario",
    )
    SUCCESS_PROXY_FEATURES = {
        "errores",
        "ratio_error",
        "ia_por_error",
        "tuvo_errores",
        "nivel_x_error",
    }
    LOGICAL_LEVEL_FEATURES = {
        "nivel_logico",
        "nivel_x_error",
        "nivel_logico_faltante",
    }
    SEVERITY_ORDER = {"info": 0, "warning": 1, "high": 2, "critical": 3}

    def __init__(
        self,
        verbose: bool = False,
        group_column: str | None = None,
        search_iterations: int = 30,
        search_mode: str = "full",
        target_source: str = "rule",
        logical_level_source: str = "unknown",
        multiple_observations_per_student: bool | None = None,
        test_size: float = 0.2,
        invalid_row_policy: str = "warn",
        single_error_per_attempt: bool = False,
        leakage_policy: str = "warn",
        classification_mode: str = "binary",
        random_label_permutations: int = 20,
        minimum_stable_rows: int = 100,
    ) -> None:
        self._validate_configuration(
            search_mode,
            target_source,
            logical_level_source,
            invalid_row_policy,
            leakage_policy,
            classification_mode,
            search_iterations,
            test_size,
            random_label_permutations,
            minimum_stable_rows,
        )
        self.verbose = verbose
        self.group_column = group_column
        self.search_iterations = search_iterations
        self.search_mode = search_mode
        self.target_source = target_source
        self.logical_level_source = logical_level_source
        self.multiple_observations_per_student = multiple_observations_per_student
        self.test_size = test_size
        self.invalid_row_policy = invalid_row_policy
        self.single_error_per_attempt = single_error_per_attempt
        self.leakage_policy = leakage_policy
        self.classification_mode = classification_mode
        self.random_label_permutations = random_label_permutations
        self.minimum_stable_rows = minimum_stable_rows
        self.model_version = "ria01-v10.1-support-package"
        self.input_feature_schema = list(self.INPUT_FEATURE_SCHEMA)
        self._reset_training_state()

    @property
    def target_to_int(self) -> dict[str, int]:
        if self.classification_mode == "binary":
            return self.BINARY_TARGET_TO_INT
        return self.MULTICLASS_TARGET_TO_INT

    @property
    def int_to_target(self) -> dict[int, str]:
        if self.classification_mode == "binary":
            return self.BINARY_INT_TO_TARGET
        return self.MULTICLASS_INT_TO_TARGET

    @property
    def target_labels(self) -> list[str]:
        return [self.int_to_target[index] for index in sorted(self.int_to_target)]

    def construir_rendimiento(self, df: pd.DataFrame) -> pd.DataFrame:
        """Aplica la regla; no entrena ni ejecuta un modelo ML."""
        data = self._as_dataframe(df).copy()
        targets = self._build_rule_targets(data, record_report=False)
        target_column = f"rule_target_{self.classification_mode}"
        labels = targets[target_column]
        if not labels.isin(self.target_labels).all():
            raise ValueError("puntaje y tasa_exito deben existir y ser validos.")
        data["rendimiento"] = labels
        return data

    def preprocess_data(self, df: pd.DataFrame, is_training: bool = False) -> pd.DataFrame:
        """Transforma con el preprocesador final; no se usa para CV interna."""
        frame = self._model_input_frame(self._as_dataframe(df))
        if is_training:
            transformer = RIA01FeatureEngineer().fit(frame)
            return transformer.transform(frame)
        self._ensure_trained()
        transformer = self.pipeline.named_steps["features"]
        return transformer.transform(frame)

    def train(self, df: pd.DataFrame) -> None:
        """Selecciona Pipeline en train/CV y usa test una sola vez al final."""
        self._reset_training_state()
        data = self._prepare_training_data(df)
        target = data[f"target_{self.classification_mode}"]
        y = self._encode_target(target)
        self.class_distribution = target.value_counts().to_dict()

        groups = self._resolve_groups(data)
        self._record_dataset_size_report(data, y, groups)
        train_idx, test_idx = self._final_split_indices(y, groups)
        X_all = self._model_input_frame(data)
        X_train = X_all.iloc[train_idx].reset_index(drop=True)
        X_test = X_all.iloc[test_idx].reset_index(drop=True)
        y_train = y.iloc[train_idx].reset_index(drop=True)
        y_test = y.iloc[test_idx].reset_index(drop=True)
        data_train = data.iloc[train_idx].reset_index(drop=True)
        data_test = data.iloc[test_idx].reset_index(drop=True)
        groups_train = self._slice_groups(groups, train_idx)

        self._diagnose_leakage(data_train, y_train)
        feature_sets = self._eligible_feature_sets()
        cv = self._build_cv(y_train, groups_train)
        self._validate_cv_no_overlap(cv, X_train, y_train, groups_train)
        searches = self._run_joint_searches(
            X_train,
            y_train,
            cv,
            groups_train,
            feature_sets,
        )
        self._select_best_pipeline(searches)
        self._record_final_preprocessor_diagnostics(X_train, y_train)
        self._run_random_label_sanity(X_train, y_train, cv, groups_train)
        self._compare_classification_modes(data_train, X_train, groups_train, feature_sets)
        self._fit_baselines(X_train, y_train, X_test, y_test, data_test)

        y_pred = self.pipeline.predict(X_test)
        self._evaluate_final_test(y_test, y_pred)
        self._calculate_feature_importance(X_train, y_train, cv, groups_train)
        self._build_final_diagnosis()
        self.is_trained = True

        if self.verbose:
            self._print_training_summary()

    def predict(
        self,
        data: pd.DataFrame | dict[str, Any],
        mode: str = "predictive",
    ) -> str | list[str]:
        if mode == "rule":
            return self.predict_rule(data)
        if mode != "predictive":
            raise ValueError("mode debe ser 'predictive' o 'rule'.")
        self._ensure_trained()
        frame = self._model_input_frame(self._as_dataframe(data))
        encoded = self.pipeline.predict(frame)
        labels = self._decode_predictions(encoded)
        self.last_prediction_mode = "predictive"
        return labels[0] if len(labels) == 1 else labels

    def predict_rule(self, data: pd.DataFrame | dict[str, Any]) -> str | list[str]:
        frame = self._as_dataframe(data)
        targets = self._build_rule_targets(frame, record_report=False)
        labels = targets[f"rule_target_{self.classification_mode}"]
        if not labels.isin(self.target_labels).all():
            raise ValueError("El modo rule requiere puntaje y tasa_exito validos.")
        result = labels.tolist()
        self.last_prediction_mode = "rule"
        return result[0] if len(result) == 1 else result

    def predict_proba(
        self,
        data: pd.DataFrame | dict[str, Any],
    ) -> dict[str, float] | list[dict[str, float]]:
        self._ensure_trained()
        if not hasattr(self.pipeline, "predict_proba"):
            raise ValueError(f"{self.best_model_name} no implementa predict_proba.")
        frame = self._model_input_frame(self._as_dataframe(data))
        probabilities = self.pipeline.predict_proba(frame)
        classes = getattr(self.pipeline, "classes_", None)
        if classes is None:
            raise ValueError("El Pipeline no expone classes_.")
        known_codes = set(self.int_to_target)
        class_codes = [int(code) for code in classes]
        if not set(class_codes).issubset(known_codes):
            raise ValueError(f"El modelo contiene codigos de clase desconocidos: {classes}")

        results = []
        for row in probabilities:
            result = {label: 0.0 for label in self.target_labels}
            for code, probability in zip(class_codes, row):
                result[self.int_to_target[code]] = float(probability)
            results.append(result)
        return results[0] if len(results) == 1 else results

    def save_model(self, path: str | Path) -> None:
        joblib.dump(self, path)

    @classmethod
    def load_model(cls, path: str | Path) -> "ClasificadorDesempeno":
        model = joblib.load(path)
        if not isinstance(model, cls):
            raise TypeError(f"El archivo no contiene {cls.__name__}: {type(model)}")
        return model

    def _prepare_training_data(self, df: pd.DataFrame) -> pd.DataFrame:
        data = self._as_dataframe(df).copy().reset_index(drop=True)
        self.data_quality_report["initial_rows"] = int(len(data))
        rule_targets = self._build_rule_targets(data, record_report=True)
        for column, values in rule_targets.items():
            data[column] = values

        existing_binary = self._normalize_binary_labels(
            self._column_or_nan(data, "rendimiento")
        )
        existing_multiclass = self._normalize_multiclass_labels(
            self._column_or_nan(data, "rendimiento")
        )
        data["existing_target_binary"] = existing_binary
        data["existing_target_multiclass"] = existing_multiclass
        self._audit_existing_target(data)

        if self.target_source == "rule":
            if not rule_targets["rule_available"].any():
                raise ValueError(
                    "target_source='rule' requiere puntaje y tasa_exito validos."
                )
            data["target_binary"] = data["rule_target_binary"]
            data["target_multiclass"] = data["rule_target_multiclass"]
        else:
            if "rendimiento" not in data.columns:
                raise ValueError("target_source='existing' requiere rendimiento.")
            data["target_binary"] = existing_binary
            data["target_multiclass"] = existing_multiclass

        target_column = f"target_{self.classification_mode}"
        valid_target = data[target_column].isin(self.target_labels)
        invalid_relation = self._audit_feature_quality(data)
        if self.invalid_row_policy == "drop":
            valid_target &= ~invalid_relation
        elif self.invalid_row_policy == "error" and invalid_relation.any():
            raise ValueError(
                f"Hay {int(invalid_relation.sum())} filas con errores > intentos."
            )
        elif invalid_relation.any():
            self._add_warning(
                "ERRORS_GREATER_THAN_ATTEMPTS",
                "high",
                f"Se conservaron {int(invalid_relation.sum())} filas con errores > intentos.",
                ["errores", "intentos"],
            )

        dropped = int((~valid_target).sum())
        self.data_quality_report["target_or_policy_rows_dropped"] = dropped
        data = data.loc[valid_target].reset_index(drop=True)
        self.data_quality_report["training_rows_after_quality_policy"] = int(len(data))
        if data.empty or data[target_column].nunique() < 2:
            raise ValueError("El target necesita al menos dos clases con datos validos.")
        return data

    def _build_rule_targets(
        self,
        data: pd.DataFrame,
        record_report: bool,
    ) -> dict[str, pd.Series]:
        index = data.index
        unavailable = pd.Series(False, index=index)
        empty = pd.Series(np.nan, index=index, dtype=object)
        missing = [column for column in ("puntaje", "tasa_exito") if column not in data]
        if missing:
            if record_report:
                self.rule_availability_report = {
                    "available": False,
                    "reason": "puntaje o tasa_exito no disponibles",
                    "missing_columns": missing,
                }
            return {
                "rule_target_binary": empty,
                "rule_target_multiclass": empty.copy(),
                "rule_available": unavailable,
            }

        score = pd.to_numeric(data["puntaje"], errors="coerce")
        success = self._normalize_success_rate(
            data["tasa_exito"], record_report=record_report
        )
        valid = score.between(0, 100) & success.notna()
        composite = score * 0.5 + success * 100 * 0.5
        binary = pd.Series(
            np.where(composite < 67, "bajo", "adecuado"),
            index=index,
            dtype=object,
        ).where(valid)
        multiclass = pd.Series(
            np.select(
                [composite < 67, composite < 83],
                ["bajo", "medio"],
                default="alto",
            ),
            index=index,
            dtype=object,
        ).where(valid)
        if record_report:
            self.rule_availability_report = {
                "available": bool(valid.any()),
                "valid_rows": int(valid.sum()),
                "invalid_rows": int((~valid).sum()),
                "coverage": float(valid.mean()) if len(valid) else 0.0,
            }
        return {
            "rule_target_binary": binary,
            "rule_target_multiclass": multiclass,
            "rule_available": valid,
        }

    def _normalize_success_rate(
        self,
        values: pd.Series,
        record_report: bool = False,
    ) -> pd.Series:
        raw = pd.to_numeric(values, errors="coerce")
        unit = raw.between(0, 1)
        percent = raw.gt(1) & raw.le(100)
        invalid = raw.lt(0) | raw.gt(100) | raw.isna()
        normalized = raw.copy()
        normalized.loc[percent] = normalized.loc[percent] / 100
        normalized.loc[invalid] = np.nan
        normalized = normalized.clip(0, 1)
        if record_report:
            self.success_rate_scale_report = {
                "scale_0_1_count": int(unit.sum()),
                "scale_0_100_count": int(percent.sum()),
                "invalid_count": int(invalid.sum()),
                "mixed_scales": bool(unit.any() and percent.any()),
            }
            if unit.any() and percent.any():
                self._add_warning(
                    "MIXED_SUCCESS_RATE_SCALES",
                    "warning",
                    "tasa_exito mezcla escalas 0-1 y 0-100; se normalizo por fila.",
                    ["tasa_exito"],
                )
            if invalid.any():
                self._add_warning(
                    "INVALID_SUCCESS_RATE",
                    "high",
                    f"Hay {int(invalid.sum())} valores de tasa_exito nulos o fuera de rango.",
                    ["tasa_exito"],
                )
        return normalized

    def _audit_existing_target(self, data: pd.DataFrame) -> None:
        if "rendimiento" not in data.columns:
            self.data_quality_report["existing_target_audit"] = {
                "available": False,
                "reason": "rendimiento no disponible",
            }
            return
        existing = data["existing_target_binary"]
        rule = data["rule_target_binary"]
        comparable = existing.isin(self.BINARY_TARGET_TO_INT) & rule.isin(
            self.BINARY_TARGET_TO_INT
        )
        audit: dict[str, Any] = {
            "available": True,
            "comparable_rows": int(comparable.sum()),
        }
        if comparable.any():
            audit["agreement_with_rule"] = float(
                accuracy_score(existing[comparable], rule[comparable])
            )
        logical = self._column_or_nan(data, "nivel_logico")
        logical_valid = logical.notna() & existing.isin(self.BINARY_TARGET_TO_INT)
        audit["logical_level_cramers_v"] = (
            self._round_or_none(self._cramers_v(logical[logical_valid], existing[logical_valid]))
            if logical_valid.any()
            else None
        )
        self.data_quality_report["existing_target_audit"] = audit

    def _audit_feature_quality(self, data: pd.DataFrame) -> pd.Series:
        index = data.index
        missing: dict[str, int] = {}
        negative: dict[str, int] = {}
        for column in NUMERIC_BASE_COLUMNS:
            values = pd.to_numeric(self._column_or_nan(data, column), errors="coerce")
            missing[column] = int(values.isna().sum())
            negative[column] = int(values.lt(0).sum())
        logical = self._column_or_nan(data, "nivel_logico").astype("string").str.strip().str.lower()
        unknown = ~logical.isin(KNOWN_LOGICAL_LEVELS)
        missing["nivel_logico"] = int(unknown.sum())
        self.missing_value_report = missing
        self.data_quality_report["negative_values_by_column"] = negative
        self.unknown_logical_values = (
            logical[unknown]
            .fillna("<null>")
            .replace("", "<empty>")
            .value_counts()
            .to_dict()
        )
        if any(negative.values()):
            self._add_warning(
                "NEGATIVE_FEATURE_VALUES",
                "warning",
                "Los valores negativos se trataran como faltantes dentro de cada fold.",
                [column for column, count in negative.items() if count],
            )
        if len(data) and unknown.mean() >= 0.05:
            self._add_warning(
                "UNKNOWN_LOGICAL_LEVELS",
                "warning",
                "Mas del 5% de nivel_logico usa valores desconocidos; se codificaran como -1.",
                ["nivel_logico"],
            )

        errors = pd.to_numeric(self._column_or_nan(data, "errores"), errors="coerce")
        attempts = pd.to_numeric(self._column_or_nan(data, "intentos"), errors="coerce")
        relation_available = "errores" in data.columns and "intentos" in data.columns
        observed_relation = errors.notna() & attempts.notna() & errors.gt(attempts)
        invalid_relation = (
            observed_relation
            if self.single_error_per_attempt
            else pd.Series(False, index=index)
        )
        self.data_quality_report["errors_attempts_relation"] = {
            "available": relation_available,
            "error_semantics": (
                "single_error_per_attempt"
                if self.single_error_per_attempt
                else "multiple_error_events_per_attempt"
            ),
            "rows_with_errors_greater_than_attempts": int(observed_relation.sum()),
            "rows_invalid_under_current_semantics": int(invalid_relation.sum()),
            "policy": (
                self.invalid_row_policy
                if self.single_error_per_attempt
                else "not_applicable"
            ),
        }
        return invalid_relation

    def _diagnose_leakage(self, data_train: pd.DataFrame, y_train: pd.Series) -> None:
        required = {"tasa_exito", "errores", "intentos"}
        if required.issubset(data_train.columns):
            success = self._normalize_success_rate(data_train["tasa_exito"])
            errors = pd.to_numeric(self._column_or_nan(data_train, "errores"), errors="coerce")
            attempts = pd.to_numeric(self._column_or_nan(data_train, "intentos"), errors="coerce")
            reconstructed = 1 - errors / attempts.replace(0, np.nan)
            plausible = (
                success.notna()
                & reconstructed.notna()
                & reconstructed.between(0, 1)
            )
            correlation = self._safe_correlation(
                success[plausible], reconstructed[plausible]
            )
            mae = self._safe_mae(success[plausible], reconstructed[plausible])
            sufficient = int(plausible.sum()) >= 20
            confirmed = bool(
                self.single_error_per_attempt
                and sufficient
                and pd.notna(correlation)
                and abs(correlation) >= 0.95
                and mae <= 0.05
            )
            success_diagnostic = {
                "available": True,
                "plausible_rows": int(plausible.sum()),
                "evidence_sufficient": sufficient,
                "plausible_correlation": self._round_or_none(correlation),
                "plausible_mae": self._round_or_none(mae),
                "formula_semantically_valid": self.single_error_per_attempt,
                "confirmed_indirect_leakage": confirmed,
            }
            if not self.single_error_per_attempt:
                success_diagnostic["reason"] = (
                    "errores cuenta multiples eventos por intento; "
                    "1 - errores/intentos no representa tasa_exito"
                )
        else:
            missing = sorted(required - set(data_train.columns))
            confirmed = False
            success_diagnostic = {
                "available": False,
                "reason": "columnas insuficientes",
                "missing_columns": missing,
                "confirmed_indirect_leakage": False,
            }

        if "nivel_logico" in data_train.columns:
            logical = data_train["nivel_logico"].astype("string").str.strip().str.lower()
            decoded_target = pd.Series(self._decode_predictions(y_train), index=logical.index)
            cramers_v = self._cramers_v(logical, decoded_target)
            encoded_logical = logical.map(KNOWN_LOGICAL_LEVELS).fillna(-1)
            mutual_information = float(
                mutual_info_classif(
                    encoded_logical.to_numpy().reshape(-1, 1),
                    y_train,
                    discrete_features=True,
                    random_state=42,
                )[0]
            )
            logical_diagnostic = {
                "available": True,
                "declared_source": self.logical_level_source,
                "cramers_v_with_target": self._round_or_none(cramers_v),
                "mutual_information_with_target": self._round_or_none(mutual_information),
                "high_association": bool(cramers_v >= 0.80),
            }
        else:
            cramers_v = 0.0
            logical_diagnostic = {
                "available": False,
                "reason": "columnas insuficientes",
                "missing_columns": ["nivel_logico"],
                "declared_source": self.logical_level_source,
                "high_association": False,
            }

        self.forced_excluded_features = set()
        if confirmed:
            self.forced_excluded_features.update(self.SUCCESS_PROXY_FEATURES)
            self._add_warning(
                "CONFIRMED_SUCCESS_RATE_PROXY",
                "critical",
                "tasa_exito se reconstruye desde errores/intentos; se excluyeron proxies.",
                sorted(self.SUCCESS_PROXY_FEATURES),
            )

        logical_must_exclude = self.logical_level_source == "current_performance"
        if logical_must_exclude:
            self.forced_excluded_features.update(self.LOGICAL_LEVEL_FEATURES)
            self._add_warning(
                "CONFIRMED_LOGICAL_LEVEL_LEAKAGE",
                "critical",
                "nivel_logico fue declarado derivado del rendimiento actual y se excluyo.",
                sorted(self.LOGICAL_LEVEL_FEATURES),
            )
        elif logical_diagnostic["high_association"] and self.logical_level_source == "unknown":
            if self.leakage_policy == "error":
                raise ValueError(
                    "nivel_logico tiene asociacion alta y origen desconocido; documente su origen."
                )
            if self.leakage_policy == "exclude":
                self.forced_excluded_features.update(self.LOGICAL_LEVEL_FEATURES)
            self._add_warning(
                "POSSIBLE_LOGICAL_LEVEL_LEAKAGE",
                "high",
                "nivel_logico tiene asociacion alta con el target y origen desconocido.",
                sorted(self.LOGICAL_LEVEL_FEATURES),
            )

        self.leakage_diagnostics = {
            "success_rate_reconstruction": success_diagnostic,
            "logical_level": logical_diagnostic,
            "policy": self.leakage_policy,
            "forced_excluded_features": sorted(self.forced_excluded_features),
        }

    def _predefined_feature_sets(self) -> dict[str, tuple[str, ...]]:
        full = tuple(FULL_FEATURE_COLUMNS)
        without_success = tuple(
            column for column in full if column not in self.SUCCESS_PROXY_FEATURES
        )
        without_logical = tuple(
            column for column in full if column not in self.LOGICAL_LEVEL_FEATURES
        )
        conservative = tuple(
            column
            for column in full
            if column not in self.SUCCESS_PROXY_FEATURES | self.LOGICAL_LEVEL_FEATURES
        )
        base_only = tuple(
            column
            for column in full
            if column in {
                "intentos",
                "errores",
                "nivel_logico",
                "interacciones_ia",
                "errores_faltante",
                "intentos_faltante",
                "interacciones_ia_faltante",
                "nivel_logico_faltante",
            }
        )
        return {
            "full": full,
            "without_success_proxies": without_success,
            "without_logical_level": without_logical,
            "conservative": conservative,
            "base_only": base_only,
        }

    def _eligible_feature_sets(self) -> dict[str, tuple[str, ...]]:
        eligible: dict[str, tuple[str, ...]] = {}
        seen: set[tuple[str, ...]] = set()
        for name, columns in self._predefined_feature_sets().items():
            filtered = tuple(
                column for column in columns if column not in self.forced_excluded_features
            )
            if filtered and filtered not in seen:
                eligible[name] = filtered
                seen.add(filtered)
        if not eligible:
            raise ValueError("No quedan features elegibles despues de aplicar leakage_policy.")
        return eligible

    def _run_joint_searches(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        cv: StratifiedKFold | StratifiedGroupKFold,
        groups_train: pd.Series | None,
        feature_sets: dict[str, tuple[str, ...]],
    ) -> dict[str, RandomizedSearchCV]:
        models = {
            "random_forest": (
                RandomForestClassifier(random_state=42, n_jobs=-1),
                {
                    "model__n_estimators": [200, 300, 500, 700],
                    "model__criterion": ["gini", "entropy", "log_loss"],
                    "model__max_depth": [None, 5, 6, 8, 10, 12],
                    "model__min_samples_split": [2, 5, 10, 15],
                    "model__min_samples_leaf": [1, 2, 4, 6],
                    "model__max_features": ["sqrt", "log2", None],
                    "model__class_weight": [None, "balanced", "balanced_subsample"],
                    "model__bootstrap": [True, False],
                },
            ),
            "extra_trees": (
                ExtraTreesClassifier(random_state=42, n_jobs=-1),
                {
                    "model__n_estimators": [200, 300, 500, 700],
                    "model__criterion": ["gini", "entropy", "log_loss"],
                    "model__max_depth": [None, 5, 6, 8, 10, 12],
                    "model__min_samples_split": [2, 5, 10, 15],
                    "model__min_samples_leaf": [1, 2, 4, 6],
                    "model__max_features": ["sqrt", "log2", None],
                    "model__class_weight": [None, "balanced"],
                    "model__bootstrap": [True, False],
                },
            ),
            "hist_gradient_boosting": (
                HistGradientBoostingClassifier(random_state=42),
                {
                    "model__learning_rate": [0.02, 0.03, 0.05, 0.1],
                    "model__max_iter": [100, 200, 300, 500],
                    "model__max_leaf_nodes": [15, 31, 63],
                    "model__max_depth": [None, 4, 6, 8],
                    "model__min_samples_leaf": [10, 20, 30, 40],
                    "model__l2_regularization": [0.0, 0.01, 0.1, 1.0],
                    "model__class_weight": [None, "balanced"],
                },
            ),
        }
        columns_to_name = {columns: name for name, columns in feature_sets.items()}
        searches: dict[str, RandomizedSearchCV] = {}
        candidate_rows: list[dict[str, Any]] = []

        for model_name, (estimator, distributions) in models.items():
            pipeline = Pipeline([
                ("features", RIA01FeatureEngineer()),
                ("selector", FeatureSubsetSelector()),
                ("model", estimator),
            ])
            distributions = {
                "selector__columns": list(feature_sets.values()),
                **distributions,
            }
            search = RandomizedSearchCV(
                estimator=pipeline,
                param_distributions=distributions,
                n_iter=self.effective_search_iterations,
                scoring=self._scoring(),
                refit=_composite_refit_index,
                cv=cv,
                random_state=42,
                n_jobs=-1,
                return_train_score=True,
                error_score="raise",
            )
            fit_kwargs = {"groups": groups_train} if groups_train is not None else {}
            search.fit(X_train, y_train, **fit_kwargs)
            searches[model_name] = search
            scores = _selection_scores(search.cv_results_)
            for index, params in enumerate(search.cv_results_["params"]):
                columns = tuple(params["selector__columns"])
                train_f1 = float(search.cv_results_["mean_train_f1_macro"][index])
                validation_f1 = float(search.cv_results_["mean_test_f1_macro"][index])
                candidate_rows.append({
                    "modelo": model_name,
                    "feature_set": columns_to_name.get(columns, "custom"),
                    "candidate_index": index,
                    "f1_macro_train": train_f1,
                    "f1_macro_validation": validation_f1,
                    "brecha_train_validation": train_f1 - validation_f1,
                    "balanced_accuracy_validation": float(
                        search.cv_results_["mean_test_balanced_accuracy"][index]
                    ),
                    "accuracy_validation": float(
                        search.cv_results_["mean_test_accuracy"][index]
                    ),
                    "desviacion_f1": float(
                        search.cv_results_["std_test_f1_macro"][index]
                    ),
                    "selection_score": float(scores[index]),
                    "selected_within_model": index == search.best_index_,
                })

        self.joint_search_results = pd.DataFrame(candidate_rows).sort_values(
            "selection_score", ascending=False
        ).reset_index(drop=True)
        self.model_comparison = (
            self.joint_search_results[self.joint_search_results["selected_within_model"]]
            .sort_values("selection_score", ascending=False)
            .reset_index(drop=True)
        )
        self.feature_set_comparison = (
            self.joint_search_results
            .sort_values("selection_score", ascending=False)
            .drop_duplicates("feature_set")
            .sort_values("selection_score", ascending=False)
            .reset_index(drop=True)
        )
        return searches

    def _select_best_pipeline(self, searches: dict[str, RandomizedSearchCV]) -> None:
        best_row = self.model_comparison.iloc[0]
        best_name = str(best_row["modelo"])
        search = searches[best_name]
        self.pipeline = search.best_estimator_
        self.model = self.pipeline.named_steps["model"]
        self.best_model_name = best_name
        self.selected_feature_set = str(best_row["feature_set"])
        self.feature_columns = list(self.pipeline.named_steps["selector"].columns)
        self.best_params = {
            key: (list(value) if key == "selector__columns" else value)
            for key, value in search.best_params_.items()
        }
        self.best_cv_score = float(best_row["f1_macro_validation"])
        self.best_selection_score = float(best_row["selection_score"])
        self.removed_features = {
            column: (
                "excluded_by_leakage_policy"
                if column in self.forced_excluded_features
                else "not_selected_by_joint_cross_validation"
            )
            for column in FULL_FEATURE_COLUMNS
            if column not in self.feature_columns
        }
        self.cv_results = {
            name: result.cv_results_ for name, result in searches.items()
        }

    def _record_final_preprocessor_diagnostics(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
    ) -> None:
        transformer = self.pipeline.named_steps["features"]
        self.numeric_medians = dict(transformer.numeric_medians_)
        engineered = transformer.transform(X_train)
        variable = [
            column for column in engineered if engineered[column].nunique() > 1
        ]
        self.correlation_matrix = engineered[variable].corr(numeric_only=True)
        pairs = []
        for index, left in enumerate(variable):
            for right in variable[index + 1:]:
                value = self.correlation_matrix.loc[left, right]
                if pd.notna(value) and abs(value) >= 0.90:
                    pairs.append({
                        "feature_a": left,
                        "feature_b": right,
                        "correlation": round(float(value), 4),
                    })
        self.redundant_feature_pairs = pairs
        self.feature_target_correlations = {
            column: self._round_or_none(
                self._safe_correlation(engineered[column], y_train)
            )
            for column in engineered.columns
        }

    def _run_random_label_sanity(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        cv: StratifiedKFold | StratifiedGroupKFold,
        groups_train: pd.Series | None,
    ) -> None:
        sanity_pipeline = Pipeline([
            ("features", RIA01FeatureEngineer()),
            ("selector", FeatureSubsetSelector(tuple(self.feature_columns))),
            ("model", DecisionTreeClassifier(max_depth=4, min_samples_leaf=3, random_state=42)),
        ])
        actual = self._cross_validate_pipeline(
            sanity_pipeline, X_train, y_train, cv, groups_train
        )
        random_f1_scores = []
        random_balanced_scores = []
        for seed in range(self.random_label_permutations):
            shuffled = y_train.sample(frac=1, random_state=42 + seed).reset_index(drop=True)
            result = self._cross_validate_pipeline(
                sanity_pipeline, X_train, shuffled, cv, groups_train
            )
            random_f1_scores.append(result["f1_macro_validation"])
            random_balanced_scores.append(result["balanced_accuracy_validation"])

        mean_f1 = float(np.mean(random_f1_scores))
        mean_balanced = float(np.mean(random_balanced_scores))
        p95_f1 = float(np.percentile(random_f1_scores, 95))
        p95_balanced = float(np.percentile(random_balanced_scores, 95))
        consistent_high_random = mean_balanced >= 0.60 and p95_balanced >= 0.65
        self.random_label_sanity = {
            "n_permutations": self.random_label_permutations,
            "random_f1_scores": random_f1_scores,
            "random_balanced_accuracy_scores": random_balanced_scores,
            "mean_f1_macro": mean_f1,
            "std_f1_macro": float(np.std(random_f1_scores)),
            "percentile_95_f1_macro": p95_f1,
            "mean_balanced_accuracy": mean_balanced,
            "std_balanced_accuracy": float(np.std(random_balanced_scores)),
            "percentile_95_balanced_accuracy": p95_balanced,
            "real_f1_macro_same_estimator": actual["f1_macro_validation"],
            "real_balanced_accuracy_same_estimator": actual[
                "balanced_accuracy_validation"
            ],
            "passed": not consistent_high_random,
        }
        if consistent_high_random:
            message = "Las permutaciones aleatorias producen metricas consistentemente altas."
            if len(y_train) < self.minimum_stable_rows:
                self._add_warning(
                    "RANDOM_LABEL_SANITY_UNSTABLE",
                    "high",
                    message + " Dataset pequeño: se mantiene como advertencia.",
                    [],
                )
            else:
                raise RuntimeError(message + " Posible fuga o error de separacion.")

    def _compare_classification_modes(
        self,
        data_train: pd.DataFrame,
        X_train: pd.DataFrame,
        groups_train: pd.Series | None,
        feature_sets: dict[str, tuple[str, ...]],
    ) -> None:
        rows = []
        for mode, mapping in (
            ("binary", self.BINARY_TARGET_TO_INT),
            ("multiclass", self.MULTICLASS_TARGET_TO_INT),
        ):
            target = data_train[f"target_{mode}"]
            valid = target.isin(mapping)
            if target[valid].nunique() < len(mapping):
                rows.append({
                    "problem": mode,
                    "available": False,
                    "reason": "clases insuficientes",
                })
                continue
            X_mode = X_train.loc[valid].reset_index(drop=True)
            y_mode = target.loc[valid].map(mapping).astype(int).reset_index(drop=True)
            groups_mode = (
                groups_train.loc[valid].reset_index(drop=True)
                if groups_train is not None
                else None
            )
            cv_mode = self._build_cv(y_mode, groups_mode, record=False)
            self._validate_cv_no_overlap(
                cv_mode, X_mode, y_mode, groups_mode, record=False
            )
            mode_rows = []
            for feature_name, columns in feature_sets.items():
                pipeline = Pipeline([
                    ("features", RIA01FeatureEngineer()),
                    ("selector", FeatureSubsetSelector(columns)),
                    (
                        "model",
                        ExtraTreesClassifier(
                            n_estimators=150,
                            max_depth=8,
                            min_samples_leaf=2,
                            class_weight="balanced",
                            random_state=42,
                            n_jobs=-1,
                        ),
                    ),
                ])
                metrics = self._cross_validate_pipeline(
                    pipeline, X_mode, y_mode, cv_mode, groups_mode
                )
                mode_rows.append({
                    "problem": mode,
                    "available": True,
                    "feature_set": feature_name,
                    **metrics,
                })
            rows.extend(mode_rows)
        self.classification_mode_feature_comparison = pd.DataFrame(rows)
        available = self.classification_mode_feature_comparison[
            self.classification_mode_feature_comparison["available"] == True  # noqa: E712
        ]
        self.binary_multiclass_comparison = (
            available.sort_values(
                ["f1_macro_validation", "balanced_accuracy_validation"],
                ascending=False,
            )
            .drop_duplicates("problem")
            .reset_index(drop=True)
        )

    def _cross_validate_pipeline(
        self,
        pipeline: Pipeline,
        X: pd.DataFrame,
        y: pd.Series,
        cv: StratifiedKFold | StratifiedGroupKFold,
        groups: pd.Series | None,
    ) -> dict[str, float | bool]:
        kwargs = {"groups": groups} if groups is not None else {}
        result = cross_validate(
            pipeline,
            X,
            y,
            cv=cv,
            scoring=self._scoring(),
            return_train_score=True,
            n_jobs=-1,
            error_score="raise",
            **kwargs,
        )
        train_f1 = float(np.mean(result["train_f1_macro"]))
        validation_f1 = float(np.mean(result["test_f1_macro"]))
        return {
            "f1_macro_train": train_f1,
            "f1_macro_validation": validation_f1,
            "brecha_train_validation": train_f1 - validation_f1,
            "balanced_accuracy_validation": float(
                np.mean(result["test_balanced_accuracy"])
            ),
            "accuracy_validation": float(np.mean(result["test_accuracy"])),
            "desviacion_f1": float(np.std(result["test_f1_macro"])),
            "overfit_warning": bool(train_f1 - validation_f1 > 0.10),
        }

    def _fit_baselines(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        X_test: pd.DataFrame,
        y_test: pd.Series,
        data_test: pd.DataFrame,
    ) -> None:
        dummy = DummyClassifier(strategy="most_frequent", random_state=42)
        dummy.fit(X_train, y_train)
        dummy_pred = dummy.predict(X_test)
        self.baseline_accuracy = float(accuracy_score(y_test, dummy_pred))
        self.baseline_f1_macro = float(
            f1_score(y_test, dummy_pred, average="macro", zero_division=0)
        )

        rule_column = f"rule_target_{self.classification_mode}"
        rule_labels = data_test[rule_column]
        valid_rule = rule_labels.isin(self.target_to_int)
        comparable_rows = int(valid_rule.sum())
        if not comparable_rows:
            self.rule_baseline_metrics = {
                "available": False,
                "reason": "puntaje o tasa_exito no disponibles",
                "comparable_rows": 0,
                "total_test_rows": int(len(data_test)),
                "coverage": 0.0,
            }
            return
        rule_encoded = rule_labels[valid_rule].map(self.target_to_int).astype(int)
        comparable_y = y_test.loc[valid_rule].astype(int)
        self.rule_baseline_metrics = {
            "available": True,
            "comparable_rows": comparable_rows,
            "total_test_rows": int(len(data_test)),
            "coverage": comparable_rows / len(data_test),
            "accuracy": float(accuracy_score(comparable_y, rule_encoded)),
            "balanced_accuracy": float(
                balanced_accuracy_score(comparable_y, rule_encoded)
            ),
            "f1_macro": float(
                f1_score(comparable_y, rule_encoded, average="macro", zero_division=0)
            ),
            "note": (
                "La regla define el target y por eso es exacta."
                if self.target_source == "rule"
                else "Concordancia parcial entre regla y etiqueta externa."
            ),
        }

    def _final_split_indices(
        self,
        y: pd.Series,
        groups: pd.Series | None,
    ) -> tuple[np.ndarray, np.ndarray]:
        self._validate_min_class_count(y, 2, "separacion train/test")
        indices = np.arange(len(y))
        expected_classes = set(y)
        if groups is None:
            train_idx, test_idx = train_test_split(
                indices,
                test_size=self.test_size,
                stratify=y,
                random_state=42,
            )
            self.split_strategy = "train_test_split estratificado sin grupos"
            self._record_split_report(train_idx, test_idx, y, groups)
            return np.asarray(train_idx), np.asarray(test_idx)

        splitter = GroupShuffleSplit(
            n_splits=500,
            test_size=self.test_size,
            random_state=42,
        )
        overall_distribution = y.value_counts(normalize=True)
        total_groups = groups.nunique()
        candidates = []
        for train_idx, test_idx in splitter.split(indices, y, groups):
            if set(y.iloc[train_idx]) != expected_classes:
                continue
            if set(y.iloc[test_idx]) != expected_classes:
                continue
            train_groups = set(groups.iloc[train_idx])
            test_groups = set(groups.iloc[test_idx])
            if not train_groups.isdisjoint(test_groups):
                continue
            record_ratio = len(test_idx) / len(y)
            group_ratio = len(test_groups) / total_groups
            test_distribution = y.iloc[test_idx].value_counts(normalize=True)
            class_error = sum(
                abs(test_distribution.get(label, 0) - proportion)
                for label, proportion in overall_distribution.items()
            )
            objective = (
                abs(record_ratio - self.test_size)
                + abs(group_ratio - self.test_size) * 0.5
                + class_error * 0.25
            )
            candidates.append((objective, train_idx, test_idx))
        if not candidates:
            raise ValueError(
                "No se encontro una particion agrupada con todas las clases en train y test."
            )
        _, train_idx, test_idx = min(candidates, key=lambda candidate: candidate[0])
        self.split_strategy = "GroupShuffleSplit: mejor de 500 particiones"
        self._record_split_report(train_idx, test_idx, y, groups)
        return np.asarray(train_idx), np.asarray(test_idx)

    def _record_split_report(
        self,
        train_idx: np.ndarray,
        test_idx: np.ndarray,
        y: pd.Series,
        groups: pd.Series | None,
    ) -> None:
        actual_ratio = len(test_idx) / len(y)
        difference = abs(actual_ratio - self.test_size)
        overlap: set[str] = set()
        train_students = test_students = None
        if groups is not None:
            train_set = set(groups.iloc[train_idx].astype(str))
            test_set = set(groups.iloc[test_idx].astype(str))
            overlap = train_set & test_set
            train_students = len(train_set)
            test_students = len(test_set)
        if overlap:
            raise ValueError("La particion final comparte estudiantes.")
        expected = set(y)
        if set(y.iloc[train_idx]) != expected or set(y.iloc[test_idx]) != expected:
            raise ValueError("Train o test no contiene todas las clases.")
        self.split_report = {
            "requested_test_ratio": self.test_size,
            "actual_test_ratio": round(actual_ratio, 4),
            "difference": round(difference, 4),
            "train_records": int(len(train_idx)),
            "test_records": int(len(test_idx)),
            "train_students": train_students,
            "test_students": test_students,
            "group_overlap_count": len(overlap),
            "all_classes_in_train": True,
            "all_classes_in_test": True,
            "train_class_distribution": self._decoded_distribution(y.iloc[train_idx]),
            "test_class_distribution": self._decoded_distribution(y.iloc[test_idx]),
            "group_column": self.selected_group_column,
        }
        if difference > 0.05:
            self._add_warning(
                "TEST_SIZE_APPROXIMATION",
                "high",
                "Tras 500 particiones, el test difiere mas de cinco puntos del solicitado.",
                [self.selected_group_column] if self.selected_group_column else [],
            )

    def _resolve_groups(self, data: pd.DataFrame) -> pd.Series | None:
        if self.group_column is not None:
            if self.group_column not in data.columns:
                raise ValueError(f"group_column no existe: {self.group_column}")
            selected = self.group_column
        else:
            candidates = [
                column for column in self.GROUP_COLUMN_CANDIDATES if column in data.columns
            ]
            if len(candidates) > 1:
                raise ValueError(
                    f"Existen varias columnas de grupo posibles {candidates}; configure group_column."
                )
            selected = candidates[0] if candidates else None

        if selected is None:
            duplicate_columns = [
                column for column in self.INPUT_FEATURE_SCHEMA if column in data.columns
            ]
            if duplicate_columns:
                possible_repeats = int(data.duplicated(subset=duplicate_columns).sum())
                detection_available = True
            else:
                possible_repeats = 0
                detection_available = False
            self.data_quality_report["repeat_detection_without_group"] = {
                "available": detection_available,
                "possible_repeated_rows": possible_repeats,
            }
            if self.multiple_observations_per_student is True or possible_repeats:
                raise ValueError(
                    "No se encontro identificador para posibles observaciones repetidas; "
                    "configure group_column."
                )
            self.selected_group_column = None
            return None

        groups = data[selected]
        if groups.isna().any() or groups.astype(str).str.strip().eq("").any():
            raise ValueError(f"{selected} contiene IDs vacios.")
        repeated = bool(groups.duplicated().any())
        auto_detected = self.group_column is None
        if repeated and auto_detected and self.multiple_observations_per_student is not True:
            raise ValueError(
                f"{selected} contiene varias observaciones; configure group_column "
                "o multiple_observations_per_student=True."
            )
        self.selected_group_column = selected
        self.data_quality_report["group_column"] = selected
        self.data_quality_report["group_auto_detected"] = auto_detected
        self.data_quality_report["unique_groups"] = int(groups.nunique())
        self.data_quality_report["repeated_group_rows"] = int(groups.duplicated().sum())
        return groups.astype(str).reset_index(drop=True)

    def _record_dataset_size_report(
        self,
        data: pd.DataFrame,
        y: pd.Series,
        groups: pd.Series | None,
    ) -> None:
        recommended_folds = self._safe_n_splits(y, 5, groups)
        if groups is not None:
            groups_per_class = (
                pd.DataFrame({"target": y, "group": groups})
                .groupby("target")["group"]
                .nunique()
                .to_dict()
            )
            unique_students = int(groups.nunique())
        else:
            groups_per_class = None
            unique_students = None
        self.dataset_size_report = {
            "total_rows": int(len(data)),
            "rows_per_class": self._decoded_distribution(y),
            "unique_students": unique_students,
            "groups_per_class": groups_per_class,
            "recommended_folds": recommended_folds,
            "metrics_may_be_unstable": len(data) < self.minimum_stable_rows,
        }
        base_iterations = min(self.search_iterations, 8) if self.search_mode == "quick" else self.search_iterations
        self.effective_search_iterations = base_iterations
        if len(data) < self.minimum_stable_rows:
            self.effective_search_iterations = min(base_iterations, 8)
            self._add_warning(
                "SMALL_DATASET",
                "high",
                "Dataset pequeño: se activo busqueda rapida y las metricas pueden ser inestables.",
                [],
            )

    def _build_cv(
        self,
        y: pd.Series,
        groups: pd.Series | None,
        record: bool = True,
    ) -> StratifiedKFold | StratifiedGroupKFold:
        n_splits = self._safe_n_splits(y, 5, groups)
        if record:
            self.data_quality_report["cv_n_splits"] = n_splits
        if groups is not None:
            return StratifiedGroupKFold(
                n_splits=n_splits,
                shuffle=True,
                random_state=42,
            )
        return StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)

    def _safe_n_splits(
        self,
        y: pd.Series,
        requested: int,
        groups: pd.Series | None,
    ) -> int:
        row_limit = int(y.value_counts().min())
        if groups is None:
            limit = row_limit
        else:
            group_counts = (
                pd.DataFrame({"target": y.reset_index(drop=True), "group": groups.reset_index(drop=True)})
                .groupby("target")["group"]
                .nunique()
            )
            limit = min(row_limit, int(group_counts.min()))
        n_splits = min(requested, limit)
        if n_splits < 2:
            raise ValueError(
                f"No hay suficientes filas o grupos por clase para CV. Limite: {limit}."
            )
        return n_splits

    def _validate_cv_no_overlap(
        self,
        cv: StratifiedKFold | StratifiedGroupKFold,
        X: pd.DataFrame,
        y: pd.Series,
        groups: pd.Series | None,
        record: bool = True,
    ) -> None:
        report = []
        expected = set(y)
        for fold, (train_idx, validation_idx) in enumerate(
            cv.split(X, y, groups if groups is not None else None), start=1
        ):
            overlap_count = 0
            if groups is not None:
                overlap_count = len(
                    set(groups.iloc[train_idx]) & set(groups.iloc[validation_idx])
                )
                if overlap_count:
                    raise ValueError(f"El fold {fold} comparte estudiantes.")
            if set(y.iloc[train_idx]) != expected or set(y.iloc[validation_idx]) != expected:
                raise ValueError(f"El fold {fold} no contiene todas las clases.")
            report.append({
                "fold": fold,
                "train_records": int(len(train_idx)),
                "validation_records": int(len(validation_idx)),
                "group_overlap_count": overlap_count,
                "all_classes_present": True,
            })
        if record:
            self.cv_overlap_report = report

    def _calculate_feature_importance(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        cv: StratifiedKFold | StratifiedGroupKFold,
        groups_train: pd.Series | None,
    ) -> None:
        if hasattr(self.model, "feature_importances_"):
            self.native_feature_importance = pd.DataFrame({
                "variable": self.feature_columns,
                "importancia": self.model.feature_importances_,
            }).sort_values("importancia", ascending=False).reset_index(drop=True)
        else:
            self.native_feature_importance = pd.DataFrame(
                columns=["variable", "importancia"]
            )

        fold_importances = []
        for fold, (train_idx, validation_idx) in enumerate(
            cv.split(X_train, y_train, groups_train if groups_train is not None else None),
            start=1,
        ):
            pipeline = clone(self.pipeline)
            pipeline.fit(X_train.iloc[train_idx], y_train.iloc[train_idx])
            engineered = pipeline.named_steps["features"].transform(
                X_train.iloc[validation_idx]
            )
            selected = pipeline.named_steps["selector"].transform(engineered)
            estimator = pipeline.named_steps["model"]
            result = permutation_importance(
                estimator,
                selected,
                y_train.iloc[validation_idx],
                scoring=make_scorer(f1_score, average="macro", zero_division=0),
                n_repeats=5,
                random_state=42 + fold,
                n_jobs=-1,
            )
            fold_importances.append(result.importances)
        stacked = np.concatenate(fold_importances, axis=1)
        self.permutation_feature_importance = pd.DataFrame({
            "variable": self.feature_columns,
            "importancia_promedio": stacked.mean(axis=1),
            "desviacion": stacked.std(axis=1),
            "folds_evaluados": len(fold_importances),
            "evaluation_source": "cross_validation_only",
        }).sort_values("importancia_promedio", ascending=False).reset_index(drop=True)

    def _evaluate_final_test(self, y_test: pd.Series, y_pred: np.ndarray) -> None:
        labels = sorted(self.int_to_target)
        class_names = [self.int_to_target[label] for label in labels]
        self.accuracy = float(accuracy_score(y_test, y_pred))
        self.balanced_accuracy = float(balanced_accuracy_score(y_test, y_pred))
        self.precision_macro = float(
            precision_score(y_test, y_pred, average="macro", zero_division=0)
        )
        self.recall_macro = float(
            recall_score(y_test, y_pred, average="macro", zero_division=0)
        )
        self.f1_macro = float(f1_score(y_test, y_pred, average="macro", zero_division=0))
        self.precision_weighted = float(
            precision_score(y_test, y_pred, average="weighted", zero_division=0)
        )
        self.recall_weighted = float(
            recall_score(y_test, y_pred, average="weighted", zero_division=0)
        )
        self.f1_weighted = float(
            f1_score(y_test, y_pred, average="weighted", zero_division=0)
        )
        self.precision = self.precision_weighted
        self.recall = self.recall_weighted
        self.f1 = self.f1_weighted
        matrix = confusion_matrix(y_test, y_pred, labels=labels)
        self.confusion_matrix = matrix.tolist()
        self.classification_report = classification_report(
            y_test,
            y_pred,
            labels=labels,
            target_names=class_names,
            zero_division=0,
            output_dict=True,
        )
        self._calculate_false_negatives_by_class(matrix, class_names)

    def _calculate_false_negatives_by_class(
        self,
        matrix: np.ndarray,
        class_names: list[str],
    ) -> None:
        for index, class_name in enumerate(class_names):
            support = int(matrix[index].sum())
            true_positive = int(matrix[index, index])
            false_negative = support - true_positive
            self.recall_por_clase[class_name] = (
                true_positive / support if support else 0.0
            )
            self.falsos_negativos_por_clase[class_name] = false_negative
            self.tasa_falsos_negativos_por_clase[class_name] = (
                false_negative / support if support else 0.0
            )

    def _build_final_diagnosis(self) -> None:
        warnings_sorted = sorted(
            self.training_warnings,
            key=lambda item: self.SEVERITY_ORDER[item["severity"]],
            reverse=True,
        )
        likely_limitations = []
        if self.f1_macro is not None and self.f1_macro < 0.75:
            likely_limitations.append("limited_signal_without_score_and_success_rate")
        counts = list(self.class_distribution.values())
        if counts and min(counts) / max(counts) < 0.5:
            likely_limitations.append("class_imbalance")
        if self.data_quality_report.get("errors_attempts_relation", {}).get(
            "rows_invalid_under_current_semantics", 0
        ):
            likely_limitations.append("inconsistent_errors_attempts_semantics")
        self.final_diagnosis = {
            "classification_mode": self.classification_mode,
            "target_source": self.target_source,
            "predictive_metrics_name": "early_estimation_without_score_or_success_rate",
            "accuracy_test": self.accuracy,
            "balanced_accuracy_test": self.balanced_accuracy,
            "f1_macro_test": self.f1_macro,
            "dummy_baseline_accuracy": self.baseline_accuracy,
            "dummy_baseline_f1_macro": self.baseline_f1_macro,
            "rule_baseline": self.rule_baseline_metrics,
            "selected_model": self.best_model_name,
            "selected_feature_set": self.selected_feature_set,
            "selection_score_used_for_refit": self.best_selection_score,
            "random_label_sanity": self.random_label_sanity,
            "warnings": warnings_sorted,
            "likely_limitations": likely_limitations,
            "test_usage_restriction": (
                "El test se uso una sola vez despues de fijar features, modelo e hiperparametros. "
                "No debe reutilizarse para nuevas decisiones; cualquier ajuste posterior requiere otro test."
            ),
            "recommendation": (
                "Use predict_rule con resultados finales conocidos y predict solo para estimacion temprana."
            ),
        }

    def _scoring(self) -> dict[str, Any]:
        return {
            "accuracy": make_scorer(accuracy_score),
            "balanced_accuracy": make_scorer(balanced_accuracy_score),
            "precision_macro": make_scorer(
                precision_score, average="macro", zero_division=0
            ),
            "recall_macro": make_scorer(
                recall_score, average="macro", zero_division=0
            ),
            "f1_macro": make_scorer(f1_score, average="macro", zero_division=0),
        }

    def _encode_target(self, labels: pd.Series) -> pd.Series:
        encoded = labels.map(self.target_to_int)
        if encoded.isna().any():
            unknown = labels[encoded.isna()].unique().tolist()
            raise ValueError(f"Etiquetas desconocidas: {unknown}")
        return encoded.astype(int).reset_index(drop=True)

    def _decode_predictions(self, encoded: Any) -> list[str]:
        result = []
        for value in np.asarray(encoded).tolist():
            code = int(value)
            if code not in self.int_to_target:
                raise ValueError(f"Codigo de clase desconocido: {code}")
            result.append(self.int_to_target[code])
        return result

    def _normalize_binary_labels(self, values: pd.Series) -> pd.Series:
        return self._normalize_text_series(values).replace({
            "desempeño bajo": "bajo",
            "desempeno bajo": "bajo",
            "low": "bajo",
            "desempeño medio": "adecuado",
            "desempeno medio": "adecuado",
            "medio": "adecuado",
            "medium": "adecuado",
            "desempeño alto": "adecuado",
            "desempeno alto": "adecuado",
            "alto": "adecuado",
            "high": "adecuado",
            "desempeño adecuado": "adecuado",
            "desempeno adecuado": "adecuado",
            "adequate": "adecuado",
        })

    def _normalize_multiclass_labels(self, values: pd.Series) -> pd.Series:
        return self._normalize_text_series(values).replace({
            "desempeño bajo": "bajo",
            "desempeno bajo": "bajo",
            "low": "bajo",
            "desempeño medio": "medio",
            "desempeno medio": "medio",
            "medium": "medio",
            "desempeño alto": "alto",
            "desempeno alto": "alto",
            "high": "alto",
        })

    def _normalize_text_series(self, values: pd.Series) -> pd.Series:
        def normalize(value: Any) -> Any:
            if pd.isna(value):
                return pd.NA
            text = unicodedata.normalize("NFKD", str(value).strip().lower())
            return "".join(char for char in text if not unicodedata.combining(char))

        return values.map(normalize).astype("string")

    def _model_input_frame(self, data: pd.DataFrame) -> pd.DataFrame:
        columns = [column for column in self.INPUT_FEATURE_SCHEMA if column in data]
        return data.loc[:, columns].copy() if columns else pd.DataFrame(index=data.index)

    def _decoded_distribution(self, encoded: pd.Series) -> dict[str, int]:
        return {
            self.int_to_target[int(code)]: int(count)
            for code, count in encoded.value_counts().items()
        }

    def _validate_min_class_count(
        self,
        y: pd.Series,
        minimum: int,
        context: str,
    ) -> None:
        counts = y.value_counts()
        if counts.empty or counts.min() < minimum:
            raise ValueError(
                f"No hay suficientes registros por clase para {context}: {counts.to_dict()}"
            )

    def _slice_groups(
        self,
        groups: pd.Series | None,
        indices: np.ndarray,
    ) -> pd.Series | None:
        return None if groups is None else groups.iloc[indices].reset_index(drop=True)

    def _column_or_nan(self, data: pd.DataFrame, column: str) -> pd.Series:
        if column in data.columns:
            return data[column]
        return pd.Series(np.nan, index=data.index, dtype=float)

    def _safe_correlation(self, left: pd.Series, right: pd.Series) -> float:
        if len(left) < 2 or left.nunique() < 2 or right.nunique() < 2:
            return float("nan")
        return float(left.corr(right))

    def _safe_mae(self, left: pd.Series, right: pd.Series) -> float:
        return float("nan") if left.empty else float((left - right).abs().mean())

    def _cramers_v(self, left: pd.Series, right: pd.Series) -> float:
        table = pd.crosstab(left, right)
        if table.empty or table.shape[0] < 2 or table.shape[1] < 2:
            return 0.0
        observed = table.to_numpy(dtype=float)
        total = observed.sum()
        expected = observed.sum(axis=1, keepdims=True) @ observed.sum(
            axis=0, keepdims=True
        ) / total
        chi_square = np.divide(
            (observed - expected) ** 2,
            expected,
            out=np.zeros_like(observed),
            where=expected != 0,
        ).sum()
        denominator = min(table.shape[0] - 1, table.shape[1] - 1)
        return float(np.sqrt((chi_square / total) / denominator)) if denominator else 0.0

    def _round_or_none(self, value: float, digits: int = 4) -> float | None:
        return None if pd.isna(value) else round(float(value), digits)

    def _add_warning(
        self,
        code: str,
        severity: str,
        message: str,
        affected_columns: list[str],
    ) -> None:
        warning = {
            "code": code,
            "severity": severity,
            "message": message,
            "affected_columns": affected_columns,
        }
        if warning not in self.training_warnings:
            self.training_warnings.append(warning)
            warnings.warn(f"[{code}] {message}", UserWarning, stacklevel=2)

    def _reset_training_state(self) -> None:
        self.pipeline: Pipeline | None = None
        self.model: Any | None = None
        self.is_trained = False
        self.last_prediction_mode: str | None = None
        self.selected_group_column: str | None = None
        self.feature_columns = list(FULL_FEATURE_COLUMNS)
        self.selected_feature_set = "full"
        self.forced_excluded_features: set[str] = set()
        self.numeric_medians: dict[str, float] = {}
        self.best_model_name: str | None = None
        self.best_params: dict[str, Any] = {}
        self.best_cv_score: float | None = None
        self.best_selection_score: float | None = None
        self.effective_search_iterations = 0
        self.cv_results: dict[str, Any] = {}
        self.joint_search_results = pd.DataFrame()
        self.model_comparison = pd.DataFrame()
        self.feature_set_comparison = pd.DataFrame()
        self.classification_mode_feature_comparison = pd.DataFrame()
        self.binary_multiclass_comparison = pd.DataFrame()
        self.correlation_matrix = pd.DataFrame()
        self.native_feature_importance = pd.DataFrame()
        self.permutation_feature_importance = pd.DataFrame()
        self.leakage_diagnostics: dict[str, Any] = {}
        self.data_quality_report: dict[str, Any] = {}
        self.dataset_size_report: dict[str, Any] = {}
        self.rule_availability_report: dict[str, Any] = {}
        self.success_rate_scale_report: dict[str, Any] = {}
        self.missing_value_report: dict[str, int] = {}
        self.unknown_logical_values: dict[str, int] = {}
        self.feature_target_correlations: dict[str, float | None] = {}
        self.redundant_feature_pairs: list[dict[str, Any]] = []
        self.removed_features: dict[str, str] = {}
        self.split_report: dict[str, Any] = {}
        self.cv_overlap_report: list[dict[str, Any]] = []
        self.random_label_sanity: dict[str, Any] = {}
        self.rule_baseline_metrics: dict[str, Any] = {}
        self.final_diagnosis: dict[str, Any] = {}
        self.training_warnings: list[dict[str, Any]] = []
        self.class_distribution: dict[str, int] = {}
        self.split_strategy = ""
        self.baseline_accuracy: float | None = None
        self.baseline_f1_macro: float | None = None
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
        self.recall_por_clase: dict[str, float] = {}
        self.falsos_negativos_por_clase: dict[str, int] = {}
        self.tasa_falsos_negativos_por_clase: dict[str, float] = {}

    def _ensure_trained(self) -> None:
        if not self.is_trained or self.pipeline is None or self.model is None:
            raise ValueError("El modelo debe entrenarse antes de predecir.")

    def _as_dataframe(self, data: Any) -> pd.DataFrame:
        if isinstance(data, pd.DataFrame):
            return data
        if isinstance(data, dict):
            return pd.DataFrame([data])
        return pd.DataFrame(data)

    def _validate_configuration(
        self,
        search_mode: str,
        target_source: str,
        logical_level_source: str,
        invalid_row_policy: str,
        leakage_policy: str,
        classification_mode: str,
        search_iterations: int,
        test_size: float,
        random_label_permutations: int,
        minimum_stable_rows: int,
    ) -> None:
        allowed = {
            "search_mode": (search_mode, {"quick", "full"}),
            "target_source": (target_source, {"rule", "existing"}),
            "logical_level_source": (
                logical_level_source,
                {"unknown", "independent", "current_performance"},
            ),
            "invalid_row_policy": (invalid_row_policy, {"warn", "drop", "error"}),
            "leakage_policy": (leakage_policy, {"warn", "exclude", "error"}),
            "classification_mode": (classification_mode, {"binary", "multiclass"}),
        }
        for name, (value, choices) in allowed.items():
            if value not in choices:
                raise ValueError(f"{name} debe ser uno de {sorted(choices)}.")
        if search_iterations < 1:
            raise ValueError("search_iterations debe ser al menos 1.")
        if not 0.1 <= test_size <= 0.4:
            raise ValueError("test_size debe estar entre 0.1 y 0.4.")
        if random_label_permutations < 2:
            raise ValueError("random_label_permutations debe ser al menos 2.")
        if minimum_stable_rows < 10:
            raise ValueError("minimum_stable_rows debe ser al menos 10.")

    def _print_training_summary(self) -> None:
        print("Modo:", self.classification_mode, "Target:", self.target_source)
        print("Calidad:", self.data_quality_report)
        print("Fuga:", self.leakage_diagnostics)
        print("Split:", self.split_report)
        print("Busqueda conjunta:")
        print(self.model_comparison)
        print("Sanidad aleatoria:", self.random_label_sanity)
        print("Binario/multiclase:")
        print(self.binary_multiclass_comparison)
        print("Test:", {
            "accuracy": self.accuracy,
            "balanced_accuracy": self.balanced_accuracy,
            "f1_macro": self.f1_macro,
            "confusion_matrix": self.confusion_matrix,
        })
        print("Diagnostico final:", self.final_diagnosis)
