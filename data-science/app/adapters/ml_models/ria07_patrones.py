from __future__ import annotations

import math
import os
import uuid
import warnings
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.metrics import (
    adjusted_rand_score,
    calinski_harabasz_score,
    davies_bouldin_score,
    silhouette_score,
)
from sklearn.preprocessing import RobustScaler


class AnalizadorPatronesEstudiantiles:
    """
    RIA07: segmentación no supervisada de patrones de participación.

    Un registro representa a un estudiante en una única ventana de observación
    común. Las unidades canónicas son:

    - ``frecuencia_actividad``: cantidad de actividades en la ventana.
    - ``duracion_promedio_min``: promedio de minutos por sesión en la ventana.
    - ``dias_inactivo``: días desde la última actividad hasta la fecha de corte.

    El resultado describe similitudes de participación; no es una calificación,
    un diagnóstico ni una predicción de rendimiento.
    """

    TECHNIQUE = (
        "KMeans + RobustScaler + selección por separación, estabilidad "
        "por submuestreo y balance"
    )
    MODEL_VERSION = "ria07-v5-reliable"
    FEATURE_SCHEMA_VERSION = "ria07-features-v3-continuity"
    MIN_TRAINING_SAMPLES = 20
    MAX_CLUSTERS = 5
    RANDOM_STATE = 42

    FEATURE_LABELS = {
        "frecuencia_actividad": "frecuencia de actividades",
        "duracion_promedio_min": "duración promedio de sesión",
        "dias_inactivo": "días de inactividad",
    }
    PUBLIC_ALIASES = {
        "activity_frequency": "frecuencia_actividad",
        "average_session_minutes": "duracion_promedio_min",
        "inactive_days": "dias_inactivo",
        "days_inactive": "dias_inactivo",
    }
    # Alias heredados del dataset del proyecto. Solo son válidos porque cada
    # fila ya representa un resumen por estudiante en una ventana común. Si el
    # origen cambia a eventos sin agregar, deben eliminarse o agregarse antes.
    TRAINING_SUMMARY_ALIASES = {
        "actividades_completadas": "frecuencia_actividad",
        "tiempo_sesion_min": "duracion_promedio_min",
    }
    DOMAIN_LIMITS = {
        "frecuencia_actividad": {
            "minimum": 0.0,
            "maximum": 10_000.0,
            "unit": "actividades por ventana de observación",
        },
        "duracion_promedio_min": {
            "minimum": 0.0,
            "maximum": 1_440.0,
            "unit": "minutos promedio por sesión",
        },
        "dias_inactivo": {
            "minimum": 0.0,
            "maximum": 365.0,
            "unit": "días desde la última actividad",
        },
    }

    def __init__(
        self,
        min_training_samples: int = MIN_TRAINING_SAMPLES,
        max_clusters: int = MAX_CLUSTERS,
        random_state: int = RANDOM_STATE,
        *,
        stability_iterations: int = 10,
        stability_sample_fraction: float = 0.80,
        typicality_threshold: float = 0.05,
        assignment_margin_threshold: float = 0.15,
        min_segment_samples: int = 10,
        min_cluster_fraction: float = 0.03,
        low_quantile: float = 0.35,
        high_quantile: float = 0.65,
        kmeans_n_init: int = 20,
        complexity_penalty: float = 0.015,
        max_batch_size: int = 500,
        outlier_iqr_multiplier: float = 3.0,
        near_constant_fraction: float = 0.98,
    ) -> None:
        self._validate_configuration(
            min_training_samples=min_training_samples,
            max_clusters=max_clusters,
            stability_iterations=stability_iterations,
            stability_sample_fraction=stability_sample_fraction,
            typicality_threshold=typicality_threshold,
            assignment_margin_threshold=assignment_margin_threshold,
            min_segment_samples=min_segment_samples,
            min_cluster_fraction=min_cluster_fraction,
            low_quantile=low_quantile,
            high_quantile=high_quantile,
            kmeans_n_init=kmeans_n_init,
            complexity_penalty=complexity_penalty,
            max_batch_size=max_batch_size,
            outlier_iqr_multiplier=outlier_iqr_multiplier,
            near_constant_fraction=near_constant_fraction,
        )

        self.min_training_samples = int(min_training_samples)
        self.max_clusters = int(max_clusters)
        self.random_state = int(random_state)
        self.stability_iterations = int(stability_iterations)
        self.stability_sample_fraction = float(stability_sample_fraction)
        self.typicality_threshold = float(typicality_threshold)
        self.assignment_margin_threshold = float(assignment_margin_threshold)
        self.min_segment_samples = int(min_segment_samples)
        self.min_cluster_fraction = float(min_cluster_fraction)
        self.low_quantile = float(low_quantile)
        self.high_quantile = float(high_quantile)
        self.kmeans_n_init = int(kmeans_n_init)
        self.complexity_penalty = float(complexity_penalty)
        self.max_batch_size = int(max_batch_size)
        self.outlier_iqr_multiplier = float(outlier_iqr_multiplier)
        self.near_constant_fraction = float(near_constant_fraction)

        self.model_version = self.MODEL_VERSION
        self.feature_schema_version = self.FEATURE_SCHEMA_VERSION
        self.feature_columns = [
            "frecuencia_actividad",
            "duracion_promedio_min",
            "dias_inactivo",
        ]
        self.active_feature_columns = list(self.feature_columns)
        self.excluded_feature_columns: list[str] = []

        self.model: KMeans | None = None
        self.scaler = RobustScaler()
        self.is_fitted = False
        self.selected_clusters = 0
        self.silhouette: float | None = None
        self.davies_bouldin: float | None = None
        self.calinski_harabasz: float | None = None
        self.stability_ari: float | None = None
        self.stability_std: float | None = None
        self.stability_valid_iterations = 0
        self.quality_status = "not_evaluated"
        self.metrics_note = (
            "RIA07 es clustering no supervisado: accuracy, precision, recall "
            "y F1 no aplican sin segmentos de referencia validados."
        )
        self.candidate_report: list[dict[str, Any]] = []
        self.training_warnings: list[str] = []
        self.training_diagnostics: dict[str, Any] = {}
        self.training_code_usage_summary: dict[str, Any] = {
            "available": False,
            "role": "training_diagnostics_only",
            "used_for_segmentation": False,
            "used_for_prediction": False,
        }
        self.training_period: dict[str, Any] = {
            "available": False,
            "warning": "El origen no proporcionó metadatos temporales.",
        }
        self.model_run_id: str | None = None
        self.trained_at: str | None = None

        self.segment_profiles: dict[str, dict[str, Any]] = {}
        self.segment_statistics: dict[str, dict[str, Any]] = {}
        self._cluster_to_segment: dict[int, str] = {}
        self._cluster_distances: dict[int, np.ndarray] = {}
        self._reference_statistics: dict[str, dict[str, float]] = {}
        self._reference_quantiles: dict[str, dict[str, float]] = {}

    def train(self, data: pd.DataFrame | list[dict[str, Any]]) -> None:
        """
        Entrena el clustering de forma transaccional.

        Si cualquier validación o cálculo falla, el estado previamente
        entrenado del objeto permanece intacto.
        """
        source = self._coerce_input(data)
        if len(source) < self.min_training_samples:
            raise ValueError(
                "RIA07 requiere al menos "
                f"{self.min_training_samples} registros para construir segmentos."
            )

        prepared, preparation_warnings = self._prepare_features(
            source,
            training=True,
        )
        training_period, temporal_warnings = self._validate_temporal_metadata(
            source
        )
        diagnostics, diagnostic_warnings = self._validate_training_cohort(
            source,
            prepared,
        )
        active_features, excluded_features, variability_warnings = (
            self._select_informative_features(prepared)
        )
        if len(active_features) < 2:
            raise ValueError(
                "RIA07 requiere al menos dos variables informativas; "
                "las demás son constantes o casi constantes."
            )

        distinct_rows = len(prepared[active_features].drop_duplicates())
        if distinct_rows < 3:
            raise ValueError(
                "RIA07 requiere al menos tres patrones de comportamiento distintos."
            )

        local_scaler = RobustScaler()
        scaled = local_scaler.fit_transform(prepared[active_features])
        (
            local_model,
            local_candidates,
            selected_metrics,
        ) = self._fit_best_candidate(scaled, distinct_rows)
        labels = local_model.labels_.astype(int)

        reference_statistics = self._calculate_reference_statistics(
            prepared,
            active_features,
        )
        reference_quantiles = {
            column: {
                "low": reference_statistics[column]["q_low"],
                "high": reference_statistics[column]["q_high"],
            }
            for column in active_features
        }
        run_id = uuid.uuid4().hex
        trained_at = datetime.now(timezone.utc).isoformat()
        (
            profiles,
            cluster_to_segment,
            cluster_distances,
            segment_statistics,
        ) = self._build_segment_profiles(
            prepared=prepared,
            scaled=scaled,
            labels=labels,
            model=local_model,
            scaler=local_scaler,
            active_features=active_features,
            reference_quantiles=reference_quantiles,
            model_run_id=run_id,
        )

        code_summary = self._analyze_training_code_usage(source)
        invalid_code_rows = int(code_summary.get("invalid_rows", 0))
        code_warnings = []
        if invalid_code_rows:
            code_warnings.append(
                f"'uso_codigo' contiene {invalid_code_rows} registros no válidos; "
                "se ignoraron porque esta variable es solo diagnóstica."
            )
        all_warnings = list(
            dict.fromkeys(
                preparation_warnings
                + diagnostic_warnings
                + variability_warnings
                + code_warnings
                + temporal_warnings
            )
        )

        # Commit atómico: no se modifica self antes de que todos los cálculos
        # anteriores hayan finalizado correctamente.
        self.scaler = local_scaler
        self.model = local_model
        self.active_feature_columns = active_features
        self.excluded_feature_columns = excluded_features
        self.selected_clusters = int(selected_metrics["clusters"])
        self.silhouette = float(selected_metrics["silhouette"])
        self.davies_bouldin = float(selected_metrics["davies_bouldin"])
        self.calinski_harabasz = float(
            selected_metrics["calinski_harabasz"]
        )
        self.stability_ari = float(selected_metrics["stability_mean"])
        self.stability_std = float(selected_metrics["stability_std"])
        self.stability_valid_iterations = int(
            selected_metrics["stability_valid_iterations"]
        )
        self.quality_status = self._quality_status(
            self.silhouette,
            self.stability_ari,
        )
        self.candidate_report = local_candidates
        self.training_warnings = all_warnings
        self.training_diagnostics = {
            **diagnostics,
            "active_features": list(active_features),
            "excluded_features": list(excluded_features),
            "domain_limits": self.DOMAIN_LIMITS,
            "feature_schema_version": self.feature_schema_version,
        }
        self.training_code_usage_summary = code_summary
        self.training_period = training_period
        self._reference_statistics = reference_statistics
        self._reference_quantiles = reference_quantiles
        self.segment_profiles = profiles
        self.segment_statistics = segment_statistics
        self._cluster_to_segment = cluster_to_segment
        self._cluster_distances = cluster_distances
        self.model_run_id = run_id
        self.trained_at = trained_at
        self.model_version = self.MODEL_VERSION
        self.feature_schema_version = self.FEATURE_SCHEMA_VERSION
        self.is_fitted = True

    def predict(self, data: pd.DataFrame | dict[str, Any]) -> str:
        """Devuelve el nombre del patrón más cercano."""
        return self.predict_detailed(data)["segment_name"]

    def predict_detailed(
        self,
        data: pd.DataFrame | dict[str, Any],
    ) -> dict[str, Any]:
        """Analiza exactamente un estudiante y explica su asignación."""
        self._ensure_fitted()
        source = self._coerce_input(data)
        if len(source) != 1:
            raise ValueError(
                "predict_detailed requiere exactamente un estudiante; "
                "use predict_batch para varios."
            )
        prepared, _ = self._prepare_features(source, training=False)
        scaled = self.scaler.transform(prepared[self.active_feature_columns])
        labels = self.model.predict(scaled)
        distances = self.model.transform(scaled)
        return self._build_prediction_result(
            prepared.iloc[0],
            scaled[0],
            int(labels[0]),
            distances[0],
        )

    def predict_batch(
        self,
        data: pd.DataFrame | list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """Analiza un lote con una sola preparación, escala y predicción."""
        self._ensure_fitted()
        source = self._coerce_input(data)
        if source.empty:
            raise ValueError("predict_batch requiere al menos un estudiante.")
        prepared, _ = self._prepare_features(source, training=False)
        scaled = self.scaler.transform(prepared[self.active_feature_columns])
        labels = self.model.predict(scaled)
        distances = self.model.transform(scaled)
        return [
            self._build_prediction_result(
                prepared.iloc[index],
                scaled[index],
                int(labels[index]),
                distances[index],
            )
            for index in range(len(prepared))
        ]

    def quality_summary(self) -> dict[str, Any]:
        """Devuelve métricas no supervisadas y su uso recomendado."""
        quality_label, quality_explanation, recommended_use = (
            self._quality_explanation()
        )
        return {
            "quality_status": self.quality_status,
            "quality_label": quality_label,
            "quality_explanation": quality_explanation,
            "recommended_use": recommended_use,
            "selected_clusters": self.selected_clusters,
            "silhouette": self._round_optional(self.silhouette),
            "davies_bouldin": self._round_optional(self.davies_bouldin),
            "calinski_harabasz": self._round_optional(
                self.calinski_harabasz
            ),
            "stability_ari": self._round_optional(self.stability_ari),
            "stability_std": self._round_optional(self.stability_std),
            "stability_valid_iterations": self.stability_valid_iterations,
            "stability_method": (
                "ARI sobre observaciones comunes en submuestras sin reemplazo "
                f"({self.stability_sample_fraction:.0%}, "
                f"{self.stability_iterations} intentos)"
            ),
            "active_features": list(self.active_feature_columns),
            "excluded_features": list(self.excluded_feature_columns),
            "model_run_id": self.model_run_id,
            "model_version": self.model_version,
            "feature_schema_version": self.feature_schema_version,
            "trained_at": self.trained_at,
            "accuracy": None,
            "metrics_note": self.metrics_note,
        }

    def save(self, path: str | os.PathLike[str]) -> None:
        """Guarda el artefacto completo mediante Joblib de forma atómica."""
        self._ensure_fitted()
        destination = Path(path)
        destination.parent.mkdir(parents=True, exist_ok=True)
        temporary = destination.with_suffix(destination.suffix + ".tmp")
        joblib.dump(self, temporary)
        os.replace(temporary, destination)

    @classmethod
    def load(
        cls,
        path: str | os.PathLike[str],
        *,
        trusted: bool = False,
    ) -> AnalizadorPatronesEstudiantiles:
        """
        Carga y valida un artefacto.

        Joblib usa deserialización pickle y solo debe abrir archivos confiables.
        """
        if not trusted:
            raise ValueError(
                "RIA07 no carga artefactos Joblib no confiables. "
                "Use trusted=True solo para archivos controlados por el proyecto."
            )
        warnings.warn(
            "La carga Joblib puede ejecutar código del artefacto; confirme su origen.",
            UserWarning,
            stacklevel=2,
        )
        loaded = joblib.load(Path(path))
        cls._validate_loaded_artifact(loaded)
        return loaded

    def _fit_best_candidate(
        self,
        scaled: np.ndarray,
        distinct_rows: int,
    ) -> tuple[KMeans, list[dict[str, Any]], dict[str, Any]]:
        stability_sample_size = math.ceil(
            len(scaled) * self.stability_sample_fraction
        )
        max_k = min(
            self.max_clusters,
            distinct_rows - 1,
            len(scaled) - 1,
            stability_sample_size - 1,
        )
        minimum_size = max(
            self.min_segment_samples,
            math.ceil(len(scaled) * self.min_cluster_fraction),
        )
        internal_candidates: list[dict[str, Any]] = []
        fitted_models: dict[int, KMeans] = {}

        for clusters in range(2, max_k + 1):
            candidate = KMeans(
                n_clusters=clusters,
                n_init=self.kmeans_n_init,
                random_state=self.random_state,
            )
            labels = candidate.fit_predict(scaled)
            counts = np.bincount(labels, minlength=clusters)
            silhouette = float(silhouette_score(scaled, labels))
            stability = self._calculate_stability(
                scaled,
                labels,
                clusters,
            )
            proportions = counts / counts.sum()
            balance_entropy = float(
                -np.sum(proportions * np.log(proportions))
                / math.log(clusters)
            )
            balance_penalty = 0.20 * (1.0 - balance_entropy)
            complexity = self.complexity_penalty * (clusters - 2)
            selection_score = (
                0.55 * silhouette
                + 0.25 * stability["mean"]
                + 0.20 * balance_entropy
                - balance_penalty
                - complexity
            )
            accepted = bool(counts.min() >= minimum_size)
            report = {
                "clusters": clusters,
                "silhouette_raw": silhouette,
                "davies_bouldin_raw": float(
                    davies_bouldin_score(scaled, labels)
                ),
                "calinski_harabasz_raw": float(
                    calinski_harabasz_score(scaled, labels)
                ),
                "stability_mean_raw": stability["mean"],
                "stability_std_raw": stability["std"],
                "stability_valid_iterations": stability["valid_iterations"],
                "balance_entropy_raw": balance_entropy,
                "balance_penalty_raw": balance_penalty,
                "complexity_penalty_raw": complexity,
                "selection_score_raw": selection_score,
                "cluster_sizes": counts.astype(int).tolist(),
                "cluster_percentages_raw": proportions.tolist(),
                "minimum_cluster_size": int(counts.min()),
                "maximum_cluster_size": int(counts.max()),
                "required_minimum_cluster_size": int(minimum_size),
                "accepted": accepted,
                "decision_reason": (
                    "aceptado"
                    if accepted
                    else (
                        "descartado: al menos un segmento tiene menos de "
                        f"{minimum_size} integrantes"
                    )
                ),
            }
            internal_candidates.append(report)
            fitted_models[clusters] = candidate

        accepted_candidates = [
            item for item in internal_candidates if item["accepted"]
        ]
        if not accepted_candidates:
            raise ValueError(
                "RIA07 no encontró un clustering utilizable: todos los "
                f"candidatos contienen segmentos menores a {minimum_size} estudiantes."
            )
        best = max(
            accepted_candidates,
            key=lambda item: (
                item["selection_score_raw"],
                item["silhouette_raw"],
                -item["clusters"],
            ),
        )
        public_report = [
            self._candidate_for_presentation(item)
            for item in internal_candidates
        ]
        selected = {
            "clusters": best["clusters"],
            "silhouette": best["silhouette_raw"],
            "davies_bouldin": best["davies_bouldin_raw"],
            "calinski_harabasz": best["calinski_harabasz_raw"],
            "stability_mean": best["stability_mean_raw"],
            "stability_std": best["stability_std_raw"],
            "stability_valid_iterations": best[
                "stability_valid_iterations"
            ],
        }
        return fitted_models[best["clusters"]], public_report, selected

    def _calculate_stability(
        self,
        scaled: np.ndarray,
        reference_labels: np.ndarray,
        clusters: int,
    ) -> dict[str, float | int]:
        """Mide estabilidad por ARI en submuestras reproducibles."""
        generator = np.random.default_rng(
            self.random_state + clusters * 10_000
        )
        sample_size = math.ceil(
            len(scaled) * self.stability_sample_fraction
        )
        scores: list[float] = []
        for iteration in range(self.stability_iterations):
            indices = np.sort(
                generator.choice(len(scaled), size=sample_size, replace=False)
            )
            try:
                labels = KMeans(
                    n_clusters=clusters,
                    n_init=self.kmeans_n_init,
                    random_state=self.random_state + iteration + 1,
                ).fit_predict(scaled[indices])
                if len(np.unique(labels)) < 2:
                    continue
                scores.append(
                    float(adjusted_rand_score(reference_labels[indices], labels))
                )
            except (ValueError, FloatingPointError):
                continue
        minimum_valid = max(3, math.ceil(self.stability_iterations * 0.60))
        if len(scores) < minimum_valid:
            raise ValueError(
                "RIA07 no pudo obtener suficientes repeticiones válidas para "
                "medir la estabilidad por submuestreo."
            )
        return {
            "mean": float(np.mean(scores)),
            "std": float(np.std(scores, ddof=0)),
            "valid_iterations": len(scores),
        }

    def _prepare_features(
        self,
        source: pd.DataFrame,
        training: bool,
    ) -> tuple[pd.DataFrame, list[str]]:
        data = source.copy(deep=True)
        warnings_list: list[str] = []
        aliases = dict(self.PUBLIC_ALIASES)
        if training:
            aliases.update(self.TRAINING_SUMMARY_ALIASES)

        for alias, canonical in aliases.items():
            if alias not in data.columns:
                continue
            if canonical in data.columns:
                canonical_values = pd.to_numeric(
                    data[canonical],
                    errors="coerce",
                )
                alias_values = pd.to_numeric(data[alias], errors="coerce")
                comparable = canonical_values.notna() & alias_values.notna()
                contradictory = comparable & ~np.isclose(
                    canonical_values,
                    alias_values,
                    rtol=1e-9,
                    atol=1e-9,
                )
                if contradictory.any():
                    rows = (
                        np.flatnonzero(contradictory.to_numpy()) + 1
                    ).tolist()
                    raise ValueError(
                        f"RIA07 recibió valores contradictorios entre "
                        f"'{canonical}' y su alias '{alias}' en filas {rows}."
                    )
            else:
                data = data.rename(columns={alias: canonical})
                if alias in self.TRAINING_SUMMARY_ALIASES:
                    warnings_list.append(
                        f"Se usó el alias heredado '{alias}' como '{canonical}'. "
                        "El origen debe garantizar una ventana común ya agregada."
                    )

        missing = [
            column for column in self.feature_columns if column not in data.columns
        ]
        if missing:
            raise ValueError(
                "Datos inválidos en RIA07. Faltan columnas canónicas o aliases "
                "documentados: "
                + ", ".join(missing)
                + "."
            )

        for column in self.feature_columns:
            numeric = pd.to_numeric(data[column], errors="coerce")
            invalid = numeric.isna() | ~np.isfinite(numeric)
            if invalid.any():
                rows = (np.flatnonzero(invalid.to_numpy()) + 1).tolist()
                raise ValueError(
                    f"RIA07 recibió valores no numéricos o no finitos en "
                    f"'{column}', filas {rows}."
                )
            data[column] = numeric.astype(float)
            limits = self.DOMAIN_LIMITS[column]
            outside = (
                (data[column] < limits["minimum"])
                | (data[column] > limits["maximum"])
            )
            if outside.any():
                rows = (np.flatnonzero(outside.to_numpy()) + 1).tolist()
                if (data.loc[outside, column] < limits["minimum"]).any():
                    raise ValueError(
                        f"RIA07 requiere '{column}' mayor o igual a "
                        f"{limits['minimum']:g}; filas {rows}."
                    )
                raise ValueError(
                    f"RIA07 requiere '{column}' entre {limits['minimum']:g} y "
                    f"{limits['maximum']:g} {limits['unit']}; filas {rows}."
                )

        if not training and len(data) > self.max_batch_size:
            raise ValueError(
                f"RIA07 admite como máximo {self.max_batch_size} estudiantes por lote."
            )
        return data.reset_index(drop=True), warnings_list

    def _validate_training_cohort(
        self,
        source: pd.DataFrame,
        prepared: pd.DataFrame,
    ) -> tuple[dict[str, Any], list[str]]:
        warnings_list: list[str] = []
        feature_duplicates = prepared.duplicated(
            subset=self.feature_columns,
            keep=False,
        )
        duplicate_rows = int(feature_duplicates.sum())
        if duplicate_rows:
            warnings_list.append(
                f"La cohorte contiene {duplicate_rows} filas con patrones "
                "completamente duplicados; no se eliminaron."
            )

        id_column = next(
            (
                column
                for column in ("student_id", "id_estudiante")
                if column in source.columns
            ),
            None,
        )
        duplicate_id_count = 0
        conflicting_id_count = 0
        if id_column is not None:
            identifiers = source[id_column].astype("string").str.strip()
            valid_ids = identifiers.notna() & identifiers.ne("")
            duplicate_ids = identifiers[valid_ids].duplicated(keep=False)
            duplicate_id_count = int(duplicate_ids.sum())
            if duplicate_id_count:
                positions = identifiers[valid_ids][duplicate_ids].index
                subset = prepared.loc[positions, self.feature_columns].copy()
                subset["_id"] = identifiers.loc[positions].to_numpy()
                conflicting = (
                    subset.groupby("_id", dropna=False)[self.feature_columns]
                    .nunique()
                    .gt(1)
                    .any(axis=1)
                )
                conflicting_id_count = int(conflicting.sum())
                if conflicting_id_count:
                    raise ValueError(
                        "RIA07 detectó estudiantes repetidos con valores "
                        f"contradictorios: {conflicting_id_count} identificadores."
                    )
                warnings_list.append(
                    f"Hay {duplicate_id_count} filas con identificadores "
                    "duplicados y valores equivalentes; no se eliminaron."
                )
        else:
            warnings_list.append(
                "La cohorte no incluye student_id; no se pudo auditar "
                "duplicidad por estudiante."
            )

        correlations = prepared[self.feature_columns].corr(method="spearman")
        highly_correlated: list[dict[str, Any]] = []
        for left_index, left in enumerate(self.feature_columns):
            for right in self.feature_columns[left_index + 1 :]:
                value = correlations.loc[left, right]
                if pd.notna(value) and abs(float(value)) >= 0.95:
                    highly_correlated.append(
                        {
                            "features": [left, right],
                            "spearman": round(float(value), 4),
                        }
                    )
        if highly_correlated:
            warnings_list.append(
                "La cohorte contiene variables altamente correlacionadas; "
                "revise si duplican la misma señal."
            )

        skewed_features = {
            column: round(float(prepared[column].skew()), 4)
            for column in self.feature_columns
            if pd.notna(prepared[column].skew())
            and abs(float(prepared[column].skew())) >= 3.0
        }
        if skewed_features:
            warnings_list.append(
                "Hay variables con distribución extremadamente sesgada: "
                + ", ".join(skewed_features)
                + "."
            )

        boundary_ratios = {}
        for column in self.feature_columns:
            limits = self.DOMAIN_LIMITS[column]
            at_boundary = (
                np.isclose(prepared[column], limits["minimum"])
                | np.isclose(prepared[column], limits["maximum"])
            )
            boundary_ratios[column] = round(float(at_boundary.mean()), 4)
            if at_boundary.mean() >= 0.20:
                warnings_list.append(
                    f"Al menos 20% de '{column}' está en un límite de dominio."
                )
        if len(prepared) < 50:
            warnings_list.append(
                "La cohorte tiene menos de 50 registros; los segmentos pueden "
                "cambiar al incorporar más estudiantes."
            )
        return {
            "row_count": len(prepared),
            "duplicate_pattern_rows": duplicate_rows,
            "duplicate_id_rows": duplicate_id_count,
            "conflicting_student_ids": conflicting_id_count,
            "student_id_available": id_column is not None,
            "high_correlations": highly_correlated,
            "skewed_features": skewed_features,
            "boundary_ratios": boundary_ratios,
        }, warnings_list

    def _select_informative_features(
        self,
        data: pd.DataFrame,
    ) -> tuple[list[str], list[str], list[str]]:
        active: list[str] = []
        excluded: list[str] = []
        warnings_list: list[str] = []
        for column in self.feature_columns:
            values = data[column]
            value_frequencies = values.value_counts(normalize=True, dropna=False)
            dominant_fraction = float(value_frequencies.iloc[0])
            q1 = float(values.quantile(0.25))
            q3 = float(values.quantile(0.75))
            scale = max(abs(float(values.median())), 1.0)
            robust_constant = math.isclose(
                q1,
                q3,
                rel_tol=1e-9,
                abs_tol=1e-9 * scale,
            )
            almost_constant = (
                dominant_fraction >= self.near_constant_fraction
            )
            if values.nunique(dropna=False) <= 1 or (
                robust_constant and almost_constant
            ):
                excluded.append(column)
                warnings_list.append(
                    f"Se excluyó '{column}' por ser constante o casi constante "
                    f"(valor dominante: {dominant_fraction:.1%})."
                )
            else:
                active.append(column)
        return active, excluded, warnings_list

    def _calculate_reference_statistics(
        self,
        data: pd.DataFrame,
        columns: list[str],
    ) -> dict[str, dict[str, float]]:
        return {
            column: self._series_statistics(data[column])
            for column in columns
        }

    def _series_statistics(self, values: pd.Series) -> dict[str, float]:
        numeric = values.astype(float)
        median = float(numeric.median())
        absolute_deviation = np.abs(numeric.to_numpy() - median)
        return {
            "count": int(len(numeric)),
            "mean": float(numeric.mean()),
            "median": median,
            "q1": float(numeric.quantile(0.25)),
            "q3": float(numeric.quantile(0.75)),
            "iqr": float(numeric.quantile(0.75) - numeric.quantile(0.25)),
            "mad": float(np.median(absolute_deviation)),
            "std": float(numeric.std(ddof=0)),
            "minimum": float(numeric.min()),
            "maximum": float(numeric.max()),
            "p01": float(numeric.quantile(0.01)),
            "p99": float(numeric.quantile(0.99)),
            "q_low": float(numeric.quantile(self.low_quantile)),
            "q_high": float(numeric.quantile(self.high_quantile)),
        }

    def _build_segment_profiles(
        self,
        *,
        prepared: pd.DataFrame,
        scaled: np.ndarray,
        labels: np.ndarray,
        model: KMeans,
        scaler: RobustScaler,
        active_features: list[str],
        reference_quantiles: dict[str, dict[str, float]],
        model_run_id: str,
    ) -> tuple[
        dict[str, dict[str, Any]],
        dict[int, str],
        dict[int, np.ndarray],
        dict[str, dict[str, Any]],
    ]:
        centroids = scaler.inverse_transform(model.cluster_centers_)
        ordering = sorted(
            range(model.n_clusters),
            key=lambda cluster: tuple(centroids[cluster].tolist()),
        )
        profiles: dict[str, dict[str, Any]] = {}
        cluster_to_segment: dict[int, str] = {}
        cluster_distances: dict[int, np.ndarray] = {}
        segment_statistics: dict[str, dict[str, Any]] = {}
        used_names: set[str] = set()

        for position, raw_cluster in enumerate(ordering, start=1):
            segment_id = f"segment_{position}"
            centroid = {
                column: float(centroids[raw_cluster][index])
                for index, column in enumerate(active_features)
            }
            profile_key = self._profile_key(
                centroid,
                reference_quantiles,
            )
            content = self._profile_content(profile_key)
            unique_name = self._unique_profile_name(
                content["name"],
                centroid,
                reference_quantiles,
                used_names,
            )
            used_names.add(unique_name)
            members = labels == raw_cluster
            member_frame = prepared.loc[members, active_features]
            distances = np.linalg.norm(
                scaled[members] - model.cluster_centers_[raw_cluster],
                axis=1,
            )
            stats = {
                column: self._series_statistics(member_frame[column])
                for column in active_features
            }
            profiles[segment_id] = {
                "segment_id": segment_id,
                "segment_uid": f"{model_run_id}:{segment_id}",
                "raw_cluster": int(raw_cluster),
                "name": unique_name,
                "profile_key": profile_key,
                "description": content["description"],
                "student_count": int(members.sum()),
                "percentage": round(float(members.mean()), 4),
                "centroid": {
                    column: round(value, 4)
                    for column, value in centroid.items()
                },
                "teacher_suggestion": content["teacher_suggestion"],
            }
            cluster_to_segment[raw_cluster] = segment_id
            cluster_distances[raw_cluster] = np.sort(distances)
            segment_statistics[segment_id] = {
                "student_count": int(members.sum()),
                "features": stats,
                "distance": self._series_statistics(pd.Series(distances)),
            }
        return (
            profiles,
            cluster_to_segment,
            cluster_distances,
            segment_statistics,
        )

    def _build_prediction_result(
        self,
        row: pd.Series,
        scaled_row: np.ndarray,
        raw_cluster: int,
        distances: np.ndarray,
    ) -> dict[str, Any]:
        segment_id = self._cluster_to_segment[raw_cluster]
        profile = self.segment_profiles[segment_id]
        ordered = np.argsort(distances)
        nearest_distance = float(distances[ordered[0]])
        second_distance = float(distances[ordered[1]])
        margin = (
            second_distance - nearest_distance
        ) / max(second_distance, np.finfo(float).eps)
        ambiguous = margin < self.assignment_margin_threshold
        typicality, reference_size = self._assignment_typicality(
            raw_cluster,
            nearest_distance,
        )
        segment_size = int(profile["student_count"])
        small_sample = segment_size < self.min_segment_samples
        out_of_distribution, outlier_features = self._is_out_of_distribution(
            row
        )
        requires_review, review_reasons = self._requires_assignment_review(
            typicality=typicality,
            assignment_ambiguous=ambiguous,
            segment_sample_size=segment_size,
            out_of_distribution=out_of_distribution,
        )
        interpretation = self._assignment_interpretation(
            typicality=typicality,
            segment_name=profile["name"],
            requires_review=requires_review,
            review_reasons=review_reasons,
        )
        feature_contributions = self._feature_contributions(
            scaled_row,
            raw_cluster,
        )
        reasons = self._build_reasons(
            row=row,
            profile=profile,
            typicality=typicality,
            assignment_ambiguous=ambiguous,
            contributions=feature_contributions,
        )

        return {
            "student_id": self._optional_text(row.get("student_id")),
            "student_name": self._optional_text(row.get("student_name")),
            "model_run_id": self.model_run_id,
            "model_version": self.model_version,
            "feature_schema_version": self.feature_schema_version,
            "trained_at": self.trained_at,
            "raw_cluster": raw_cluster,
            "profile_key": profile["profile_key"],
            "segment_id": segment_id,
            "segment_uid": profile["segment_uid"],
            "segment_name": profile["name"],
            "segment_description": profile["description"],
            "assignment_typicality": typicality,
            "assignment_margin": round(margin, 4),
            "assignment_ambiguous": ambiguous,
            "nearest_cluster_distance": round(nearest_distance, 4),
            "second_cluster_distance": round(second_distance, 4),
            "segment_sample_size": segment_size,
            "typicality_reference_size": reference_size,
            "typicality_method": (
                "Percentil empírico inverso de la distancia al centroide "
                "dentro del segmento de entrenamiento."
            ),
            "typicality_small_sample_warning": small_sample,
            "out_of_distribution": out_of_distribution,
            "review_reasons": review_reasons,
            "assignment_interpretation": interpretation,
            "requires_review": requires_review,
            "teacher_summary": self._teacher_summary(
                profile,
                interpretation,
                requires_review,
            ),
            "reasons": reasons,
            "feature_values": {
                column: round(float(row[column]), 4)
                for column in self.feature_columns
            },
            "segment_comparison": self._build_segment_comparison(
                row,
                segment_id,
            ),
            "teacher_suggestion": self._teacher_suggestion(
                profile,
                requires_review,
                review_reasons,
            ),
            "model_quality": self.quality_summary(),
            "training_period": self.training_period,
            "technical_details": {
                "feature_contributions": feature_contributions,
                "second_nearest_raw_cluster": int(ordered[1]),
                "outlier_features": outlier_features,
                "active_features": list(self.active_feature_columns),
                "excluded_features": list(self.excluded_feature_columns),
                "comparison_rule": (
                    "Dentro de Q1-Q3 del segmento = rango habitual; "
                    "fuera de ese rango = por encima o por debajo."
                ),
            },
            "details": {
                "technique": self.TECHNIQUE,
                "reference_cohort_used": True,
                "individual_history_required": False,
                "accuracy_applicable": False,
                "assignment_is_conclusive": not requires_review,
                "teacher_notice": (
                    "Este resultado describe un patrón de participación. "
                    "No es una calificación, un diagnóstico ni una predicción "
                    "del rendimiento. Debe complementarse con el contexto del "
                    "estudiante."
                ),
            },
        }

    def _requires_assignment_review(
        self,
        *,
        typicality: float,
        assignment_ambiguous: bool,
        segment_sample_size: int,
        out_of_distribution: bool,
    ) -> tuple[bool, list[str]]:
        reasons = []
        if self.quality_status == "weak_review_required":
            reasons.append(
                "La calidad global de los grupos es débil; revise los datos y reentrene."
            )
        if typicality < self.typicality_threshold:
            reasons.append(
                "El registro es poco habitual dentro del patrón más cercano."
            )
        if assignment_ambiguous:
            reasons.append(
                "El registro se encuentra entre dos patrones con distancias similares."
            )
        if segment_sample_size < self.min_segment_samples:
            reasons.append(
                "El patrón tiene pocos integrantes para calibrar la tipicidad."
            )
        if out_of_distribution:
            reasons.append(
                "El registro está fuera de la distribución observada al entrenar."
            )
        return bool(reasons), reasons

    def _assignment_typicality(
        self,
        raw_cluster: int,
        distance: float,
    ) -> tuple[float, int]:
        reference = self._cluster_distances[raw_cluster]
        if len(reference) == 0:
            return 0.0, 0
        typicality = float(np.mean(reference >= distance))
        return round(typicality, 4), int(len(reference))

    def _is_out_of_distribution(
        self,
        row: pd.Series,
    ) -> tuple[bool, list[str]]:
        outlier_features = []
        for column in self.active_feature_columns:
            value = float(row[column])
            stats = self._reference_statistics[column]
            iqr = stats["iqr"]
            if math.isclose(iqr, 0.0, abs_tol=1e-12):
                mad = stats["mad"]
                if math.isclose(mad, 0.0, abs_tol=1e-12):
                    outside = not math.isclose(
                        value,
                        stats["median"],
                        rel_tol=1e-9,
                        abs_tol=1e-9,
                    )
                else:
                    outside = (
                        abs(value - stats["median"]) / mad
                        > self.outlier_iqr_multiplier
                    )
            else:
                lower = stats["q1"] - self.outlier_iqr_multiplier * iqr
                upper = stats["q3"] + self.outlier_iqr_multiplier * iqr
                outside = value < lower or value > upper
            if outside:
                outlier_features.append(column)
        return bool(outlier_features), outlier_features

    def _feature_contributions(
        self,
        scaled_row: np.ndarray,
        raw_cluster: int,
    ) -> dict[str, float]:
        squared = np.square(
            scaled_row - self.model.cluster_centers_[raw_cluster]
        )
        total = float(squared.sum())
        if math.isclose(total, 0.0, abs_tol=1e-15):
            return {
                column: 0.0 for column in self.active_feature_columns
            }
        return {
            column: round(float(squared[index] / total), 4)
            for index, column in enumerate(self.active_feature_columns)
        }

    def _build_reasons(
        self,
        *,
        row: pd.Series,
        profile: dict[str, Any],
        typicality: float,
        assignment_ambiguous: bool,
        contributions: dict[str, float],
    ) -> list[str]:
        reasons: list[str] = []
        if assignment_ambiguous:
            reasons.append(
                "Se aproxima a dos patrones; la asignación no es concluyente."
            )
        ordered_contributions = sorted(
            contributions,
            key=contributions.get,
            reverse=True,
        )
        for column in ordered_contributions:
            if contributions[column] <= 0:
                continue
            level = self._relative_level(
                column,
                float(row[column]),
                self._reference_quantiles,
            )
            if level == "high":
                position = "por encima del rango central de la cohorte"
            elif level == "low":
                position = "por debajo del rango central de la cohorte"
            else:
                position = "dentro del rango central de la cohorte"
            reasons.append(
                f"La {self.FEATURE_LABELS[column]} está {position} y "
                "contribuyó a la asignación."
            )
            if len(reasons) >= 2:
                break
        if typicality < self.typicality_threshold:
            reasons.append(
                "El comportamiento se aleja del patrón habitual de este segmento."
            )
        if not reasons:
            reasons.append(
                "Las medidas se aproximan al centro del patrón asignado."
            )
        return reasons[:3]

    def _build_segment_comparison(
        self,
        row: pd.Series,
        segment_id: str,
    ) -> dict[str, dict[str, Any]]:
        comparison = {}
        profile = self.segment_profiles[segment_id]
        stats_by_feature = self.segment_statistics[segment_id]["features"]
        for column in self.active_feature_columns:
            value = float(row[column])
            stats = stats_by_feature[column]
            center = float(profile["centroid"][column])
            if value < stats["q1"] and not math.isclose(
                value,
                stats["q1"],
                rel_tol=1e-9,
                abs_tol=1e-9,
            ):
                status = "below_segment_range"
                label = "Por debajo del rango habitual de su grupo"
                relation = "está por debajo del rango habitual"
            elif value > stats["q3"] and not math.isclose(
                value,
                stats["q3"],
                rel_tol=1e-9,
                abs_tol=1e-9,
            ):
                status = "above_segment_range"
                label = "Por encima del rango habitual de su grupo"
                relation = "está por encima del rango habitual"
            else:
                status = "within_segment_range"
                label = "Dentro del rango habitual de su grupo"
                relation = "está dentro del rango habitual"
            student_display = self._format_feature_value(column, value)
            center_display = self._format_feature_value(column, center)
            comparison[column] = {
                "metric_label": self.FEATURE_LABELS[column].capitalize(),
                "student_value": round(value, 4),
                "segment_center": round(center, 4),
                "difference": round(value - center, 4),
                "status": status,
                "status_label": label,
                "student_display": student_display,
                "segment_display": center_display,
                "message": (
                    f"{self.FEATURE_LABELS[column].capitalize()}: "
                    f"{student_display}; {relation} "
                    f"(Q1 {self._format_feature_value(column, stats['q1'])}, "
                    f"Q3 {self._format_feature_value(column, stats['q3'])})."
                ),
            }
        return comparison

    def _assignment_interpretation(
        self,
        *,
        typicality: float,
        segment_name: str,
        requires_review: bool,
        review_reasons: list[str],
    ) -> dict[str, str]:
        if requires_review:
            level = "review_required"
            label = "Patrón más cercano; requiere revisión"
            explanation = (
                f"«{segment_name}» es el patrón más cercano, pero la asignación "
                "no debe interpretarse como concluyente. "
                + " ".join(review_reasons)
            )
        elif typicality >= 0.75:
            level = "very_representative"
            label = "Muy representativo del grupo"
            explanation = (
                f"Su comportamiento coincide claramente con el patrón "
                f"«{segment_name}»."
            )
        elif typicality >= 0.40:
            level = "representative"
            label = "Representativo del grupo"
            explanation = (
                f"Su comportamiento es similar al patrón habitual "
                f"«{segment_name}»."
            )
        else:
            level = "partial_match"
            label = "Coincidencia parcial"
            explanation = (
                f"Se aproxima al patrón «{segment_name}», con diferencias "
                "que conviene observar."
            )
        return {
            "level": level,
            "label": label,
            "explanation": explanation,
            "technical_note": (
                "La tipicidad es un percentil empírico de distancia; no es "
                "una probabilidad ni una confianza probabilística."
            ),
        }

    def _teacher_summary(
        self,
        profile: dict[str, Any],
        interpretation: dict[str, str],
        requires_review: bool,
    ) -> str:
        if requires_review:
            return (
                f"Patrón más cercano: «{profile['name']}». "
                f"{interpretation['label']}; revise el caso antes de decidir."
            )
        return f"Patrón: «{profile['name']}». {profile['description']}"

    def _teacher_suggestion(
        self,
        profile: dict[str, Any],
        requires_review: bool,
        review_reasons: list[str],
    ) -> dict[str, Any]:
        if requires_review:
            if self.quality_status == "weak_review_required":
                return {
                    "priority": "high",
                    "title": "Revisar los datos y reentrenar antes de intervenir",
                    "actions": [
                        "No usar este segmento como estrategia concluyente.",
                        "Verificar la cohorte y volver a entrenar el modelo.",
                    ],
                }
            return {
                "priority": "high",
                "title": "Revisar el caso antes de asignar una estrategia",
                "actions": [
                    "Confirmar los registros de frecuencia, duración e inactividad.",
                    review_reasons[0]
                    if review_reasons
                    else "Conversar con el estudiante para conocer su contexto.",
                ],
            }
        suggestion = profile["teacher_suggestion"]
        return {
            "priority": suggestion["priority"],
            "title": suggestion["title"],
            "actions": suggestion["actions"][:2],
        }

    def _profile_key(
        self,
        centroid: dict[str, float],
        quantiles: dict[str, dict[str, float]],
    ) -> str:
        frequency = self._relative_level(
            "frecuencia_actividad",
            centroid.get("frecuencia_actividad"),
            quantiles,
        )
        duration = self._relative_level(
            "duracion_promedio_min",
            centroid.get("duracion_promedio_min"),
            quantiles,
        )
        inactivity = self._relative_level(
            "dias_inactivo",
            centroid.get("dias_inactivo"),
            quantiles,
        )
        if frequency == "low" and inactivity == "high":
            return "participacion_interrumpida"
        if frequency == "high" and duration == "high":
            return "participacion_intensiva"
        if frequency == "high" and duration == "low":
            return "actividad_frecuente_breve"
        if frequency == "low" and duration == "low":
            return "actividad_ocasional_breve"
        if inactivity == "high":
            return "continuidad_baja"
        if duration == "high":
            return "sesiones_prolongadas"
        if duration == "low":
            return "sesiones_breves_regulares"
        if inactivity == "low":
            return "participacion_constante"
        return "participacion_equilibrada"

    def _profile_content(self, key: str) -> dict[str, Any]:
        profiles = {
            "participacion_interrumpida": (
                "Participación interrumpida",
                "Registra pocas actividades y más días de inactividad.",
                "Recuperar la continuidad de forma gradual",
                ["Asignar una actividad breve y guiada.", "Acordar una fecha cercana."],
                "high",
            ),
            "participacion_intensiva": (
                "Participación intensiva",
                "Combina frecuencia alta con sesiones prolongadas.",
                "Sostener el avance sin sobrecarga",
                ["Proponer un reto opcional.", "Comprobar que la duración no refleje dificultad."],
                "low",
            ),
            "actividad_frecuente_breve": (
                "Actividad frecuente y breve",
                "Participa con frecuencia mediante sesiones relativamente cortas.",
                "Consolidar aprendizajes entre sesiones",
                ["Cerrar cada sesión con una comprobación.", "Agrupar ejercicios relacionados."],
                "medium",
            ),
            "actividad_ocasional_breve": (
                "Actividad ocasional y breve",
                "Registra frecuencia baja y sesiones cortas.",
                "Aumentar la continuidad",
                ["Programar una secuencia corta.", "Revisar barreras de acceso."],
                "medium",
            ),
            "continuidad_baja": (
                "Continuidad baja",
                "Presenta más días sin actividad que el rango central.",
                "Favorecer una práctica más constante",
                ["Proponer una meta breve.", "Revisar barreras para ingresar."],
                "medium",
            ),
            "sesiones_prolongadas": (
                "Sesiones prolongadas",
                "Sus sesiones duran más que el rango central de la cohorte.",
                "Comprobar el avance durante la sesión",
                ["Dividir la actividad en metas.", "Revisar si la duración refleja dificultad."],
                "medium",
            ),
            "sesiones_breves_regulares": (
                "Sesiones breves y regulares",
                "Realiza sesiones más cortas sin una interrupción marcada.",
                "Consolidar lo aprendido entre sesiones",
                ["Cerrar con una comprobación.", "Mantener actividades relacionadas."],
                "low",
            ),
            "participacion_constante": (
                "Participación constante",
                "Mantiene pocos días de inactividad respecto a la cohorte.",
                "Mantener la continuidad",
                ["Conservar el ritmo actual.", "Ofrecer un reto adicional."],
                "low",
            ),
            "participacion_equilibrada": (
                "Participación equilibrada",
                "Frecuencia, duración y continuidad están en el rango central.",
                "Mantener el patrón y observar su evolución",
                ["Mantener la estrategia actual.", "Revisar en el siguiente periodo."],
                "low",
            ),
        }
        name, description, title, actions, priority = profiles[key]
        return {
            "name": name,
            "description": description,
            "teacher_suggestion": {
                "priority": priority,
                "title": title,
                "actions": actions,
            },
        }

    def _unique_profile_name(
        self,
        base_name: str,
        centroid: dict[str, float],
        quantiles: dict[str, dict[str, float]],
        used_names: set[str],
    ) -> str:
        if base_name not in used_names:
            return base_name
        descriptors = []
        duration = self._relative_level(
            "duracion_promedio_min",
            centroid.get("duracion_promedio_min"),
            quantiles,
        )
        frequency = self._relative_level(
            "frecuencia_actividad",
            centroid.get("frecuencia_actividad"),
            quantiles,
        )
        if duration in {"low", "high"}:
            descriptors.append(
                "con sesiones breves"
                if duration == "low"
                else "con sesiones prolongadas"
            )
        if frequency in {"low", "high"}:
            descriptors.append(
                "con frecuencia baja"
                if frequency == "low"
                else "con frecuencia alta"
            )
        for descriptor in descriptors:
            candidate = f"{base_name} {descriptor}"
            if candidate not in used_names:
                return candidate
        # Descriptor interpretable final; evita sufijos técnicos en la UI.
        return f"{base_name} con patrón intermedio diferenciado"

    def _relative_level(
        self,
        column: str,
        value: float | None,
        quantiles: dict[str, dict[str, float]],
    ) -> str:
        if value is None or column not in quantiles:
            return "not_informative"
        low = quantiles[column]["low"]
        high = quantiles[column]["high"]
        if math.isclose(low, high, rel_tol=1e-9, abs_tol=1e-9):
            return "not_informative"
        if value < low:
            return "low"
        if value > high:
            return "high"
        return "medium"

    def _validate_temporal_metadata(
        self,
        source: pd.DataFrame,
    ) -> tuple[dict[str, Any], list[str]]:
        required = [
            "fecha_inicio_ventana",
            "fecha_fin_ventana",
            "fecha_corte",
        ]
        present = [column for column in required if column in source.columns]
        if not present:
            return {
                "available": False,
                "warning": (
                    "No se proporcionó fecha de corte ni ventana; el origen "
                    "debe garantizar que no incluye eventos futuros."
                ),
            }, [
                "No se pudo auditar fuga temporal porque faltan fechas de "
                "ventana y fecha de corte."
            ]
        if len(present) != len(required):
            raise ValueError(
                "RIA07 requiere fecha_inicio_ventana, fecha_fin_ventana y "
                "fecha_corte juntas para validar el periodo."
            )
        parsed = {
            column: pd.to_datetime(source[column], errors="coerce", utc=True)
            for column in required
        }
        if any(values.isna().any() for values in parsed.values()):
            raise ValueError("RIA07 recibió fechas temporales inválidas.")
        invalid = (
            (parsed["fecha_inicio_ventana"] > parsed["fecha_fin_ventana"])
            | (parsed["fecha_fin_ventana"] > parsed["fecha_corte"])
        )
        if invalid.any():
            rows = (np.flatnonzero(invalid.to_numpy()) + 1).tolist()
            raise ValueError(
                "RIA07 detectó ventanas temporales incoherentes en filas "
                f"{rows}."
            )
        periods = (
            parsed["fecha_fin_ventana"] - parsed["fecha_inicio_ventana"]
        ).dt.days
        if periods.nunique() > 1:
            raise ValueError(
                "RIA07 no permite periodos de observación incompatibles "
                "dentro de la misma cohorte."
            )
        return {
            "available": True,
            "period_days": int(periods.iloc[0]),
            "start_min": parsed["fecha_inicio_ventana"].min().isoformat(),
            "end_max": parsed["fecha_fin_ventana"].max().isoformat(),
            "cutoff_max": parsed["fecha_corte"].max().isoformat(),
        }, []

    def _analyze_training_code_usage(
        self,
        data: pd.DataFrame,
    ) -> dict[str, Any]:
        base = {
            "available": "uso_codigo" in data.columns,
            "role": "training_diagnostics_only",
            "used_for_segmentation": False,
            "used_for_prediction": False,
        }
        if "uso_codigo" not in data.columns:
            return base
        numeric = pd.to_numeric(data["uso_codigo"], errors="coerce")
        valid = numeric.notna() & np.isfinite(numeric) & numeric.between(0, 100)
        values = numeric[valid].astype(float)
        return {
            **base,
            "valid_rows": int(valid.sum()),
            "invalid_rows": int((~valid).sum()),
            "mean_percentage": (
                round(float(values.mean()), 4) if not values.empty else None
            ),
            "median_percentage": (
                round(float(values.median()), 4) if not values.empty else None
            ),
        }

    def _quality_status(self, silhouette: float, stability: float) -> str:
        if silhouette >= 0.5 and stability >= 0.8:
            return "strong"
        if silhouette >= 0.25 and stability >= 0.6:
            return "moderate"
        return "weak_review_required"

    def _quality_explanation(self) -> tuple[str, str, str]:
        if self.quality_status == "strong":
            return (
                "Grupos claramente diferenciados",
                "Los patrones están bien separados y son estables al submuestrear.",
                "Puede usarse para orientar el seguimiento docente.",
            )
        if self.quality_status == "moderate":
            return (
                "Grupos útiles con similitud parcial",
                "Los patrones son estables, aunque algunos casos pueden ser ambiguos.",
                "Úselo como apoyo y confirme cada caso con su contexto.",
            )
        if self.quality_status == "weak_review_required":
            return (
                "Grupos poco diferenciados",
                "Los datos no separan con claridad los patrones de participación.",
                "Revise los datos y reentrene antes de usar recomendaciones.",
            )
        return (
            "Calidad aún no evaluada",
            "El modelo todavía no ha sido entrenado.",
            "Entrene RIA07 antes de interpretar segmentos.",
        )

    def _candidate_for_presentation(
        self,
        candidate: dict[str, Any],
    ) -> dict[str, Any]:
        return {
            "clusters": candidate["clusters"],
            "silhouette": round(candidate["silhouette_raw"], 4),
            "davies_bouldin": round(candidate["davies_bouldin_raw"], 4),
            "calinski_harabasz": round(
                candidate["calinski_harabasz_raw"],
                4,
            ),
            "stability_ari": round(candidate["stability_mean_raw"], 4),
            "stability_std": round(candidate["stability_std_raw"], 4),
            "stability_valid_iterations": candidate[
                "stability_valid_iterations"
            ],
            "balance_entropy": round(candidate["balance_entropy_raw"], 4),
            "balance_score": round(candidate["balance_entropy_raw"], 4),
            "balance_penalty": round(candidate["balance_penalty_raw"], 6),
            "complexity_penalty": round(
                candidate["complexity_penalty_raw"],
                6,
            ),
            "selection_score": round(candidate["selection_score_raw"], 6),
            "selection_score_raw": candidate["selection_score_raw"],
            "cluster_sizes": candidate["cluster_sizes"],
            "cluster_percentages": [
                round(value, 4)
                for value in candidate["cluster_percentages_raw"]
            ],
            "minimum_cluster_size": candidate["minimum_cluster_size"],
            "maximum_cluster_size": candidate["maximum_cluster_size"],
            "required_minimum_cluster_size": candidate[
                "required_minimum_cluster_size"
            ],
            "accepted": candidate["accepted"],
            "decision_reason": candidate["decision_reason"],
        }

    def _format_feature_value(self, column: str, value: float) -> str:
        if column == "frecuencia_actividad":
            return f"{value:.1f} actividades"
        if column == "duracion_promedio_min":
            return f"{value:.1f} minutos"
        return f"{value:.1f} días"

    def _ensure_fitted(self) -> None:
        if not self.is_fitted or self.model is None:
            raise RuntimeError("RIA07 debe entrenarse antes de predecir.")

    def _coerce_input(
        self,
        data: pd.DataFrame | dict[str, Any] | list[dict[str, Any]],
    ) -> pd.DataFrame:
        if isinstance(data, pd.DataFrame):
            return data.copy(deep=True).reset_index(drop=True)
        if isinstance(data, dict):
            return pd.DataFrame([data])
        if isinstance(data, list):
            return pd.DataFrame(data)
        raise TypeError("RIA07 requiere un diccionario, una lista o un DataFrame.")

    def _optional_text(self, value: Any) -> str | None:
        if value is None or pd.isna(value):
            return None
        text = str(value).strip()
        return text or None

    def _round_optional(self, value: float | None) -> float | None:
        return None if value is None else round(float(value), 4)

    @classmethod
    def _validate_loaded_artifact(cls, loaded: Any) -> None:
        if not isinstance(loaded, cls):
            raise TypeError(
                "El artefacto RIA07 no contiene un AnalizadorPatronesEstudiantiles."
            )
        if getattr(loaded, "model_version", None) != cls.MODEL_VERSION:
            raise ValueError("Versión de modelo RIA07 incompatible.")
        if (
            getattr(loaded, "feature_schema_version", None)
            != cls.FEATURE_SCHEMA_VERSION
        ):
            raise ValueError("Versión del esquema de características incompatible.")
        required = (
            "model",
            "scaler",
            "active_feature_columns",
            "segment_profiles",
            "segment_statistics",
            "_cluster_to_segment",
            "_cluster_distances",
            "_reference_statistics",
            "model_run_id",
            "trained_at",
        )
        missing = [name for name in required if not hasattr(loaded, name)]
        if missing or not loaded.is_fitted or loaded.model is None:
            raise ValueError(
                "Artefacto RIA07 incompleto. Faltan: "
                + (", ".join(missing) if missing else "estado entrenado")
                + "."
            )

    @staticmethod
    def _validate_configuration(**values: Any) -> None:
        if values["min_training_samples"] < 6:
            raise ValueError("min_training_samples debe ser al menos 6")
        if values["max_clusters"] < 2:
            raise ValueError("max_clusters debe ser al menos 2")
        if values["stability_iterations"] < 10:
            raise ValueError("stability_iterations debe ser al menos 10")
        if not 0.70 <= values["stability_sample_fraction"] <= 0.90:
            raise ValueError(
                "stability_sample_fraction debe estar entre 0.70 y 0.90"
            )
        for name in (
            "typicality_threshold",
            "assignment_margin_threshold",
            "min_cluster_fraction",
        ):
            if not 0 < values[name] < 1:
                raise ValueError(f"{name} debe estar entre 0 y 1")
        if values["min_segment_samples"] < 2:
            raise ValueError("min_segment_samples debe ser al menos 2")
        if not 0 < values["low_quantile"] < values["high_quantile"] < 1:
            raise ValueError(
                "low_quantile y high_quantile deben cumplir 0 < low < high < 1"
            )
        if values["kmeans_n_init"] < 1:
            raise ValueError("kmeans_n_init debe ser positivo")
        if values["complexity_penalty"] < 0:
            raise ValueError("complexity_penalty no puede ser negativo")
        if values["max_batch_size"] < 1:
            raise ValueError("max_batch_size debe ser positivo")
        if values["outlier_iqr_multiplier"] <= 0:
            raise ValueError("outlier_iqr_multiplier debe ser positivo")
        if not 0.90 <= values["near_constant_fraction"] <= 1:
            raise ValueError(
                "near_constant_fraction debe estar entre 0.90 y 1"
            )
