from __future__ import annotations

import json
import math
from typing import Any

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score
from sklearn.model_selection import train_test_split


class ClasificadorErroresLogicos:
    """
    RIA05: clasificación multiclase del tipo de error lógico.

    La entrada representa la telemetría de una ejecución del simulador:
    resultado esperado y obtenido, posición del robot, sensores, instrucciones,
    colisiones y paso de interrupción. La primera versión puede entrenarse con
    prototipos sintéticos reproducibles; esas métricas no sustituyen una
    validación con errores etiquetados por docentes.
    """

    MODEL_VERSION = "ria05-errors-v2"
    TECHNIQUE = "Random Forest multiclase"
    TARGET_COLUMN = "error_type"
    MAX_BATCH_SIZE = 500

    ERROR_LABELS = {
        "incorrect_sequence": "Secuencia incorrecta",
        "defective_loop": "Ciclo defectuoso",
        "incorrect_condition": "Condición incorrecta",
        "misused_sensor": "Sensor mal utilizado",
        "invalid_route": "Ruta inválida",
        "incomplete_objective": "Objetivo incompleto",
    }

    FEATURE_COLUMNS = [
        "result_match",
        "position_distance",
        "sensor_count",
        "sensor_mismatch_ratio",
        "instruction_count",
        "loop_count",
        "condition_count",
        "collision_count",
        "interruption_ratio",
        "completion_ratio",
        "execution_ratio",
    ]

    def __init__(
        self,
        *,
        random_state: int = 42,
        n_estimators: int = 400,
        confidence_review_threshold: float = 0.55,
    ) -> None:
        if n_estimators < 50:
            raise ValueError("n_estimators debe ser al menos 50.")
        if not 0 < confidence_review_threshold < 1:
            raise ValueError(
                "confidence_review_threshold debe estar entre 0 y 1."
            )
        self.random_state = int(random_state)
        self.n_estimators = int(n_estimators)
        self.confidence_review_threshold = float(
            confidence_review_threshold
        )
        self.model_version = self.MODEL_VERSION
        self.feature_columns = list(self.FEATURE_COLUMNS)
        self.model = self._new_model()
        self.is_fitted = False
        self.training_source = "not_trained"
        self.validation_accuracy: float | None = None
        self.validation_precision: float | None = None
        self.metrics_note = (
            "La exactitud sobre prototipos sintéticos solo verifica consistencia "
            "técnica. La calidad pedagógica requiere datos reales etiquetados."
        )

    def train(
        self,
        data: pd.DataFrame | list[dict[str, Any]] | None = None,
    ) -> None:
        """
        Entrena con datos etiquetados o con prototipos reproducibles.

        Un conjunto real debe incluir ``error_type`` y puede contener las
        variables numéricas canónicas o la telemetría original del simulador.
        """
        if data is None:
            features, target = self._synthetic_training_data()
            source = "synthetic_prototypes"
        else:
            frame = self._coerce_frame(data)
            if self.TARGET_COLUMN not in frame.columns:
                raise ValueError(
                    "RIA05 requiere la columna etiquetada 'error_type' para "
                    "entrenar con datos proporcionados."
                )
            target = frame[self.TARGET_COLUMN].astype(str)
            unknown = sorted(set(target) - set(self.ERROR_LABELS))
            if unknown:
                raise ValueError(
                    "RIA05 recibió tipos de error desconocidos: "
                    + ", ".join(unknown)
                    + "."
                )
            if set(self.feature_columns).issubset(frame.columns):
                features = self._validate_feature_frame(
                    frame[self.feature_columns]
                )
            else:
                records = frame.drop(columns=[self.TARGET_COLUMN]).to_dict(
                    orient="records"
                )
                features = pd.DataFrame(
                    [self._extract_features(record) for record in records],
                    columns=self.feature_columns,
                )
            source = "labeled_records"

        if len(features) < 30:
            raise ValueError("RIA05 requiere al menos 30 ejemplos etiquetados.")
        if target.nunique() < 2:
            raise ValueError("RIA05 requiere al menos dos tipos de error.")

        stratify = target if target.value_counts().min() >= 2 else None
        train_x, test_x, train_y, test_y = train_test_split(
            features,
            target,
            test_size=0.25,
            random_state=self.random_state,
            stratify=stratify,
        )
        local_model = self._new_model()
        local_model.fit(train_x, train_y)
        predictions = local_model.predict(test_x)
        validation_accuracy = float(accuracy_score(test_y, predictions))
        validation_precision = float(
            precision_score(
                test_y,
                predictions,
                average="weighted",
                zero_division=0,
            )
        )

        self.model = local_model
        self.training_source = source
        self.validation_accuracy = round(validation_accuracy, 4)
        self.validation_precision = round(validation_precision, 4)
        self.is_fitted = True

    def predict(self, data: dict[str, Any] | pd.DataFrame) -> str:
        """Devuelve la clave estable del tipo de error."""
        return self.predict_detailed(data)["error_type"]

    def predict_detailed(
        self,
        data: dict[str, Any] | pd.DataFrame,
    ) -> dict[str, Any]:
        """Clasifica una ejecución y devuelve explicación y probabilidades."""
        self._ensure_fitted()
        frame = self._coerce_frame(data)
        if len(frame) != 1:
            raise ValueError(
                "predict_detailed requiere exactamente una ejecución."
            )
        features = self._prepare_prediction_features(frame)
        probabilities = self.model.predict_proba(features)[0]
        predicted_index = int(np.argmax(probabilities))
        error_type = str(self.model.classes_[predicted_index])
        confidence = float(probabilities[predicted_index])
        row = features.iloc[0]
        return {
            "result": error_type,
            "error_type": error_type,
            "error_label": self.ERROR_LABELS[error_type],
            "confidence": round(confidence, 4),
            "requires_review": confidence < self.confidence_review_threshold,
            "reasons": self._build_reasons(row, error_type),
            "probabilities": {
                str(label): round(float(probability), 4)
                for label, probability in zip(
                    self.model.classes_,
                    probabilities,
                )
            },
            "feature_values": {
                column: round(float(row[column]), 4)
                for column in self.feature_columns
            },
            "details": {
                "technique": self.TECHNIQUE,
                "model_version": self.model_version,
                "training_source": self.training_source,
                "validation_accuracy": self.validation_accuracy,
                "validation_precision": self.validation_precision,
                "metrics_note": self.metrics_note,
                "teacher_notice": (
                    "El resultado orienta la revisión del docente. No demuestra "
                    "la causa del error y debe contrastarse con la ejecución."
                ),
            },
        }

    def predict_batch(
        self,
        data: pd.DataFrame | list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """Clasifica hasta 500 ejecuciones en una única operación vectorizada."""
        self._ensure_fitted()
        frame = self._coerce_frame(data)
        if frame.empty:
            raise ValueError("predict_batch requiere al menos una ejecución.")
        if len(frame) > self.MAX_BATCH_SIZE:
            raise ValueError(
                f"RIA05 admite como máximo {self.MAX_BATCH_SIZE} ejecuciones."
            )
        features = self._prepare_prediction_features(frame)
        probability_matrix = self.model.predict_proba(features)
        results = []
        for index, probabilities in enumerate(probability_matrix):
            predicted_index = int(np.argmax(probabilities))
            error_type = str(self.model.classes_[predicted_index])
            confidence = float(probabilities[predicted_index])
            row = features.iloc[index]
            results.append({
                "result": error_type,
                "error_type": error_type,
                "error_label": self.ERROR_LABELS[error_type],
                "confidence": round(confidence, 4),
                "requires_review": (
                    confidence < self.confidence_review_threshold
                ),
                "reasons": self._build_reasons(row, error_type),
                "probabilities": {
                    str(label): round(float(probability), 4)
                    for label, probability in zip(
                        self.model.classes_,
                        probabilities,
                    )
                },
                "feature_values": {
                    column: round(float(row[column]), 4)
                    for column in self.feature_columns
                },
                "details": {
                    "technique": self.TECHNIQUE,
                    "model_version": self.model_version,
                    "training_source": self.training_source,
                    "validation_accuracy": self.validation_accuracy,
                    "validation_precision": self.validation_precision,
                    "metrics_note": self.metrics_note,
                },
            })
        return results

    def _new_model(self) -> RandomForestClassifier:
        return RandomForestClassifier(
            n_estimators=self.n_estimators,
            max_depth=12,
            min_samples_leaf=2,
            class_weight="balanced_subsample",
            random_state=self.random_state,
            n_jobs=-1,
        )

    def _prepare_prediction_features(
        self,
        frame: pd.DataFrame,
    ) -> pd.DataFrame:
        if set(self.feature_columns).issubset(frame.columns):
            return self._validate_feature_frame(frame[self.feature_columns])
        return self._validate_feature_frame(pd.DataFrame(
            [
                self._extract_features(record)
                for record in frame.to_dict(orient="records")
            ],
            columns=self.feature_columns,
        ))

    def _extract_features(self, record: dict[str, Any]) -> dict[str, float]:
        expected = record.get("expected_result", record.get(
            "resultado_esperado"
        ))
        obtained = record.get("obtained_result", record.get(
            "resultado_obtenido"
        ))
        if expected is None or obtained is None:
            raise ValueError(
                "RIA05 requiere resultado_esperado y resultado_obtenido."
            )

        expected_position = self._position_from(
            record.get("expected_position")
            or self._nested_value(expected, "position", "posicion")
        )
        obtained_position = self._position_from(
            record.get("robot_position")
            or record.get("posicion_robot")
            or self._nested_value(obtained, "position", "posicion")
        )
        position_distance = math.dist(
            expected_position,
            obtained_position,
        )

        sensor_payload = record.get(
            "sensor_states",
            record.get("estados_sensores", {}),
        )
        expected_sensors, obtained_sensors = self._sensor_states(
            sensor_payload,
            expected,
            obtained,
        )
        sensor_names = set(expected_sensors) | set(obtained_sensors)
        mismatches = sum(
            expected_sensors.get(name) != obtained_sensors.get(name)
            for name in sensor_names
        )
        sensor_count = len(sensor_names)
        sensor_mismatch_ratio = (
            mismatches / sensor_count if sensor_count else 0.0
        )

        instructions = record.get(
            "instructions_used",
            record.get("instrucciones_utilizadas", []),
        )
        instruction_tokens = self._instruction_tokens(instructions)
        loop_count = sum(
            token in {"repeat", "loop", "while", "for", "repetir", "ciclo"}
            for token in instruction_tokens
        )
        condition_count = sum(
            token in {"if", "else", "si", "condicion", "condition"}
            for token in instruction_tokens
        )
        collisions = record.get(
            "collisions",
            record.get("colisiones", 0),
        )
        collision_count = (
            len(collisions)
            if isinstance(collisions, (list, tuple, set, dict))
            else self._non_negative_float(collisions, "colisiones")
        )
        interruption_step = record.get(
            "interruption_step",
            record.get("paso_interrupcion"),
        )
        instruction_count = len(instruction_tokens)
        interruption_ratio = self._ratio_from_step(
            interruption_step,
            instruction_count,
        )
        executed_steps = self._nested_value(
            obtained,
            "executed_steps",
            "pasos_ejecutados",
            default=instruction_count,
        )
        execution_ratio = (
            self._non_negative_float(executed_steps, "pasos_ejecutados")
            / max(instruction_count, 1)
        )
        completion_ratio = self._completion_ratio(record, obtained)
        result_match = float(self._normalized_equal(expected, obtained))

        return {
            "result_match": result_match,
            "position_distance": position_distance,
            "sensor_count": float(sensor_count),
            "sensor_mismatch_ratio": sensor_mismatch_ratio,
            "instruction_count": float(instruction_count),
            "loop_count": float(loop_count),
            "condition_count": float(condition_count),
            "collision_count": float(collision_count),
            "interruption_ratio": interruption_ratio,
            "completion_ratio": completion_ratio,
            "execution_ratio": execution_ratio,
        }

    def _synthetic_training_data(self) -> tuple[pd.DataFrame, pd.Series]:
        rng = np.random.default_rng(self.random_state)
        rows: list[dict[str, float]] = []
        labels: list[str] = []
        for error_type in self.ERROR_LABELS:
            for _ in range(160):
                row = self._synthetic_prototype(error_type, rng)
                rows.append(row)
                labels.append(error_type)
        return (
            pd.DataFrame(rows, columns=self.feature_columns),
            pd.Series(labels, name=self.TARGET_COLUMN),
        )

    def _synthetic_prototype(
        self,
        error_type: str,
        rng: np.random.Generator,
    ) -> dict[str, float]:
        row = {
            "result_match": 0.0,
            "position_distance": float(rng.uniform(0, 2)),
            "sensor_count": float(rng.integers(0, 5)),
            "sensor_mismatch_ratio": float(rng.uniform(0, 0.15)),
            "instruction_count": float(rng.integers(3, 20)),
            "loop_count": float(rng.integers(0, 2)),
            "condition_count": float(rng.integers(0, 2)),
            "collision_count": 0.0,
            "interruption_ratio": float(rng.uniform(0.65, 1.0)),
            "completion_ratio": float(rng.uniform(0.65, 0.95)),
            "execution_ratio": float(rng.uniform(0.65, 1.15)),
        }
        if error_type == "incorrect_sequence":
            row.update({
                "position_distance": float(rng.uniform(1, 4)),
                "loop_count": 0.0,
                "condition_count": 0.0,
                "execution_ratio": float(rng.uniform(0.55, 0.9)),
            })
        elif error_type == "defective_loop":
            row.update({
                "loop_count": float(rng.integers(1, 5)),
                "execution_ratio": float(
                    rng.choice([
                        rng.uniform(0.15, 0.55),
                        rng.uniform(1.4, 2.5),
                    ])
                ),
                "interruption_ratio": float(rng.uniform(0.15, 0.75)),
            })
        elif error_type == "incorrect_condition":
            row.update({
                "condition_count": float(rng.integers(1, 5)),
                "sensor_mismatch_ratio": float(rng.uniform(0, 0.25)),
                "completion_ratio": float(rng.uniform(0.45, 0.85)),
            })
        elif error_type == "misused_sensor":
            row.update({
                "sensor_count": float(rng.integers(1, 7)),
                "sensor_mismatch_ratio": float(rng.uniform(0.45, 1.0)),
                "condition_count": float(rng.integers(0, 3)),
            })
        elif error_type == "invalid_route":
            row.update({
                "position_distance": float(rng.uniform(4, 14)),
                "collision_count": float(rng.integers(1, 7)),
                "completion_ratio": float(rng.uniform(0.35, 0.85)),
            })
        elif error_type == "incomplete_objective":
            row.update({
                "position_distance": float(rng.uniform(0, 3)),
                "completion_ratio": float(rng.uniform(0.05, 0.45)),
                "interruption_ratio": float(rng.uniform(0.05, 0.45)),
                "execution_ratio": float(rng.uniform(0.2, 0.75)),
            })
        return row

    def _build_reasons(
        self,
        row: pd.Series,
        error_type: str,
    ) -> list[str]:
        messages = {
            "incorrect_sequence": (
                "El orden o la cantidad de instrucciones ejecutadas no coincide "
                "con el resultado esperado."
            ),
            "defective_loop": (
                "La ejecución contiene ciclos y una diferencia relevante entre "
                "los pasos previstos y ejecutados."
            ),
            "incorrect_condition": (
                "Las condiciones utilizadas no conducen al estado esperado."
            ),
            "misused_sensor": (
                "Los estados de sensores obtenidos difieren de los esperados."
            ),
            "invalid_route": (
                "La posición final o las colisiones indican una ruta no válida."
            ),
            "incomplete_objective": (
                "La ejecución se interrumpió antes de completar el objetivo."
            ),
        }
        reasons = [messages[error_type]]
        if row["collision_count"] > 0:
            reasons.append(
                f"Se registraron {row['collision_count']:.0f} colisiones."
            )
        if row["sensor_mismatch_ratio"] > 0:
            reasons.append(
                "Existen diferencias entre los sensores esperados y obtenidos."
            )
        return reasons[:3]

    def _validate_feature_frame(self, frame: pd.DataFrame) -> pd.DataFrame:
        result = frame.copy(deep=True)
        for column in self.feature_columns:
            result[column] = pd.to_numeric(result[column], errors="coerce")
            invalid = result[column].isna() | ~np.isfinite(result[column])
            if invalid.any():
                raise ValueError(
                    f"RIA05 recibió valores inválidos en '{column}'."
                )
            if (result[column] < 0).any():
                raise ValueError(
                    f"RIA05 requiere '{column}' mayor o igual a cero."
                )
        bounded = [
            "result_match",
            "sensor_mismatch_ratio",
            "interruption_ratio",
            "completion_ratio",
        ]
        for column in bounded:
            if (result[column] > 1).any():
                raise ValueError(
                    f"RIA05 requiere '{column}' entre 0 y 1."
                )
        return result[self.feature_columns]

    def _sensor_states(
        self,
        payload: Any,
        expected: Any,
        obtained: Any,
    ) -> tuple[dict[str, Any], dict[str, Any]]:
        if isinstance(payload, dict):
            expected_payload = payload.get(
                "expected",
                payload.get("esperado"),
            )
            obtained_payload = payload.get(
                "obtained",
                payload.get("obtenido"),
            )
            if isinstance(expected_payload, dict) and isinstance(
                obtained_payload,
                dict,
            ):
                return expected_payload, obtained_payload
        expected_sensors = self._nested_value(
            expected,
            "sensors",
            "sensores",
            default={},
        )
        obtained_sensors = self._nested_value(
            obtained,
            "sensors",
            "sensores",
            default=payload if isinstance(payload, dict) else {},
        )
        return (
            expected_sensors if isinstance(expected_sensors, dict) else {},
            obtained_sensors if isinstance(obtained_sensors, dict) else {},
        )

    def _position_from(self, value: Any) -> tuple[float, float]:
        if isinstance(value, dict):
            return (
                float(value.get("x", 0)),
                float(value.get("y", 0)),
            )
        if isinstance(value, (list, tuple)) and len(value) >= 2:
            return float(value[0]), float(value[1])
        return 0.0, 0.0

    def _instruction_tokens(self, value: Any) -> list[str]:
        if isinstance(value, str):
            normalized = value.replace(",", " ").replace(";", " ")
            return [token.lower() for token in normalized.split() if token]
        if isinstance(value, dict):
            value = list(value.values())
        if isinstance(value, (list, tuple, set)):
            tokens = []
            for item in value:
                if isinstance(item, dict):
                    token = item.get("type", item.get("tipo", ""))
                else:
                    token = item
                tokens.append(str(token).strip().lower())
            return [token for token in tokens if token]
        return []

    def _completion_ratio(
        self,
        record: dict[str, Any],
        obtained: Any,
    ) -> float:
        value = record.get(
            "completion_ratio",
            record.get(
                "porcentaje_objetivo",
                self._nested_value(
                    obtained,
                    "completion_ratio",
                    "porcentaje_objetivo",
                    default=None,
                ),
            ),
        )
        if value is None:
            return float(self._normalized_equal(
                record.get("expected_result", record.get("resultado_esperado")),
                obtained,
            ))
        numeric = self._non_negative_float(value, "completion_ratio")
        if numeric > 1 and numeric <= 100:
            numeric /= 100
        return float(np.clip(numeric, 0, 1))

    def _ratio_from_step(
        self,
        step: Any,
        instruction_count: int,
    ) -> float:
        if step is None:
            return 1.0
        numeric = self._non_negative_float(step, "paso_interrupcion")
        return float(np.clip(numeric / max(instruction_count, 1), 0, 1))

    def _normalized_equal(self, left: Any, right: Any) -> bool:
        return json.dumps(
            left,
            sort_keys=True,
            ensure_ascii=False,
            default=str,
        ) == json.dumps(
            right,
            sort_keys=True,
            ensure_ascii=False,
            default=str,
        )

    def _nested_value(
        self,
        value: Any,
        *keys: str,
        default: Any = None,
    ) -> Any:
        if not isinstance(value, dict):
            return default
        for key in keys:
            if key in value:
                return value[key]
        return default

    def _non_negative_float(self, value: Any, field: str) -> float:
        try:
            numeric = float(value)
        except (TypeError, ValueError) as exc:
            raise ValueError(
                f"RIA05 requiere un valor numérico en '{field}'."
            ) from exc
        if not math.isfinite(numeric) or numeric < 0:
            raise ValueError(
                f"RIA05 requiere '{field}' mayor o igual a cero."
            )
        return numeric

    def _coerce_frame(
        self,
        data: pd.DataFrame | dict[str, Any] | list[dict[str, Any]],
    ) -> pd.DataFrame:
        if isinstance(data, pd.DataFrame):
            return data.copy(deep=True).reset_index(drop=True)
        if isinstance(data, dict):
            return pd.DataFrame([data])
        if isinstance(data, list):
            return pd.DataFrame(data)
        raise TypeError(
            "RIA05 requiere un diccionario, una lista o un DataFrame."
        )

    def _ensure_fitted(self) -> None:
        if not self.is_fitted:
            raise RuntimeError("RIA05 debe entrenarse antes de predecir.")
