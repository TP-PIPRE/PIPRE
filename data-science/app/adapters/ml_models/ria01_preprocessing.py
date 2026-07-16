from __future__ import annotations

import unicodedata
from typing import Any

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin


NUMERIC_BASE_COLUMNS = ("errores", "intentos", "interacciones_ia")
MISSING_INDICATOR_COLUMNS = (
    "errores_faltante",
    "intentos_faltante",
    "interacciones_ia_faltante",
    "nivel_logico_faltante",
)
FULL_FEATURE_COLUMNS = (
    "intentos",
    "errores",
    "nivel_logico",
    "interacciones_ia",
    "ratio_error",
    "dependencia_ia",
    "ia_por_error",
    "tuvo_errores",
    "uso_ia",
    "nivel_x_error",
    *MISSING_INDICATOR_COLUMNS,
)
KNOWN_LOGICAL_LEVELS = {
    "bajo": 0.0,
    "low": 0.0,
    "basico": 0.0,
    "básico": 0.0,
    "0": 0.0,
    "medio": 1.0,
    "medium": 1.0,
    "intermedio": 1.0,
    "1": 1.0,
    "alto": 2.0,
    "high": 2.0,
    "avanzado": 2.0,
    "2": 2.0,
}


class RIA01FeatureEngineer(BaseEstimator, TransformerMixin):
    """Imputa y crea features; `fit` se ejecuta dentro de cada fold."""

    def fit(self, X: Any, y: Any = None) -> "RIA01FeatureEngineer":
        frame = self._as_dataframe(X)
        self.numeric_medians_: dict[str, float] = {}
        self.missing_counts_: dict[str, int] = {}
        self.negative_counts_: dict[str, int] = {}

        for column in NUMERIC_BASE_COLUMNS:
            numeric = pd.to_numeric(self._column_or_nan(frame, column), errors="coerce")
            negative = numeric.lt(0)
            cleaned = numeric.mask(negative)
            median = cleaned.median(skipna=True)
            self.numeric_medians_[column] = float(median) if pd.notna(median) else 0.0
            self.missing_counts_[column] = int(cleaned.isna().sum())
            self.negative_counts_[column] = int(negative.sum())

        logical = self._normalize_logical(self._column_or_nan(frame, "nivel_logico"))
        unknown = ~logical.isin(KNOWN_LOGICAL_LEVELS)
        self.missing_counts_["nivel_logico"] = int(unknown.sum())
        self.unknown_logical_values_ = (
            logical[unknown]
            .fillna("<null>")
            .replace("", "<empty>")
            .value_counts()
            .to_dict()
        )
        self.feature_names_out_ = np.asarray(FULL_FEATURE_COLUMNS, dtype=object)
        return self

    def transform(self, X: Any) -> pd.DataFrame:
        if not hasattr(self, "numeric_medians_"):
            raise ValueError("RIA01FeatureEngineer debe ajustarse antes de transformar.")
        frame = self._as_dataframe(X)
        data = pd.DataFrame(index=frame.index)

        for column in NUMERIC_BASE_COLUMNS:
            numeric = pd.to_numeric(self._column_or_nan(frame, column), errors="coerce")
            numeric = numeric.mask(numeric.lt(0))
            data[f"{column}_faltante"] = numeric.isna().astype(int)
            data[column] = numeric.fillna(self.numeric_medians_[column]).clip(lower=0)

        logical = self._normalize_logical(self._column_or_nan(frame, "nivel_logico"))
        encoded = logical.map(KNOWN_LOGICAL_LEVELS)
        data["nivel_logico_faltante"] = encoded.isna().astype(int)
        data["nivel_logico"] = encoded.fillna(-1).astype(float)

        attempts_safe = data["intentos"].clip(lower=1)
        errors_safe = data["errores"].clip(lower=1)
        data["ratio_error"] = data["errores"] / attempts_safe
        data["dependencia_ia"] = data["interacciones_ia"] / attempts_safe
        data["ia_por_error"] = data["interacciones_ia"] / errors_safe
        data["tuvo_errores"] = (data["errores"] > 0).astype(int)
        data["uso_ia"] = (data["interacciones_ia"] > 0).astype(int)
        data["nivel_x_error"] = np.where(
            data["nivel_logico"] >= 0,
            data["nivel_logico"] * data["ratio_error"],
            0,
        )
        data.replace([np.inf, -np.inf], np.nan, inplace=True)
        data[list(FULL_FEATURE_COLUMNS)] = (
            data[list(FULL_FEATURE_COLUMNS)]
            .apply(pd.to_numeric, errors="coerce")
            .fillna(0)
        )
        return data[list(FULL_FEATURE_COLUMNS)]

    def get_feature_names_out(self, input_features: Any = None) -> np.ndarray:
        return self.feature_names_out_.copy()

    @staticmethod
    def _normalize_logical(values: pd.Series) -> pd.Series:
        def normalize(value: Any) -> Any:
            if pd.isna(value):
                return pd.NA
            text = unicodedata.normalize("NFKD", str(value).strip().lower())
            return "".join(char for char in text if not unicodedata.combining(char))

        return values.map(normalize).astype("string")

    @staticmethod
    def _column_or_nan(frame: pd.DataFrame, column: str) -> pd.Series:
        if column in frame.columns:
            return frame[column]
        return pd.Series(np.nan, index=frame.index, dtype=float)

    @staticmethod
    def _as_dataframe(data: Any) -> pd.DataFrame:
        if isinstance(data, pd.DataFrame):
            return data.copy()
        if isinstance(data, dict):
            return pd.DataFrame([data])
        return pd.DataFrame(data)


class FeatureSubsetSelector(BaseEstimator, TransformerMixin):
    """Selecciona columnas engineered como hiperparametro del Pipeline."""

    def __init__(self, columns: tuple[str, ...] = FULL_FEATURE_COLUMNS) -> None:
        self.columns = columns

    def fit(self, X: Any, y: Any = None) -> "FeatureSubsetSelector":
        frame = self._as_dataframe(X)
        missing = [column for column in self.columns if column not in frame.columns]
        if missing:
            raise ValueError(f"Features no generadas por el preprocesador: {missing}")
        self.feature_names_out_ = np.asarray(self.columns, dtype=object)
        return self

    def transform(self, X: Any) -> pd.DataFrame:
        frame = self._as_dataframe(X)
        return frame.loc[:, list(self.columns)]

    def get_feature_names_out(self, input_features: Any = None) -> np.ndarray:
        return self.feature_names_out_.copy()

    @staticmethod
    def _as_dataframe(data: Any) -> pd.DataFrame:
        if isinstance(data, pd.DataFrame):
            return data
        return pd.DataFrame(data)
