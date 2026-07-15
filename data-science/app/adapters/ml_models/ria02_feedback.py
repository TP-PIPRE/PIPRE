from collections import Counter

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

    def __init__(
        self,
        error_threshold_percentiles=None,
        attempt_threshold_percentiles=None,
        risk_cutoffs=None,
        recurrent_error_weights=None,
        code_complexity_weights=None,
    ):
        self.model_version = "ria02-v3"

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

        if target is None or target.nunique() < 2:
            self._fit_thresholds(data)
            self._clear_metrics("No independent target with at least two classes was available.")
            self.is_calibrated = True
            return

        stratify = target if target.value_counts().min() >= 2 else None
        train_df, temp_df, _, y_temp = train_test_split(
            data,
            target,
            test_size=0.4,
            stratify=stratify,
            random_state=42,
        )

        temp_stratify = y_temp if y_temp.value_counts().min() >= 2 else None
        validation_df, test_df, y_validation, y_test = train_test_split(
            temp_df,
            y_temp,
            test_size=0.5,
            stratify=temp_stratify,
            random_state=42,
        )

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
        feedback_type = self._feedback_type(row["errors"], recurrent_errors, code_complexity)
        priority = self._priority(
            row["errors"],
            recurrent_errors,
            row["attempts"],
            code_complexity,
            feedback_type,
            row["logical_level"],
            row["previous_errors"],
        )
        result = "needs_guidance" if self._risk_score(
            len(row["errors"]),
            row["attempts"],
            recurrent_errors,
            code_complexity,
            feedback_type,
            row["logical_level"],
            row["previous_errors"],
        ) >= self.risk_cutoff else "on_track"
        suggestions = self._suggestions(
            feedback_type,
            recurrent_errors,
            code_complexity,
            row["attempts"],
        )

        return {
            "result": result,
            "feedback_type": feedback_type,
            "priority": priority,
            "recurrent_errors": recurrent_errors,
            "code_complexity": code_complexity,
            "suggestions": suggestions,
            "llm_context": self._build_llm_context(row, feedback_type, priority, recurrent_errors),
        }

    def _prepare_training_frame(self, df):
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
            data[col] = pd.to_numeric(data[col], errors="coerce").fillna(0)

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
                return values.astype(bool)

            normalized = values.astype(str).str.strip().str.lower()
            if column == "rendimiento":
                return normalized.eq("bajo")
            if column == "nivel_desempeno":
                return normalized.isin({"bajo", "requiere_apoyo", "needs_guidance"})

        return None

    def _fit_thresholds(self, data, error_percentile=None, attempt_percentile=None):
        self.error_threshold_percentile = error_percentile or self.error_threshold_percentile
        self.attempt_threshold_percentile = attempt_percentile or self.attempt_threshold_percentile
        self.error_threshold = float(data["errors_count"].quantile(self.error_threshold_percentile))
        self.attempt_threshold = float(data["attempts"].quantile(self.attempt_threshold_percentile))

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
            key=lambda item: (item["precision"], item["f1"], item["accuracy"]),
        )

    def _baseline_metrics(self, train_df, test_df, y_test):
        self._fit_thresholds(train_df, 0.75, 0.75)
        y_pred = (
            (test_df["errors_count"] >= self.error_threshold)
            | (test_df["attempts"] >= self.attempt_threshold)
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
            "Thresholds calibrated on train split, rule hyperparameters selected on validation split, "
            "and metrics reported on held-out test split. No score/success_rate used for needs_guidance."
        )

    def _clear_metrics(self, note):
        self.accuracy = None
        self.precision = None
        self.recall = None
        self.f1 = None
        self.confusion_matrix = []
        self.metrics_note = note

    def _normalize_runtime_input(self, data):
        row = data.iloc[0].to_dict() if hasattr(data, "iloc") else dict(data)

        errors = self._as_list(row.get("errors", []))
        previous_errors = self._as_list(row.get("previous_errors", []))

        return {
            "code": str(row.get("code", "") or ""),
            "language": str(row.get("language", "python") or "python").strip().lower(),
            "errors": errors,
            "previous_errors": previous_errors,
            "errors_count": len(errors),
            "attempts": self._to_number(row.get("attempts", 0)),
            "logical_level": str(row.get("logical_level", "medio") or "medio").strip().lower(),
            "activity_objective": str(row.get("activity_objective", "") or ""),
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
        error_text = " ".join(errors + recurrent_errors).lower()

        if any(token in error_text for token in ["syntax", "indentation", "unexpected", "invalid"]):
            return "syntax"
        if any(token in error_text for token in ["nameerror", "undefined", "reference"]):
            return "variables"
        if any(token in error_text for token in ["loop", "while", "for", "condition", "infinite"]):
            return "logic"
        if recurrent_errors:
            return "recurrent_errors"
        if code_complexity == "high":
            return "complexity"
        if errors:
            return "general_errors"
        return "general"

    def _priority(self, errors, recurrent_errors, attempts, code_complexity, feedback_type, logical_level, previous_errors):
        risk_points = self._risk_score(
            len(errors),
            attempts,
            recurrent_errors,
            code_complexity,
            feedback_type,
            logical_level,
            previous_errors,
        )

        if risk_points >= 4:
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
        risk += 1 if errors_count >= self.error_threshold else 0
        risk += 1 if attempts >= self.attempt_threshold else 0
        risk += config["recurrent_error_weight"] if recurrent_errors else 0
        risk += config["code_complexity_weight"] if code_complexity == "high" else 0
        risk += config["feedback_type_weight"] if feedback_type in {"syntax", "logic"} else 0
        risk += config["logical_level_weight"] if str(logical_level).lower() == "bajo" else 0
        risk += config["previous_errors_weight"] if len(previous_errors) >= 2 else 0
        return risk

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
        elif feedback_type == "complexity":
            suggestions.append("Dividir el codigo en pasos mas pequenos y validar cada parte por separado.")
        elif feedback_type == "recurrent_errors":
            suggestions.append("Atacar primero el error repetido antes de agregar nuevas instrucciones.")
        elif feedback_type == "general_errors":
            suggestions.append("Leer el mensaje de error y validar una correccion pequena por intento.")
        else:
            suggestions.append("Mantener la estrategia y probar con un caso adicional.")

        if recurrent_errors:
            suggestions.append(f"Error recurrente principal: {recurrent_errors[0]}.")
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
            return f"Error recurrente: {recurrent_errors[0]}"
        if errors:
            return f"Error actual: {errors[0]}"
        return f"Necesidad principal: {feedback_type}"

    def _recommended_tone(self, priority):
        if priority == "high":
            return "claro, paciente y paso a paso"
        if priority == "medium":
            return "breve, guiado y con una pista concreta"
        return "positivo, corto y de refuerzo"

    def _recurrent_errors(self, errors, previous_errors):
        counts = Counter(str(error) for error in previous_errors + errors if str(error).strip())
        return [error for error, count in counts.items() if count >= self.recurrent_error_min_count]

    def _as_list(self, value):
        if value is None:
            return []
        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]
        if isinstance(value, tuple):
            return [str(item).strip() for item in value if str(item).strip()]
        if isinstance(value, str) and "," in value:
            return [item.strip() for item in value.split(",") if item.strip()]
        return [str(value).strip()] if str(value).strip() else []

    def _to_number(self, value):
        try:
            return float(value)
        except (TypeError, ValueError):
            return 0.0

    def _optional_number(self, value):
        if value is None or value == "":
            return None
        return self._to_number(value)

    def _optional_rate(self, value):
        if value is None or value == "":
            return None
        value = self._to_number(value)
        if value > 1:
            return value / 100
        return value
