"""RIA07: detección de riesgo y anomalías (renumerado desde RIA07)."""

from __future__ import annotations

import warnings
from typing import Any, Iterable

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import RobustScaler


class DetectorRiesgoAnomalias:
    """Detecta rareza y estima señales educativas adversas actuales.

    No requiere una secuencia temporal individual, pero sí una cohorte de
    referencia para ajustar ``RobustScaler``, entrenar ``IsolationForest`` y
    calcular percentiles y umbrales. ``risk_score`` y ``anomaly_score`` son
    índices de 0 a 100, no probabilidades. Una observación rara no implica por
    sí sola riesgo educativo y los resultados requieren validación experta
    antes de utilizarse para decisiones importantes.
    """

    CONFIG_VERSION = "ria07-risk-config-v3"
    DEFAULT_MIN_TRAINING_SAMPLES = 20
    SMALL_REFERENCE_COHORT = 50
    DEFAULT_ANOMALY_WEIGHT = 0.15
    DEFAULT_MIN_ADVERSE_SCORE_FOR_BOOST = 35.0
    DEFAULT_RISK_THRESHOLDS = {"medium": 60.0, "high": 80.0}
    MAX_REASONS = 3
    MIN_REASON_PERCENTILE = 75.0

    SCORE_MIN = 0.0
    SCORE_MAX = 100.0
    SUCCESS_RATE_MIN = 0.0
    SUCCESS_RATE_MAX = 1.0

    ABSOLUTE_REASON_LIMITS = {
        "high_inactivity": 3.0,
        "high_error_ratio": 0.50,
        "low_score": 60.0,
        "low_success_rate": 0.60,
        "low_completed_activities": 2.0,
        "high_help_dependency": 0.50,
        "high_attempts": 8.0,
    }

    REQUIRED_COLUMNS = (
        "intentos",
        "errores",
        "puntaje",
        "dias_inactivo",
        "actividades_completadas",
        "ayuda_solicitada",
    )
    COUNT_COLUMNS = (
        "intentos",
        "errores",
        "dias_inactivo",
        "actividades_completadas",
        "ayuda_solicitada",
    )
    NUMERIC_COLUMNS = (*REQUIRED_COLUMNS, "tasa_exito")

    RISK_LEVELS = {
        "low": "Normal",
        "medium": "Atencion",
        "high": "Critico",
    }
    RECOMMENDATIONS = {
        "low": "Sin accion inmediata; mantener el seguimiento habitual.",
        "medium": "Revisar el progreso en la proxima actividad y ofrecer apoyo preventivo.",
        "high": "Contactar al estudiante y asignar una actividad de refuerzo guiado.",
    }
    DEFAULT_RISK_WEIGHTS = {
        "dias_inactivo": {"direction": "high", "weight": 0.26},
        "errores_por_intento": {"direction": "high", "weight": 0.22},
        "puntaje": {"direction": "low", "weight": 0.16},
        "tasa_exito": {"direction": "low", "weight": 0.12},
        "actividades_completadas": {"direction": "low", "weight": 0.10},
        "ayuda_por_intento": {"direction": "high", "weight": 0.07},
        "intentos": {"direction": "high", "weight": 0.07},
    }

    def __init__(
        self,
        contamination: float = 0.10,
        min_training_samples: int = DEFAULT_MIN_TRAINING_SAMPLES,
        risk_thresholds: dict[str, float] | None = None,
        anomaly_weight: float = DEFAULT_ANOMALY_WEIGHT,
        min_adverse_score_for_boost: float = DEFAULT_MIN_ADVERSE_SCORE_FOR_BOOST,
        random_state: int = 42,
    ) -> None:
        self.contamination = self._validate_contamination(contamination)
        self.min_training_samples = self._validate_min_training_samples(
            min_training_samples
        )
        self.risk_thresholds = self._validate_risk_thresholds(
            risk_thresholds or self.DEFAULT_RISK_THRESHOLDS
        )
        self.anomaly_weight = self._validate_fraction(
            anomaly_weight,
            "anomaly_weight",
            allow_zero=True,
        )
        self.min_adverse_score_for_boost = self._validate_score_threshold(
            min_adverse_score_for_boost,
            "min_adverse_score_for_boost",
        )
        self.random_state = int(random_state)
        self.configuration_version = self.CONFIG_VERSION

        self.input_feature_columns = [*self.REQUIRED_COLUMNS, "tasa_exito"]
        self.feature_columns = [
            *self.input_feature_columns,
            "errores_por_intento",
            "ayuda_por_intento",
            "brecha_rendimiento",
        ]
        # Se excluyen errores y ayuda absolutos del IsolationForest porque sus
        # razones ya están representadas por los cocientes. Permanecen en
        # ``feature_columns`` para validación, evidencia y explicabilidad.
        self.model_feature_columns = [
            "intentos",
            "puntaje",
            "tasa_exito",
            "dias_inactivo",
            "actividades_completadas",
            "errores_por_intento",
            "ayuda_por_intento",
            "brecha_rendimiento",
        ]
        self._validate_feature_configuration()
        self.risk_feature_config = {
            feature: dict(config)
            for feature, config in self.DEFAULT_RISK_WEIGHTS.items()
        }
        self._validate_risk_configuration()

        self.model = self._new_model()
        self.scaler = RobustScaler()
        self.is_fitted = False
        self.reference_anomaly_ratio = 0.0
        self.thresholds: dict[str, float] = {}
        self._reference_values: dict[str, np.ndarray] = {}
        self._anomaly_reference = np.array([], dtype=float)
        self.constant_reference_features: list[str] = []
        self.constant_model_features: list[str] = []
        self.training_warnings: list[str] = []
        self.correlation_report: list[dict[str, Any]] = []

    @property
    def anomaly_ratio(self) -> float:
        """Alias compatible: proporción anómala de la cohorte, no calidad."""

        return self.reference_anomaly_ratio

    def preprocess(self, data: pd.DataFrame | dict[str, Any]) -> pd.DataFrame:
        """Valida y construye features sin correcciones silenciosas."""

        source = self._coerce_input(data)
        validated, _ = self._validate_input(source)
        return self._prepare_features(validated)

    def train(self, df: pd.DataFrame) -> None:
        source = self._coerce_input(df)
        if source.empty:
            raise ValueError("RIA07 no puede entrenarse con un conjunto vacio.")
        if len(source) < self.min_training_samples:
            raise ValueError(
                "RIA07 requiere al menos "
                f"{self.min_training_samples} registros validos para entrenar "
                "el conjunto de referencia."
            )

        validated, _ = self._validate_input(source)
        features = self._prepare_features(validated)
        model_features = self._select_model_features(features)

        local_warnings: list[str] = []
        if len(features) < self.SMALL_REFERENCE_COHORT:
            local_warnings.append(
                "La cohorte de referencia tiene menos de "
                f"{self.SMALL_REFERENCE_COHORT} registros; los percentiles "
                "pueden ser inestables."
            )

        local_constant_features = [
            column
            for column in self.risk_feature_config
            if self._is_constant(features[column].to_numpy(dtype=float))
        ]
        if local_constant_features:
            local_warnings.append(
                "Las variables constantes no aportan riesgo: "
                + ", ".join(local_constant_features)
                + "."
            )
        local_constant_model_features = [
            column
            for column in self.model_feature_columns
            if self._is_constant(model_features[column].to_numpy(dtype=float))
        ]
        if local_constant_model_features:
            local_warnings.append(
                "Features constantes de IsolationForest: "
                + ", ".join(local_constant_model_features)
                + ". No aportan separacion en esta cohorte."
            )

        # Entrenamiento transaccional: el objeto se actualiza solo si todas las
        # operaciones locales concluyen correctamente.
        local_scaler = RobustScaler()
        scaled_values = local_scaler.fit_transform(model_features)
        scaled_features = pd.DataFrame(
            scaled_values,
            columns=self.model_feature_columns,
            index=model_features.index,
        )
        local_model = self._new_model()
        local_model.fit(scaled_features)

        predictions = local_model.predict(scaled_features)
        local_reference_anomaly_ratio = float((predictions == -1).mean())
        local_anomaly_reference = np.sort(
            -local_model.score_samples(scaled_features)
        )
        local_reference_values = {
            column: np.sort(features[column].to_numpy(dtype=float))
            for column in self.risk_feature_config
        }
        local_thresholds = self._calculate_thresholds(features)
        local_correlation_report = self._analyze_correlations(model_features)

        self.scaler = local_scaler
        self.model = local_model
        self.reference_anomaly_ratio = local_reference_anomaly_ratio
        self._anomaly_reference = local_anomaly_reference
        self._reference_values = local_reference_values
        self.thresholds = local_thresholds
        self.constant_reference_features = local_constant_features
        self.constant_model_features = local_constant_model_features
        self.training_warnings = local_warnings
        self.correlation_report = local_correlation_report
        self.is_fitted = True

    def predict(self, data: pd.DataFrame | dict[str, Any]) -> str:
        return self.predict_detailed(data)["risk_label"]

    def predict_detailed(
        self,
        data: pd.DataFrame | dict[str, Any],
    ) -> dict[str, Any]:
        self._check_fitted()
        source = self._coerce_input(data)
        if source.empty:
            raise ValueError("predict_detailed requiere exactamente un estudiante.")
        if len(source) != 1:
            raise ValueError(
                "predict_detailed requiere exactamente un estudiante. "
                "Use predict_batch para multiples registros."
            )
        return self._predict_rows(source)[0]

    def predict_batch(
        self,
        data: pd.DataFrame | list[dict[str, Any]],
        sort_by_risk: bool = False,
    ) -> list[dict[str, Any]]:
        self._check_fitted()
        source = self._coerce_input(data)
        if source.empty:
            return []

        rows = self._predict_rows(source)
        if not sort_by_risk:
            return rows

        risk_order = {"high": 0, "medium": 1, "low": 2}
        return sorted(
            rows,
            key=lambda row: (
                risk_order.get(str(row["risk_level"]), 3),
                -float(row["risk_score"]),
                str(row["source_index"]),
            ),
        )

    def _predict_rows(self, source: pd.DataFrame) -> list[dict[str, Any]]:
        validated, success_rate_derived = self._validate_input(source)
        features = self._prepare_features(validated)
        model_features = self._select_model_features(features)
        scaled_values = self.scaler.transform(model_features)
        scaled_features = pd.DataFrame(
            scaled_values,
            columns=self.model_feature_columns,
            index=model_features.index,
        )
        anomaly_flags = self.model.predict(scaled_features) == -1
        raw_anomaly_scores = -self.model.score_samples(scaled_features)

        results: list[dict[str, Any]] = []
        for position, (source_index, row) in enumerate(features.iterrows()):
            anomaly_score = self._percentile_from_values(
                self._anomaly_reference,
                float(raw_anomaly_scores[position]),
            )
            results.append(
                self._build_result(
                    row=row,
                    source_row=source.iloc[position],
                    source_index=source_index,
                    anomaly=bool(anomaly_flags[position]),
                    anomaly_score=anomaly_score,
                    success_rate_derived=bool(success_rate_derived.iloc[position]),
                    fallback_index=position + 1,
                )
            )
        return results

    def _build_result(
        self,
        row: pd.Series,
        source_row: pd.Series,
        source_index: Any,
        anomaly: bool,
        anomaly_score: float,
        success_rate_derived: bool,
        fallback_index: int,
    ) -> dict[str, Any]:
        adverse_percentiles = {
            feature: self._adverse_percentile(feature, float(row[feature]))
            for feature in self.risk_feature_config
        }
        behavioral_score = self._calculate_behavioral_score(adverse_percentiles)
        candidates = self._collect_adverse_candidates(row, adverse_percentiles)
        risk_score, anomaly_boost = self._calculate_risk_score(
            behavioral_score=behavioral_score,
            anomaly=anomaly,
            anomaly_score=anomaly_score,
            has_adverse_signal=bool(candidates),
        )
        risk_level = self._risk_level(risk_score, has_adverse_signal=bool(candidates))
        reason_codes, reasons = self._select_reasons(candidates)

        student_id = self._metadata_value(
            source_row,
            ("student_id", "id_estudiante", "id"),
            fallback_index,
        )
        student_name = self._metadata_value(
            source_row,
            ("student_name", "nombre_estudiante", "name", "nombre"),
            f"Estudiante {student_id}",
        )

        return {
            "source_index": self._json_safe_value(source_index),
            "student_id": str(student_id),
            "student_name": str(student_name),
            "result": risk_level,
            "risk_level": risk_level,
            "risk_label": self.RISK_LEVELS[risk_level],
            "risk_score": round(risk_score, 1),
            "behavioral_score": round(behavioral_score, 1),
            "anomaly": anomaly,
            "anomaly_score": round(anomaly_score, 1),
            "anomaly_boost": round(anomaly_boost, 1),
            "reason_codes": reason_codes,
            "reasons": reasons,
            "evidence": {
                "inactive_days": int(row["dias_inactivo"]),
                "attempts": int(row["intentos"]),
                "errors": int(row["errores"]),
                "errors_per_attempt": round(row["errores_por_intento"], 2),
                "score": round(row["puntaje"], 1),
                "success_rate": round(row["tasa_exito"], 3),
                "success_rate_derived": success_rate_derived,
                "completed_activities": int(row["actividades_completadas"]),
                "help_requested": int(row["ayuda_solicitada"]),
            },
            "teacher_recommendation": self._recommendation(
                risk_level,
                reason_codes,
            ),
            # Compatibilidad: historical_data_used siempre significó historial
            # temporal individual, no la cohorte de referencia.
            "historical_data_used": False,
            "student_history_used": False,
            "reference_cohort_used": True,
        }

    def _validate_input(
        self,
        source: pd.DataFrame,
    ) -> tuple[pd.DataFrame, pd.Series]:
        data = source.copy()
        missing_columns = [
            column for column in self.REQUIRED_COLUMNS if column not in data.columns
        ]
        if missing_columns:
            raise ValueError(
                "Datos invalidos en RIA07. Faltan columnas obligatorias: "
                f"{missing_columns}."
            )

        success_rate_missing_column = "tasa_exito" not in data.columns
        if success_rate_missing_column:
            data["tasa_exito"] = np.nan

        for column in self.NUMERIC_COLUMNS:
            original = data[column]
            converted = pd.to_numeric(original, errors="coerce")
            non_numeric = original.notna() & converted.isna()
            if non_numeric.any():
                self._raise_invalid_rows(
                    column,
                    "contiene valores no numericos",
                    data.index[non_numeric],
                )
            data[column] = converted

        for column in self.REQUIRED_COLUMNS:
            missing = data[column].isna()
            if missing.any():
                self._raise_invalid_rows(
                    column,
                    "contiene valores ausentes",
                    data.index[missing],
                )

        for column in self.NUMERIC_COLUMNS:
            present = data[column].notna()
            non_finite = present & ~np.isfinite(data[column])
            if non_finite.any():
                self._raise_invalid_rows(
                    column,
                    "contiene valores no finitos",
                    data.index[non_finite],
                )

        for column in self.COUNT_COLUMNS:
            negative = data[column] < 0
            if negative.any():
                self._raise_invalid_rows(
                    column,
                    "contiene valores negativos",
                    data.index[negative],
                )
            non_integer = ~np.isclose(data[column], np.round(data[column]))
            if non_integer.any():
                self._raise_invalid_rows(
                    column,
                    "debe contener enteros o decimales equivalentes a enteros",
                    data.index[non_integer],
                )
            data[column] = data[column].astype(np.int64)

        inconsistent = (data["intentos"] == 0) & (data["errores"] > 0)
        if inconsistent.any():
            raise ValueError(
                "Datos invalidos en RIA07. Las filas "
                f"{self._format_rows(data.index[inconsistent])} tienen "
                "intentos=0 y errores>0."
            )

        invalid_score = (
            (data["puntaje"] < self.SCORE_MIN)
            | (data["puntaje"] > self.SCORE_MAX)
        )
        if invalid_score.any():
            self._raise_invalid_rows(
                "puntaje",
                "debe estar entre 0 y 100",
                data.index[invalid_score],
            )

        success_rate_derived = data["tasa_exito"].isna()
        data.loc[success_rate_derived, "tasa_exito"] = (
            data.loc[success_rate_derived, "puntaje"] / 100
        )
        invalid_success_rate = (
            (data["tasa_exito"] < self.SUCCESS_RATE_MIN)
            | (data["tasa_exito"] > self.SUCCESS_RATE_MAX)
        )
        if invalid_success_rate.any():
            self._raise_invalid_rows(
                "tasa_exito",
                "debe estar en escala 0-1",
                data.index[invalid_success_rate],
            )

        return data, success_rate_derived

    def _prepare_features(self, validated: pd.DataFrame) -> pd.DataFrame:
        data = validated.copy()
        zero_attempts = data["intentos"] == 0
        denominator = data["intentos"].where(~zero_attempts, 1)
        data["errores_por_intento"] = data["errores"] / denominator
        data["ayuda_por_intento"] = data["ayuda_solicitada"] / denominator
        data["brecha_rendimiento"] = abs(
            data["puntaje"] / 100 - data["tasa_exito"]
        )

        # intentos=0 solo es coherente con errores=0; los cocientes se definen
        # como 0 para representar ausencia de intentos, no para ocultar errores.
        data.loc[zero_attempts, "errores_por_intento"] = 0.0
        data.loc[zero_attempts, "ayuda_por_intento"] = 0.0

        features = data[self.feature_columns].astype(float)
        if not np.isfinite(features.to_numpy()).all():
            raise ValueError(
                "Datos invalidos en RIA07. Las features derivadas contienen "
                "valores no finitos."
            )
        return features

    def _select_model_features(self, features: pd.DataFrame) -> pd.DataFrame:
        selected = features.loc[:, self.model_feature_columns].copy()
        if list(selected.columns) != self.model_feature_columns:
            raise RuntimeError("Las features de RIA07 cambiaron de orden.")
        if selected.columns.duplicated().any():
            raise RuntimeError("RIA07 contiene features duplicadas.")
        return selected

    def _calculate_behavioral_score(
        self,
        adverse_percentiles: dict[str, float],
    ) -> float:
        score = sum(
            adverse_percentiles[feature] * config["weight"]
            for feature, config in self.risk_feature_config.items()
        )
        return float(np.clip(score, 0, 100))

    def _calculate_risk_score(
        self,
        behavioral_score: float,
        anomaly: bool,
        anomaly_score: float,
        has_adverse_signal: bool,
    ) -> tuple[float, float]:
        boost = 0.0
        if (
            anomaly
            and has_adverse_signal
            and behavioral_score >= self.min_adverse_score_for_boost
        ):
            boost = (
                self.anomaly_weight
                * anomaly_score
                * (behavioral_score / 100)
            )
        return float(np.clip(behavioral_score + boost, 0, 100)), float(boost)

    def _collect_adverse_candidates(
        self,
        row: pd.Series,
        adverse: dict[str, float],
    ) -> list[dict[str, Any]]:
        candidates: list[dict[str, Any]] = []

        def add(code: str, text: str, feature: str) -> None:
            candidates.append({
                "code": code,
                "text": text,
                "relevance": adverse[feature],
            })

        if self._high_signal(
            "dias_inactivo",
            row["dias_inactivo"],
            adverse["dias_inactivo"],
            self.thresholds["high_inactivity"],
            self.ABSOLUTE_REASON_LIMITS["high_inactivity"],
        ):
            add(
                "high_inactivity",
                f"{int(row['dias_inactivo'])} dias sin actividad",
                "dias_inactivo",
            )

        if self._high_signal(
            "errores_por_intento",
            row["errores_por_intento"],
            adverse["errores_por_intento"],
            self.thresholds["high_errors_per_attempt"],
            self.ABSOLUTE_REASON_LIMITS["high_error_ratio"],
        ):
            add(
                "high_error_ratio",
                f"{row['errores_por_intento']:.2f} errores por intento",
                "errores_por_intento",
            )

        low_score = self._low_signal(
            "puntaje",
            row["puntaje"],
            adverse["puntaje"],
            self.thresholds["low_score"],
            self.ABSOLUTE_REASON_LIMITS["low_score"],
        )
        if low_score:
            add("low_score", f"Puntaje bajo: {row['puntaje']:.1f}/100", "puntaje")

        low_success = self._low_signal(
            "tasa_exito",
            row["tasa_exito"],
            adverse["tasa_exito"],
            self.thresholds["low_success_rate"],
            self.ABSOLUTE_REASON_LIMITS["low_success_rate"],
        )
        if low_success:
            add(
                "low_success_rate",
                f"Tasa de exito baja: {row['tasa_exito'] * 100:.0f}%",
                "tasa_exito",
            )

        if self._low_signal(
            "actividades_completadas",
            row["actividades_completadas"],
            adverse["actividades_completadas"],
            self.thresholds["low_completed_activities"],
            self.ABSOLUTE_REASON_LIMITS["low_completed_activities"],
        ):
            add(
                "low_completed_activities",
                "Pocas actividades completadas: "
                f"{int(row['actividades_completadas'])}",
                "actividades_completadas",
            )

        if (
            row["ayuda_solicitada"] > 0
            and self._high_signal(
                "ayuda_por_intento",
                row["ayuda_por_intento"],
                adverse["ayuda_por_intento"],
                self.thresholds["high_help_per_attempt"],
                self.ABSOLUTE_REASON_LIMITS["high_help_dependency"],
            )
        ):
            add(
                "high_help_dependency",
                "Alta solicitud de ayuda por intento: "
                f"{row['ayuda_por_intento']:.2f}",
                "ayuda_por_intento",
            )

        high_attempts = self._high_signal(
            "intentos",
            row["intentos"],
            adverse["intentos"],
            self.thresholds["high_attempts"],
            self.ABSOLUTE_REASON_LIMITS["high_attempts"],
        )
        if high_attempts:
            add(
                "high_attempts",
                f"Cantidad elevada de intentos: {int(row['intentos'])}",
                "intentos",
            )

        if high_attempts and low_score:
            candidates = [
                candidate
                for candidate in candidates
                if candidate["code"] not in {"high_attempts", "low_score"}
            ]
            candidates.append({
                "code": "high_effort_low_score",
                "text": (
                    f"{int(row['intentos'])} intentos con puntaje "
                    f"{row['puntaje']:.1f}/100"
                ),
                "relevance": max(adverse["intentos"], adverse["puntaje"]),
            })

        return candidates

    def _select_reasons(
        self,
        candidates: Iterable[dict[str, Any]],
    ) -> tuple[list[str], list[str]]:
        ordered = sorted(
            candidates,
            key=lambda candidate: (
                -float(candidate["relevance"]),
                str(candidate["code"]),
            ),
        )
        selected: list[dict[str, Any]] = []
        seen_codes: set[str] = set()
        performance_selected = False
        for candidate in ordered:
            code = str(candidate["code"])
            if code in seen_codes:
                continue
            is_performance = code in {
                "low_score",
                "low_success_rate",
                "high_effort_low_score",
            }
            if is_performance and performance_selected:
                continue
            selected.append(candidate)
            seen_codes.add(code)
            performance_selected = performance_selected or is_performance
            if len(selected) == self.MAX_REASONS:
                break
        return (
            [str(candidate["code"]) for candidate in selected],
            [str(candidate["text"]) for candidate in selected],
        )

    def _calculate_thresholds(self, features: pd.DataFrame) -> dict[str, float]:
        return {
            "high_attempts": float(features["intentos"].quantile(0.85)),
            "high_errors_per_attempt": float(
                features["errores_por_intento"].quantile(0.85)
            ),
            "low_score": float(features["puntaje"].quantile(0.15)),
            "low_success_rate": float(features["tasa_exito"].quantile(0.15)),
            "high_inactivity": float(features["dias_inactivo"].quantile(0.85)),
            "low_completed_activities": float(
                features["actividades_completadas"].quantile(0.15)
            ),
            "high_help_per_attempt": float(
                features["ayuda_por_intento"].quantile(0.85)
            ),
        }

    def _adverse_percentile(self, feature: str, value: float) -> float:
        values = self._reference_values[feature]
        if self._is_constant(values):
            return 0.0
        percentile = self._percentile_from_values(values, value)
        if self.risk_feature_config[feature]["direction"] == "low":
            percentile = 100 - percentile
        return float(np.clip(percentile, 0, 100))

    @staticmethod
    def _percentile_from_values(values: np.ndarray, value: float) -> float:
        values = np.asarray(values, dtype=float)
        if values.size == 0 or DetectorRiesgoAnomalias._is_constant(values):
            return 0.0
        left = np.searchsorted(values, value, side="left")
        right = np.searchsorted(values, value, side="right")
        average_position = (left + right) / 2
        percentile = 100 * average_position / values.size
        return float(np.clip(percentile, 0, 100))

    def _high_signal(
        self,
        feature: str,
        value: float,
        adverse_percentile: float,
        relative_threshold: float,
        absolute_threshold: float,
    ) -> bool:
        return (
            feature not in self.constant_reference_features
            and value > 0
            and adverse_percentile >= self.MIN_REASON_PERCENTILE
            and value >= max(relative_threshold, absolute_threshold)
        )

    def _low_signal(
        self,
        feature: str,
        value: float,
        adverse_percentile: float,
        relative_threshold: float,
        absolute_threshold: float,
    ) -> bool:
        return (
            feature not in self.constant_reference_features
            and adverse_percentile >= self.MIN_REASON_PERCENTILE
            and value <= min(relative_threshold, absolute_threshold)
        )

    def _risk_level(self, risk_score: float, has_adverse_signal: bool = True) -> str:
        if not has_adverse_signal:
            return "low"
        if risk_score >= self.risk_thresholds["high"]:
            return "high"
        if risk_score >= self.risk_thresholds["medium"]:
            return "medium"
        return "low"

    def _recommendation(self, risk_level: str, reason_codes: list[str]) -> str:
        if risk_level == "high" and "high_inactivity" in reason_codes:
            return "Contactar al estudiante y acordar una actividad breve de reincorporacion."
        if risk_level == "high" and any(
            code in reason_codes
            for code in (
                "high_error_ratio",
                "low_score",
                "low_success_rate",
                "high_effort_low_score",
            )
        ):
            return "Programar refuerzo guiado y revisar los errores antes de una nueva actividad."
        return self.RECOMMENDATIONS[risk_level]

    def obtener_pesos_riesgo(self) -> dict[str, Any]:
        return {
            "type": "configured_heuristic_weights",
            "description": "Pesos heuristicos configurados manualmente; no son importancias aprendidas por IsolationForest.",
            "weights": {
                feature: float(config["weight"])
                for feature, config in self.risk_feature_config.items()
            },
        }

    def calcular_importancia(
        self,
        df: pd.DataFrame | None = None,
    ) -> dict[str, float]:
        """Alias temporal obsoleto; devuelve pesos heurísticos, no importancia."""

        del df
        warnings.warn(
            "calcular_importancia esta obsoleto; use obtener_pesos_riesgo. "
            "Los valores son pesos heuristicos, no importancias aprendidas.",
            DeprecationWarning,
            stacklevel=2,
        )
        return dict(self.obtener_pesos_riesgo()["weights"])

    def _analyze_correlations(
        self,
        model_features: pd.DataFrame,
    ) -> list[dict[str, Any]]:
        correlations = model_features.corr(numeric_only=True).abs()
        report: list[dict[str, Any]] = []
        for left_index, left_feature in enumerate(self.model_feature_columns):
            for right_feature in self.model_feature_columns[left_index + 1:]:
                correlation = correlations.loc[left_feature, right_feature]
                if pd.notna(correlation) and correlation >= 0.85:
                    report.append({
                        "feature_a": left_feature,
                        "feature_b": right_feature,
                        "absolute_correlation": round(float(correlation), 4),
                    })
        return report

    def _check_fitted(self) -> None:
        if not self.is_fitted:
            raise RuntimeError("RIA07 debe entrenarse antes de predecir.")

    def _new_model(self) -> IsolationForest:
        return IsolationForest(
            contamination=self.contamination,
            n_estimators=250,
            random_state=self.random_state,
        )

    def _validate_feature_configuration(self) -> None:
        for name, columns in (
            ("feature_columns", self.feature_columns),
            ("model_feature_columns", self.model_feature_columns),
        ):
            if len(columns) != len(set(columns)):
                raise ValueError(f"{name} contiene columnas duplicadas.")
        missing = set(self.model_feature_columns) - set(self.feature_columns)
        if missing:
            raise ValueError(
                "model_feature_columns contiene features no preparadas: "
                f"{sorted(missing)}."
            )

    def _validate_risk_configuration(self) -> None:
        missing = set(self.risk_feature_config) - set(self.feature_columns)
        if missing:
            raise ValueError(
                "risk_feature_config contiene features no preparadas: "
                f"{sorted(missing)}."
            )
        valid_directions = {"high", "low"}
        invalid_directions = {
            feature: config.get("direction")
            for feature, config in self.risk_feature_config.items()
            if config.get("direction") not in valid_directions
        }
        if invalid_directions:
            raise ValueError(
                "Direcciones invalidas en risk_feature_config: "
                f"{invalid_directions}."
            )
        total_weight = sum(
            float(config.get("weight", -1))
            for config in self.risk_feature_config.values()
        )
        if any(
            float(config.get("weight", -1)) < 0
            for config in self.risk_feature_config.values()
        ):
            raise ValueError("Los pesos de riesgo no pueden ser negativos.")
        if not np.isclose(total_weight, 1.0):
            raise ValueError("Los pesos de riesgo deben sumar 1.0.")

    @staticmethod
    def _validate_contamination(value: float) -> float:
        try:
            contamination = float(value)
        except (TypeError, ValueError) as exc:
            raise ValueError("contamination debe ser numerico.") from exc
        if not 0 < contamination <= 0.5:
            raise ValueError("contamination debe cumplir 0 < valor <= 0.5.")
        return contamination

    @staticmethod
    def _validate_min_training_samples(value: int) -> int:
        if isinstance(value, bool) or not isinstance(value, (int, np.integer)):
            raise ValueError("min_training_samples debe ser un entero.")
        if int(value) < 2:
            raise ValueError("min_training_samples debe ser al menos 2.")
        return int(value)

    @staticmethod
    def _validate_fraction(
        value: float,
        name: str,
        allow_zero: bool = False,
    ) -> float:
        try:
            result = float(value)
        except (TypeError, ValueError) as exc:
            raise ValueError(f"{name} debe ser numerico.") from exc
        minimum_ok = result >= 0 if allow_zero else result > 0
        if not minimum_ok or result > 1:
            operator = "0 <=" if allow_zero else "0 <"
            raise ValueError(f"{name} debe cumplir {operator} valor <= 1.")
        return result

    @staticmethod
    def _validate_score_threshold(value: float, name: str) -> float:
        try:
            result = float(value)
        except (TypeError, ValueError) as exc:
            raise ValueError(f"{name} debe ser numerico.") from exc
        if not 0 <= result <= 100:
            raise ValueError(f"{name} debe estar entre 0 y 100.")
        return result

    @classmethod
    def _validate_risk_thresholds(
        cls,
        thresholds: dict[str, float],
    ) -> dict[str, float]:
        if set(thresholds) != {"medium", "high"}:
            raise ValueError("risk_thresholds debe contener medium y high.")
        medium = cls._validate_score_threshold(thresholds["medium"], "medium")
        high = cls._validate_score_threshold(thresholds["high"], "high")
        if not medium < high:
            raise ValueError("risk_thresholds debe cumplir medium < high.")
        return {"medium": medium, "high": high}

    @staticmethod
    def _coerce_input(
        data: pd.DataFrame | dict[str, Any] | list[dict[str, Any]],
    ) -> pd.DataFrame:
        if isinstance(data, pd.DataFrame):
            return data.copy()
        if isinstance(data, dict):
            return pd.DataFrame([data])
        if isinstance(data, list):
            return pd.DataFrame(data)
        raise TypeError("RIA07 requiere un diccionario, una lista o un DataFrame.")

    @staticmethod
    def _raise_invalid_rows(
        column: str,
        problem: str,
        rows: Iterable[Any],
    ) -> None:
        raise ValueError(
            f"Datos invalidos en RIA07. La columna '{column}' {problem} "
            f"en las filas: {DetectorRiesgoAnomalias._format_rows(rows)}."
        )

    @staticmethod
    def _format_rows(rows: Iterable[Any]) -> list[Any]:
        return [DetectorRiesgoAnomalias._json_safe_value(row) for row in rows]

    @staticmethod
    def _json_safe_value(value: Any) -> Any:
        return value.item() if isinstance(value, np.generic) else value

    @staticmethod
    def _is_constant(values: np.ndarray) -> bool:
        values = np.asarray(values, dtype=float)
        return values.size > 0 and bool(np.allclose(values, values[0]))

    @staticmethod
    def _metadata_value(
        row: pd.Series,
        candidates: tuple[str, ...],
        default: Any,
    ) -> Any:
        for candidate in candidates:
            if candidate in row.index and pd.notna(row[candidate]):
                return row[candidate]
        return default
