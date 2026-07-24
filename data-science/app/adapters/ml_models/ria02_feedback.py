from collections import Counter
import math
import unicodedata

import pandas as pd
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split


class RetroalimentacionAutomatica:
    """
    Rule-based feedback engine for RIA-02.

    The class calibrates thresholds using only signals available before an
    activity is finished: current errors and attempts. Score/success_rate may be
    received for context, but they are not used to decide whether guidance is
    needed because they can be unavailable or leak final performance.
    """

    TARGET_COLUMNS = [
        "requires_feedback",
        "requiere_retroalimentacion",
        "rendimiento",
        "nivel_desempeno",
    ]
    MIN_ERROR_THRESHOLD = 1.0
    MIN_ATTEMPT_THRESHOLD = 2.0
    MIN_LABELED_ROWS = 20
    MIN_CLASS_ROWS = 5

    def __init__(
        self,
        error_threshold_percentiles=None,
        attempt_threshold_percentiles=None,
        risk_cutoffs=None,
        recurrent_error_weights=None,
        code_complexity_weights=None,
    ):
        self.model_version = "ria02-v4"

        self.feature_columns = [
            "code",
            "language",
            "errors",
            "attempts",
            "previous_errors",
            "logical_level",
            "activity_objective",
        ]
        self.optional_context_columns = ["score", "success_rate"]
        self.calibration_columns = ["errors_count", "attempts"]

        self.accuracy = None
        self.precision = None
        self.recall = None
        self.f1 = None
        self.confusion_matrix = []
        self.baseline_metrics = {}
        self.rule_search_report = []
        self.best_config = {}
        self.metrics_note = "Metrics require an independent target column."

        self.error_threshold = 5.0
        self.attempt_threshold = 5.0
        self.error_threshold_percentile = 0.85
        self.attempt_threshold_percentile = 0.85
        self.risk_cutoff = 3
        self.recurrent_error_weight = 2
        self.code_complexity_weight = 1
        self.feedback_type_weight = 1
        self.logical_level_weight = 1
        self.previous_errors_weight = 1
        self.min_recall_for_selection = 0.60
        self.min_f1_for_selection = 0.60
        self.recurrent_error_min_count = 2
        self.is_calibrated = False

        self.error_threshold_percentiles = error_threshold_percentiles or [0.75, 0.80, 0.85, 0.90]
        self.attempt_threshold_percentiles = attempt_threshold_percentiles or [0.75, 0.80, 0.85, 0.90]
        self.risk_cutoffs = risk_cutoffs or [2, 3, 4]
        self.recurrent_error_weights = recurrent_error_weights or [1, 2, 3]
        self.code_complexity_weights = code_complexity_weights or [0, 1, 2]

    def train(self, df):
        self.calibrate_rules(df)

    def calibrate_rules(self, df):
        data = self._prepare_training_frame(df)
        target = self._build_independent_target(data)

        if target is None:
            self._fit_thresholds(data)
            self._clear_metrics(
                "No se encontro una etiqueta independiente para evaluar RIA02; "
                "solo se calibraron umbrales de la cohorte."
            )
            self.is_calibrated = True
            return

        valid_target = target.notna()
        labeled_data = data.loc[valid_target].copy()
        labeled_target = target.loc[valid_target].astype(bool)
        class_counts = labeled_target.value_counts()
        enough_labels = (
            len(labeled_data) >= self.MIN_LABELED_ROWS
            and len(class_counts) == 2
            and class_counts.min() >= self.MIN_CLASS_ROWS
        )
        if not enough_labels:
            self._fit_thresholds(data)
            self._clear_metrics(
                "La etiqueta independiente no tiene suficientes filas o clases "
                "para una division train/validation/test confiable; solo se "
                "calibraron umbrales de la cohorte."
            )
            self.is_calibrated = True
            return

        try:
            train_df, temp_df, _, y_temp = train_test_split(
                labeled_data,
                labeled_target,
                test_size=0.4,
                stratify=labeled_target,
                random_state=42,
            )
            validation_df, test_df, y_validation, y_test = train_test_split(
                temp_df,
                y_temp,
                test_size=0.5,
                stratify=y_temp,
                random_state=42,
            )
        except ValueError:
            self._fit_thresholds(data)
            self._clear_metrics(
                "No fue posible crear divisiones estratificadas confiables; "
                "solo se calibraron umbrales de la cohorte."
            )
            self.is_calibrated = True
            return

        self.baseline_metrics = self._baseline_metrics(train_df, test_df, y_test)
        self._select_best_rules(train_df, validation_df, y_validation)
        y_pred = self._predict_training_frame(test_df)
        self._set_metrics(y_test, y_pred)
        self.is_calibrated = True

    def predict_detailed(self, data):
        row = self._normalize_runtime_input(data)

        code_complexity = self._code_complexity(row["code"])
        recurrent_errors = self._recurrent_errors(row["errors"], row["previous_errors"])
        feedback_type = self._feedback_type(row["errors"], recurrent_errors, code_complexity)
        risk_score = self._risk_score(
            len(row["errors"]),
            row["attempts"],
            recurrent_errors,
            code_complexity,
            feedback_type,
            row["logical_level"],
            row["previous_errors"],
        )
        needs_feedback = risk_score >= self.risk_cutoff
        priority = self._priority(risk_score)
        result = "needs_guidance" if needs_feedback else "on_track"
        suggestions = self._suggestions(
            feedback_type,
            recurrent_errors,
            code_complexity,
            row["attempts"],
        )

        return {
            "result": result,
            "needs_feedback": needs_feedback,
            "feedback_type": feedback_type,
            "priority": priority,
            "risk_score": risk_score,
            "risk_cutoff": self.risk_cutoff,
            "reasons": self._risk_reasons(
                row,
                recurrent_errors,
                code_complexity,
                feedback_type,
            ),
            "recurrent_errors": recurrent_errors,
            "code_complexity": code_complexity,
            "suggestions": suggestions,
            "evidence": {
                "errors_count": row["errors_count"],
                "attempts": row["attempts"],
                "error_threshold": round(self.error_threshold, 2),
                "attempt_threshold": round(self.attempt_threshold, 2),
                "recurrent_errors_count": len(recurrent_errors),
                "final_score_used_for_decision": False,
            },
            "input_warnings": self._input_warnings(row),
            "llm_context": self._build_llm_context(row, feedback_type, priority, recurrent_errors),
        }

    def _prepare_training_frame(self, df):
        if not isinstance(df, pd.DataFrame) or df.empty:
            raise ValueError("RIA02 requires a non-empty pandas DataFrame")

        data = df.copy()

        rename_map = {
            "errores": "errors_count",
            "intentos": "attempts",
            "nivel_logico": "logical_level",
            "puntaje": "score",
            "tasa_exito": "success_rate",
        }
        data = data.rename(columns={key: value for key, value in rename_map.items() if key in data.columns})

        for col in ["errors_count", "attempts"]:
            if col not in data.columns:
                data[col] = 0
            data[col] = pd.to_numeric(data[col], errors="coerce").fillna(0).clip(lower=0)

        if "logical_level" not in data.columns:
            data["logical_level"] = "medio"
        data["logical_level"] = data["logical_level"].astype(str).str.strip().str.lower()
        data["code"] = data.apply(self._synthetic_training_code, axis=1)
        data["errors"] = data.apply(self._synthetic_training_errors, axis=1)
        data["previous_errors"] = data["errors"].apply(
            lambda errors: errors + [errors[0]] if errors and errors[0] != "minor_review" else []
        )
        data["code_complexity"] = data["code"].apply(self._code_complexity)
        data["recurrent_errors"] = data.apply(
            lambda row: self._recurrent_errors(row["errors"], row["previous_errors"]),
            axis=1,
        )
        data["feedback_type"] = data.apply(
            lambda row: self._feedback_type(row["errors"], row["recurrent_errors"], row["code_complexity"]),
            axis=1,
        )
        data["previous_errors_count"] = data["previous_errors"].apply(len)

        return data

    def _build_independent_target(self, data):
        for column in self.TARGET_COLUMNS:
            if column not in data.columns:
                continue

            values = data[column]
            if column in {"requires_feedback", "requiere_retroalimentacion"}:
                return values.apply(self._parse_boolean_target).astype("boolean")

            normalized = values.astype(str).str.strip().str.lower()
            if column == "rendimiento":
                return normalized.eq("bajo").where(values.notna()).astype("boolean")
            if column == "nivel_desempeno":
                return normalized.isin(
                    {"bajo", "requiere_apoyo", "needs_guidance"}
                ).where(values.notna()).astype("boolean")

        return None

    def _fit_thresholds(self, data, error_percentile=None, attempt_percentile=None):
        if error_percentile is not None:
            self.error_threshold_percentile = error_percentile
        if attempt_percentile is not None:
            self.attempt_threshold_percentile = attempt_percentile
        error_quantile = float(data["errors_count"].quantile(self.error_threshold_percentile))
        attempt_quantile = float(data["attempts"].quantile(self.attempt_threshold_percentile))
        self.error_threshold = max(self.MIN_ERROR_THRESHOLD, error_quantile)
        self.attempt_threshold = max(self.MIN_ATTEMPT_THRESHOLD, attempt_quantile)

    def _select_best_rules(self, train_df, test_df, y_test):
        self.rule_search_report = []

        for error_percentile in self.error_threshold_percentiles:
            for attempt_percentile in self.attempt_threshold_percentiles:
                self._fit_thresholds(train_df, error_percentile, attempt_percentile)
                for risk_cutoff in self.risk_cutoffs:
                    for recurrent_weight in self.recurrent_error_weights:
                        for complexity_weight in self.code_complexity_weights:
                            config = {
                                "error_threshold_percentile": error_percentile,
                                "attempt_threshold_percentile": attempt_percentile,
                                "risk_cutoff": risk_cutoff,
                                "recurrent_error_weight": recurrent_weight,
                                "code_complexity_weight": complexity_weight,
                                "feedback_type_weight": self.feedback_type_weight,
                                "logical_level_weight": self.logical_level_weight,
                                "previous_errors_weight": self.previous_errors_weight,
                            }
                            y_pred = self._predict_training_frame(test_df, config)
                            metrics = self._evaluate_config(y_test, y_pred, config)
                            self.rule_search_report.append(metrics)

        best_item = self._select_best_report_item(self.rule_search_report)
        if best_item is None:
            self._fit_thresholds(train_df)
            self.best_config = {}
            return

        best_config = best_item["config"]
        self._apply_config(best_config)
        self._fit_thresholds(
            train_df,
            best_config["error_threshold_percentile"],
            best_config["attempt_threshold_percentile"],
        )
        self.best_config = best_config

    def _select_best_report_item(self, report):
        eligible = [
            item for item in report
            if item["recall"] >= self.min_recall_for_selection
            and item["f1"] >= self.min_f1_for_selection
        ]
        candidates = eligible or report
        if not candidates:
            return None

        return max(
            candidates,
            key=lambda item: (
                item["f1"],
                item["recall"],
                item["precision"],
                item["accuracy"],
            ),
        )

    def _baseline_metrics(self, train_df, test_df, y_test):
        self._fit_thresholds(train_df, 0.75, 0.75)
        y_pred = (
            (
                (test_df["errors_count"] > 0)
                & (test_df["errors_count"] >= self.error_threshold)
            )
            | (
                (test_df["attempts"] > 0)
                & (test_df["attempts"] >= self.attempt_threshold)
            )
        )
        metrics = self._evaluate_config(
            y_test,
            y_pred,
            {
                "error_threshold_percentile": 0.75,
                "attempt_threshold_percentile": 0.75,
                "risk_cutoff": "legacy_or",
                "recurrent_error_weight": 0,
                "code_complexity_weight": 0,
                "feedback_type_weight": 0,
                "logical_level_weight": 0,
                "previous_errors_weight": 0,
            },
        )
        metrics["description"] = "Legacy OR rule: errors_count >= p75 OR attempts >= p75"
        return metrics

    def _predict_training_frame(self, data, config=None):
        config = config or self.best_config or self._current_config()
        return data.apply(
            lambda row: self._risk_score(
                row["errors_count"],
                row["attempts"],
                row["recurrent_errors"],
                row["code_complexity"],
                row["feedback_type"],
                row["logical_level"],
                row["previous_errors"],
                config,
            ) >= config["risk_cutoff"],
            axis=1,
        )

    def _evaluate_config(self, y_true, y_pred, config):
        cm = confusion_matrix(y_true, y_pred, labels=[False, True]).tolist()
        return {
            "config": config,
            "accuracy": accuracy_score(y_true, y_pred),
            "precision": precision_score(y_true, y_pred, zero_division=0),
            "recall": recall_score(y_true, y_pred, zero_division=0),
            "f1": f1_score(y_true, y_pred, zero_division=0),
            "confusion_matrix": cm,
            "false_positives": cm[0][1],
            "false_negatives": cm[1][0],
        }

    def _apply_config(self, config):
        self.error_threshold_percentile = config["error_threshold_percentile"]
        self.attempt_threshold_percentile = config["attempt_threshold_percentile"]
        self.risk_cutoff = config["risk_cutoff"]
        self.recurrent_error_weight = config["recurrent_error_weight"]
        self.code_complexity_weight = config["code_complexity_weight"]
        self.feedback_type_weight = config.get("feedback_type_weight", self.feedback_type_weight)
        self.logical_level_weight = config.get("logical_level_weight", self.logical_level_weight)
        self.previous_errors_weight = config.get("previous_errors_weight", self.previous_errors_weight)

    def _current_config(self):
        return {
            "error_threshold_percentile": self.error_threshold_percentile,
            "attempt_threshold_percentile": self.attempt_threshold_percentile,
            "risk_cutoff": self.risk_cutoff,
            "recurrent_error_weight": self.recurrent_error_weight,
            "code_complexity_weight": self.code_complexity_weight,
            "feedback_type_weight": self.feedback_type_weight,
            "logical_level_weight": self.logical_level_weight,
            "previous_errors_weight": self.previous_errors_weight,
        }

    def _set_metrics(self, y_true, y_pred):
        self.accuracy = accuracy_score(y_true, y_pred)
        self.precision = precision_score(y_true, y_pred, zero_division=0)
        self.recall = recall_score(y_true, y_pred, zero_division=0)
        self.f1 = f1_score(y_true, y_pred, zero_division=0)
        self.confusion_matrix = confusion_matrix(y_true, y_pred, labels=[False, True]).tolist()
        self.metrics_note = (
            "Umbrales calibrados con train, reglas elegidas con validation y "
            "metricas calculadas sobre test aislado. Puntaje y tasa de exito "
            "no participan en la decision needs_guidance."
        )

    def _clear_metrics(self, note):
        self.accuracy = None
        self.precision = None
        self.recall = None
        self.f1 = None
        self.confusion_matrix = []
        self.metrics_note = note

    def _normalize_runtime_input(self, data):
        if hasattr(data, "iloc"):
            if data.empty:
                raise ValueError("RIA02 requires one input row")
            row = data.iloc[0].to_dict()
        else:
            row = dict(data)

        errors = self._as_list(row.get("errors", []))
        previous_errors = self._as_list(row.get("previous_errors", []))
        attempts = self._non_negative_number(row.get("attempts", 0), "attempts")

        return {
            "code": str(row.get("code", "") or "")[:20_000],
            "language": str(row.get("language", "python") or "python").strip().lower()[:30],
            "errors": errors,
            "previous_errors": previous_errors,
            "errors_count": len(errors),
            "attempts": attempts,
            "logical_level": self._normalize_logical_level(row.get("logical_level", "medio")),
            "activity_objective": str(row.get("activity_objective", "") or "")[:1_000],
            "score": self._optional_number(row.get("score")),
            "success_rate": self._optional_rate(row.get("success_rate")),
        }

    def _code_complexity(self, code):
        non_empty_lines = [line for line in code.splitlines() if line.strip()]
        branch_tokens = ["if ", "for ", "while ", "def ", "class ", "elif ", "try:", "except"]
        branch_count = sum(code.lower().count(token) for token in branch_tokens)

        if len(non_empty_lines) >= 25 or branch_count >= 6:
            return "high"
        if len(non_empty_lines) >= 10 or branch_count >= 3:
            return "medium"
        return "low"

    def _feedback_type(self, errors, recurrent_errors, code_complexity):
        error_text = self._normalize_error_key(" ".join(errors + recurrent_errors))

        if any(token in error_text for token in ["syntax", "indentation", "unexpected", "invalid"]):
            return "syntax"
        if any(token in error_text for token in ["nameerror", "undefined", "reference"]):
            return "variables"
        if any(token in error_text for token in ["loop", "while", "for", "condition", "infinite"]):
            return "logic"
        if any(token in error_text for token in ["typeerror", "tipo", "convert", "cast"]):
            return "types"
        if any(token in error_text for token in ["exception", "runtime", "indexerror", "keyerror", "zero"]):
            return "runtime"
        if recurrent_errors:
            return "recurrent_errors"
        if code_complexity == "high":
            return "complexity"
        if errors:
            return "general_errors"
        return "general"

    def _priority(self, risk_points):
        if risk_points >= self.risk_cutoff + 2:
            return "high"
        if risk_points >= self.risk_cutoff:
            return "medium"
        return "low"

    def _risk_score(
        self,
        errors_count,
        attempts,
        recurrent_errors,
        code_complexity,
        feedback_type,
        logical_level,
        previous_errors,
        config=None,
    ):
        config = config or self.best_config or self._current_config()
        risk = 0
        risk += 1 if errors_count > 0 and errors_count >= self.error_threshold else 0
        risk += 1 if attempts > 0 and attempts >= self.attempt_threshold else 0
        risk += config["recurrent_error_weight"] if recurrent_errors else 0
        risk += config["code_complexity_weight"] if code_complexity == "high" else 0
        risk += config["feedback_type_weight"] if feedback_type in {"syntax", "logic"} else 0
        risk += config["logical_level_weight"] if str(logical_level).lower() == "bajo" else 0
        risk += config["previous_errors_weight"] if len(previous_errors) >= 2 else 0
        return risk

    def _risk_reasons(self, row, recurrent_errors, code_complexity, feedback_type):
        reasons = []
        if row["errors_count"] > 0 and row["errors_count"] >= self.error_threshold:
            reasons.append(
                f"Cantidad de errores ({row['errors_count']}) igual o superior al umbral "
                f"de la cohorte ({self.error_threshold:.2f})."
            )
        if row["attempts"] > 0 and row["attempts"] >= self.attempt_threshold:
            reasons.append(
                f"Cantidad de intentos ({row['attempts']:g}) igual o superior al umbral "
                f"de la cohorte ({self.attempt_threshold:.2f})."
            )
        if recurrent_errors:
            reasons.append("Se detectaron errores repetidos entre intentos actuales y anteriores.")
        if code_complexity == "high" and self.code_complexity_weight > 0:
            reasons.append("El codigo presenta una complejidad estructural alta.")
        if feedback_type in {"syntax", "logic"}:
            reasons.append(f"El tipo de dificultad detectado es {feedback_type}.")
        if row["logical_level"] == "bajo":
            reasons.append("El nivel logico informado requiere apoyo adicional.")
        if len(row["previous_errors"]) >= 2:
            reasons.append("Existen dos o mas errores registrados en intentos anteriores.")
        if not reasons:
            reasons.append("No se detectaron senales suficientes para activar retroalimentacion.")
        return reasons

    def _synthetic_training_errors(self, row):
        errors = []
        if row["errors_count"] >= 7:
            errors.append("logic_error")
        if row["attempts"] >= 6:
            errors.append("too_many_attempts")
        if str(row["logical_level"]).lower() == "bajo" and row["errors_count"] >= 5:
            errors.append("syntax_error")
        return errors or ["minor_review"]

    def _synthetic_training_code(self, row):
        if row["attempts"] >= 8 and row["errors_count"] >= 7:
            return (
                "for paso in range(3):\n"
                "    if paso > 0:\n"
                "        while paso < 5:\n"
                "            print(paso)"
            )
        if row["errors_count"] >= 7:
            return "while x < 10:\n    print(x)"
        return "for paso in range(3):\n    print(paso)"

    def _suggestions(self, feedback_type, recurrent_errors, code_complexity, attempts):
        suggestions = []

        if feedback_type == "syntax":
            suggestions.append("Revisar sintaxis, signos y estructura del bloque antes de ejecutar.")
        elif feedback_type == "variables":
            suggestions.append("Verificar nombres de variables y que cada una exista antes de usarse.")
        elif feedback_type == "logic":
            suggestions.append("Probar la condicion principal con un caso pequeno y revisar cambios de variables.")
        elif feedback_type == "types":
            suggestions.append("Comprobar el tipo de cada dato antes de operar o convertir valores.")
        elif feedback_type == "runtime":
            suggestions.append("Aislar la linea que falla y probarla con un dato de entrada pequeno.")
        elif feedback_type == "complexity":
            suggestions.append("Dividir el codigo en pasos mas pequenos y validar cada parte por separado.")
        elif feedback_type == "recurrent_errors":
            suggestions.append("Atacar primero el error repetido antes de agregar nuevas instrucciones.")
        elif feedback_type == "general_errors":
            suggestions.append("Leer el mensaje de error y validar una correccion pequena por intento.")
        else:
            suggestions.append("Mantener la estrategia y probar con un caso adicional.")

        if recurrent_errors:
            suggestions.append(f"Error recurrente principal: {self._safe_text(recurrent_errors[0])}.")
        if attempts >= self.attempt_threshold:
            suggestions.append("Reducir intentos probando cambios pequenos y documentando el resultado.")
        if code_complexity == "high":
            suggestions.append("Comentar brevemente cada bloque para confirmar su proposito.")

        return suggestions[:4]

    def _build_llm_context(self, row, feedback_type, priority, recurrent_errors):
        return {
            "student_level": row["logical_level"],
            "language": row["language"],
            "activity_objective": row["activity_objective"],
            "main_problem": self._main_problem(feedback_type, recurrent_errors, row["errors"]),
            "recommended_tone": self._recommended_tone(priority),
            "available_context": {
                "attempts": row["attempts"],
                "errors_count": row["errors_count"],
                "score": row["score"],
                "success_rate": row["success_rate"],
            },
            "avoid": "No dar la solucion completa; guiar con pistas cortas.",
        }

    def _main_problem(self, feedback_type, recurrent_errors, errors):
        if recurrent_errors:
            return f"Error recurrente: {self._safe_text(recurrent_errors[0])}"
        if errors:
            return f"Error actual: {self._safe_text(errors[0])}"
        return f"Necesidad principal: {feedback_type}"

    def _recommended_tone(self, priority):
        if priority == "high":
            return "claro, paciente y paso a paso"
        if priority == "medium":
            return "breve, guiado y con una pista concreta"
        return "positivo, corto y de refuerzo"

    def _recurrent_errors(self, errors, previous_errors):
        normalized_errors = []
        display_names = {}
        for error in previous_errors + errors:
            display = self._safe_text(error)
            key = self._normalize_error_key(display)
            if not key:
                continue
            normalized_errors.append(key)
            display_names.setdefault(key, display)

        counts = Counter(normalized_errors)
        return [
            display_names[key]
            for key, count in counts.items()
            if count >= self.recurrent_error_min_count
        ]

    def _as_list(self, value):
        if value is None:
            return []
        if isinstance(value, (list, tuple, set)):
            items = value
        elif isinstance(value, str) and "," in value:
            items = value.split(",")
        else:
            items = [value]
        return [self._safe_text(item, 500) for item in items if str(item).strip()][:100]

    def _to_number(self, value):
        try:
            number = float(value)
        except (TypeError, ValueError):
            raise ValueError("A numeric value was expected") from None
        if not math.isfinite(number):
            raise ValueError("Numeric values must be finite")
        return number

    def _non_negative_number(self, value, field_name):
        number = self._to_number(value)
        if number < 0:
            raise ValueError(f"{field_name} cannot be negative")
        return number

    def _optional_number(self, value):
        if value is None or value == "":
            return None
        number = self._to_number(value)
        if not 0 <= number <= 100:
            raise ValueError("score must be between 0 and 100")
        return number

    def _optional_rate(self, value):
        if value is None or value == "":
            return None
        value = self._to_number(value)
        if value > 1:
            value = value / 100
        if not 0 <= value <= 1:
            raise ValueError("success_rate must be between 0 and 1, or 0 and 100")
        return value

    def _parse_boolean_target(self, value):
        if value is None or pd.isna(value):
            return pd.NA
        if isinstance(value, bool):
            return value
        if isinstance(value, (int, float)):
            if value in {0, 1}:
                return bool(value)
            return pd.NA

        normalized = self._normalize_error_key(value)
        if normalized in {"true", "1", "si", "yes", "requiere_apoyo", "needs_guidance"}:
            return True
        if normalized in {"false", "0", "no", "on_track"}:
            return False
        return pd.NA

    def _normalize_logical_level(self, value):
        normalized = self._normalize_error_key(value or "medio")
        aliases = {
            "low": "bajo",
            "basic": "bajo",
            "basico": "bajo",
            "medium": "medio",
            "intermediate": "medio",
            "intermedio": "medio",
            "high": "alto",
            "advanced": "alto",
            "avanzado": "alto",
        }
        return aliases.get(normalized, normalized) if normalized in {
            "bajo", "medio", "alto", *aliases
        } else "medio"

    def _input_warnings(self, row):
        warnings = []
        if not row["code"].strip():
            warnings.append("No se recibio codigo; la complejidad se considera baja.")
        if not row["activity_objective"].strip():
            warnings.append("No se recibio el objetivo de la actividad; las pistas seran generales.")
        if row["attempts"] > 0 and not row["errors"]:
            warnings.append("Hay intentos registrados, pero no mensajes de error para explicar la dificultad.")
        return warnings

    def _normalize_error_key(self, value):
        text = unicodedata.normalize("NFKD", str(value).strip().lower())
        without_accents = "".join(char for char in text if not unicodedata.combining(char))
        return " ".join(without_accents.split())

    def _safe_text(self, value, max_length=160):
        return " ".join(str(value).strip().split())[:max_length]
