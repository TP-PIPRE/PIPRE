from __future__ import annotations

from copy import deepcopy
from typing import Any

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    f1_score,
)
from sklearn.model_selection import (
    ParameterSampler,
    StratifiedGroupKFold,
    StratifiedKFold,
    TimeSeriesSplit,
)
from xgboost import XGBClassifier


TARGET_CLASSES = ("bajo", "medio", "alto")
TARGET_TO_INT = {"bajo": 0, "medio": 1, "alto": 2}


class RIA03ModelSelector:
    """Compara XGBoost jerárquico y multiclase usando CV sobre train."""

    PARAMETER_SPACE = {
        "n_estimators": [120, 180, 240, 320],
        "max_depth": [2, 3, 4, 5],
        "learning_rate": [0.02, 0.04, 0.06, 0.09],
        "min_child_weight": [1, 3, 5, 8],
        "subsample": [0.70, 0.85, 1.0],
        "colsample_bytree": [0.65, 0.80, 1.0],
        "reg_alpha": [0.0, 0.1, 0.5, 1.0],
        "reg_lambda": [0.5, 1.0, 2.0, 5.0],
    }

    def __init__(
        self,
        random_state: int,
        search_iterations: int,
        cv_splits: int,
        fixed_params: dict[str, Any] | None = None,
    ) -> None:
        if search_iterations < 1:
            raise ValueError("search_iterations debe ser al menos 1.")
        if cv_splits < 2:
            raise ValueError("cv_splits debe ser al menos 2.")
        self.random_state = random_state
        self.search_iterations = search_iterations
        self.cv_splits = cv_splits
        self.fixed_params = dict(fixed_params or {})

    def search(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        groups: pd.Series | None,
        split_strategy: str,
    ) -> dict[str, Any]:
        folds, cv_name = self._build_folds(X, y, groups, split_strategy)
        candidates = list(
            ParameterSampler(
                self.PARAMETER_SPACE,
                n_iter=self.search_iterations,
                random_state=self.random_state,
            )
        )
        results: list[dict[str, Any]] = []
        best_payload: dict[str, dict[str, Any] | None] = {
            "hierarchical": None,
            "multiclass": None,
        }

        for candidate_index, candidate in enumerate(candidates):
            payload = self._evaluate_candidate(X, y, folds, candidate)
            for architecture in ("hierarchical", "multiclass"):
                metrics = payload[architecture]["metrics"]
                row = {
                    "architecture": architecture,
                    "candidate_index": candidate_index,
                    "params": deepcopy(candidate),
                    **metrics,
                }
                results.append(row)
                current = best_payload[architecture]
                if current is None or self._score_key(metrics) > self._score_key(
                    current["metrics"]
                ):
                    best_payload[architecture] = {
                        "params": deepcopy(candidate),
                        "metrics": deepcopy(metrics),
                        "oof": payload[architecture]["oof"],
                    }

        return {
            "cv_strategy": cv_name,
            "cv_splits": len(folds),
            "search_iterations": len(candidates),
            "evaluated_models": len(results),
            "group_overlap_checked": groups is not None,
            "group_overlap": 0 if groups is not None else None,
            "results": results,
            "best": best_payload,
            "test_used": False,
            "validation_used": False,
        }

    def _evaluate_candidate(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        folds: list[tuple[np.ndarray, np.ndarray]],
        params: dict[str, Any],
    ) -> dict[str, Any]:
        hierarchical_low = np.full(len(X), np.nan, dtype=float)
        hierarchical_medium = np.full(len(X), np.nan, dtype=float)
        multiclass_probabilities = np.full((len(X), 3), np.nan, dtype=float)
        validation_mask = np.zeros(len(X), dtype=bool)

        for fold_number, (train_idx, validation_idx) in enumerate(folds):
            X_train = X.iloc[train_idx]
            X_validation = X.iloc[validation_idx]
            y_train = y.iloc[train_idx].reset_index(drop=True)

            stage1_target = (y_train != "bajo").astype(int)
            stage1 = self._binary_model(
                params,
                self._scale_pos_weight(stage1_target),
                self.random_state + fold_number,
            )
            stage1.fit(X_train, stage1_target, verbose=False)
            hierarchical_low[validation_idx] = stage1.predict_proba(
                X_validation
            )[:, 0]

            stage2_mask = y_train.isin(("medio", "alto"))
            stage2_target = y_train.loc[stage2_mask].map(
                {"medio": 0, "alto": 1}
            ).astype(int)
            stage2 = self._binary_model(
                params,
                self._scale_pos_weight(stage2_target),
                self.random_state + 100 + fold_number,
            )
            stage2.fit(
                X_train.loc[stage2_mask.to_numpy()],
                stage2_target,
                verbose=False,
            )
            hierarchical_medium[validation_idx] = stage2.predict_proba(
                X_validation
            )[:, 0]

            multiclass = self._multiclass_model(
                params, self.random_state + 200 + fold_number
            )
            multiclass.fit(
                X_train,
                y_train.map(TARGET_TO_INT).astype(int),
                verbose=False,
            )
            multiclass_probabilities[validation_idx] = multiclass.predict_proba(
                X_validation
            )
            validation_mask[validation_idx] = True

        valid_idx = np.flatnonzero(validation_mask)
        y_valid = y.iloc[valid_idx].to_numpy()
        hierarchical_labels = self._hierarchical_labels(
            hierarchical_low[valid_idx], hierarchical_medium[valid_idx]
        )
        multiclass_labels = np.asarray(TARGET_CLASSES, dtype=object)[
            np.argmax(multiclass_probabilities[valid_idx], axis=1)
        ]
        hierarchical_fold_f1: list[float] = []
        multiclass_fold_f1: list[float] = []
        for _, validation_idx in folds:
            fold_target = y.iloc[validation_idx].to_numpy()
            hierarchical_fold_f1.append(
                f1_score(
                    fold_target,
                    self._hierarchical_labels(
                        hierarchical_low[validation_idx],
                        hierarchical_medium[validation_idx],
                    ),
                    labels=list(TARGET_CLASSES),
                    average="macro",
                    zero_division=0,
                )
            )
            multiclass_fold_f1.append(
                f1_score(
                    fold_target,
                    np.asarray(TARGET_CLASSES, dtype=object)[
                        np.argmax(
                            multiclass_probabilities[validation_idx], axis=1
                        )
                    ],
                    labels=list(TARGET_CLASSES),
                    average="macro",
                    zero_division=0,
                )
            )
        return {
            "hierarchical": {
                "metrics": self._metrics(
                    y_valid, hierarchical_labels, hierarchical_fold_f1
                ),
                "oof": {
                    "mask": validation_mask,
                    "probability_low": hierarchical_low,
                    "probability_medium": hierarchical_medium,
                },
            },
            "multiclass": {
                "metrics": self._metrics(
                    y_valid, multiclass_labels, multiclass_fold_f1
                ),
                "oof": {
                    "mask": validation_mask,
                    "probabilities": multiclass_probabilities,
                },
            },
        }

    def _build_folds(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        groups: pd.Series | None,
        split_strategy: str,
    ) -> tuple[list[tuple[np.ndarray, np.ndarray]], str]:
        min_rows = int(y.value_counts().min())
        if split_strategy == "temporal":
            n_splits = min(self.cv_splits, max(2, min_rows - 1))
            splitter = TimeSeriesSplit(n_splits=n_splits)
            folds = list(splitter.split(X))
            name = "TimeSeriesSplit"
        elif groups is not None:
            groups_per_class = (
                pd.DataFrame({"target": y, "group": groups})
                .groupby("target")["group"]
                .nunique()
            )
            n_splits = min(self.cv_splits, int(groups_per_class.min()), min_rows)
            if n_splits < 2:
                raise ValueError(
                    "No hay suficientes estudiantes por clase para CV agrupada. "
                    f"Grupos: {groups_per_class.to_dict()}"
                )
            splitter = StratifiedGroupKFold(
                n_splits=n_splits,
                shuffle=True,
                random_state=self.random_state,
            )
            folds = list(splitter.split(X, y, groups))
            name = "StratifiedGroupKFold"
        else:
            n_splits = min(self.cv_splits, min_rows)
            if n_splits < 2:
                raise ValueError("No hay suficientes registros por clase para CV.")
            splitter = StratifiedKFold(
                n_splits=n_splits,
                shuffle=True,
                random_state=self.random_state,
            )
            folds = list(splitter.split(X, y))
            name = "StratifiedKFold"

        expected = set(TARGET_CLASSES)
        valid_folds = []
        for train_idx, validation_idx in folds:
            if set(y.iloc[train_idx]) != expected or set(y.iloc[validation_idx]) != expected:
                continue
            if groups is not None:
                overlap = set(groups.iloc[train_idx]) & set(groups.iloc[validation_idx])
                if overlap:
                    raise ValueError("La CV agrupada comparte estudiantes.")
            valid_folds.append((np.asarray(train_idx), np.asarray(validation_idx)))
        if len(valid_folds) < 2:
            raise ValueError(
                "No se obtuvieron al menos dos folds con bajo, medio y alto."
            )
        return valid_folds, name

    def _binary_model(
        self,
        params: dict[str, Any],
        scale_pos_weight: float,
        random_state: int,
    ) -> XGBClassifier:
        config = self._base_config(params, random_state)
        config.update({
            "objective": "binary:logistic",
            "scale_pos_weight": scale_pos_weight,
            "eval_metric": "logloss",
        })
        return XGBClassifier(**config)

    def _multiclass_model(
        self, params: dict[str, Any], random_state: int
    ) -> XGBClassifier:
        config = self._base_config(params, random_state)
        config.update({
            "objective": "multi:softprob",
            "num_class": 3,
            "eval_metric": "mlogloss",
        })
        return XGBClassifier(**config)

    def _base_config(
        self, params: dict[str, Any], random_state: int
    ) -> dict[str, Any]:
        config = {
            **params,
            "random_state": random_state,
            "n_jobs": -1,
        }
        config.update(self.fixed_params)
        config.pop("early_stopping_rounds", None)
        return config

    @staticmethod
    def _scale_pos_weight(labels: pd.Series) -> float:
        counts = labels.value_counts().to_dict()
        negatives = int(counts.get(0, 0))
        positives = int(counts.get(1, 0))
        if negatives == 0 or positives == 0:
            raise ValueError(f"La etapa binaria requiere ambas clases: {counts}")
        return negatives / positives

    @staticmethod
    def _hierarchical_labels(
        probability_low: np.ndarray,
        probability_medium: np.ndarray,
    ) -> np.ndarray:
        labels = np.full(len(probability_low), "alto", dtype=object)
        low_mask = probability_low >= 0.5
        labels[low_mask] = "bajo"
        labels[(~low_mask) & (probability_medium >= 0.5)] = "medio"
        return labels

    @staticmethod
    def _metrics(
        y_true: np.ndarray,
        y_pred: np.ndarray,
        fold_f1: list[float],
    ) -> dict[str, float]:
        return {
            "f1_macro": float(
                f1_score(
                    y_true,
                    y_pred,
                    labels=list(TARGET_CLASSES),
                    average="macro",
                    zero_division=0,
                )
            ),
            "balanced_accuracy": float(
                balanced_accuracy_score(y_true, y_pred)
            ),
            "accuracy": float(accuracy_score(y_true, y_pred)),
            "f1_std": float(np.std(fold_f1)),
        }

    @staticmethod
    def _score_key(metrics: dict[str, float]) -> tuple[float, float, float, float]:
        return (
            metrics["f1_macro"],
            metrics["balanced_accuracy"],
            metrics["accuracy"],
            -metrics["f1_std"],
        )
