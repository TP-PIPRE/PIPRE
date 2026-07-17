from __future__ import annotations

import sys
import tempfile
import unittest
import warnings
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.adapters.ml_models.ria01_desempeño import ClasificadorDesempeno
from app.adapters.ml_support.ria01_preprocessing import RIA01FeatureEngineer
from app.application.services.ria01_service import RIA01Service


def grouped_rule_dataset(students: int = 40) -> pd.DataFrame:
    rows = []
    for student in range(students):
        low = student < students // 2
        for session in range(2):
            rows.append({
                "estudiante_id": f"student-{student}",
                "puntaje": 48 + session if low else 86 + session,
                "tasa_exito": 0.55 + session * 0.01 if low else 0.88 + session * 0.01,
                "intentos": 3 + (student % 4),
                "errores": student % 3,
                "interacciones_ia": (student + session) % 5,
                "nivel_logico": ("bajo", "medio", "alto")[student % 3],
            })
    return pd.DataFrame(rows)


def external_target_without_features(rows: int = 60) -> pd.DataFrame:
    return pd.DataFrame({
        "rendimiento": ["bajo" if index % 2 == 0 else "adecuado" for index in range(rows)]
    })


class ClasificadorDesempenoIntegrationTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        warnings.simplefilter("ignore", UserWarning)
        cls.rule_data = grouped_rule_dataset()
        cls.rule_model = ClasificadorDesempeno(
            search_iterations=1,
            search_mode="quick",
            group_column="estudiante_id",
            multiple_observations_per_student=True,
            logical_level_source="independent",
            random_label_permutations=2,
        )
        cls.rule_model.train(cls.rule_data)

        cls.external_data = external_target_without_features()
        cls.external_model = ClasificadorDesempeno(
            search_iterations=1,
            search_mode="quick",
            target_source="existing",
            random_label_permutations=2,
        )
        cls.external_model.train(cls.external_data)

    def test_rule_and_existing_targets_train(self) -> None:
        self.assertTrue(self.rule_model.is_trained)
        self.assertTrue(self.external_model.is_trained)
        self.assertEqual(self.external_model.target_source, "existing")

    def test_external_target_does_not_require_rule_columns_or_features(self) -> None:
        self.assertNotIn("puntaje", self.external_data)
        self.assertNotIn("tasa_exito", self.external_data)
        self.assertFalse(self.external_model.rule_baseline_metrics["available"])
        self.assertFalse(
            self.external_model.leakage_diagnostics["success_rate_reconstruction"]["available"]
        )

    def test_group_split_and_every_cv_fold_have_no_overlap(self) -> None:
        self.assertEqual(self.rule_model.selected_group_column, "estudiante_id")
        self.assertEqual(self.rule_model.split_report["group_overlap_count"], 0)
        self.assertTrue(
            all(fold["group_overlap_count"] == 0 for fold in self.rule_model.cv_overlap_report)
        )

    def test_group_split_size_and_classes_are_valid(self) -> None:
        report = self.rule_model.split_report
        self.assertLessEqual(abs(report["actual_test_ratio"] - 0.2), 0.05)
        self.assertTrue(report["all_classes_in_train"])
        self.assertTrue(report["all_classes_in_test"])
        self.assertEqual(set(report["test_class_distribution"]), {"bajo", "adecuado"})

    def test_joint_selection_really_selects_model_features_and_parameters(self) -> None:
        model = self.rule_model
        self.assertFalse(model.joint_search_results.empty)
        self.assertIn(model.best_model_name, {"random_forest", "extra_trees", "hist_gradient_boosting"})
        self.assertEqual(model.best_params["selector__columns"], model.feature_columns)
        self.assertAlmostEqual(
            model.best_selection_score,
            float(model.model_comparison.iloc[0]["selection_score"]),
        )

    def test_random_label_test_uses_multiple_permutations(self) -> None:
        report = self.rule_model.random_label_sanity
        self.assertEqual(report["n_permutations"], 2)
        self.assertEqual(len(report["random_f1_scores"]), 2)
        self.assertEqual(len(report["random_balanced_accuracy_scores"]), 2)

    def test_permutation_importance_uses_all_cv_folds_not_test(self) -> None:
        importance = self.rule_model.permutation_feature_importance
        self.assertFalse(importance.empty)
        self.assertTrue((importance["folds_evaluados"] > 1).all())
        self.assertTrue((importance["evaluation_source"] == "cross_validation_only").all())

    def test_rule_dummy_and_predictive_results_are_separate(self) -> None:
        model = self.rule_model
        self.assertTrue(model.rule_baseline_metrics["available"])
        self.assertEqual(model.rule_baseline_metrics["accuracy"], 1.0)
        self.assertIsNotNone(model.baseline_accuracy)
        self.assertEqual(model.final_diagnosis["predictive_metrics_name"], "early_estimation_without_score_or_success_rate")
        self.assertIn("predict_rule", model.final_diagnosis["recommendation"])

    def test_predict_proba_has_stable_complete_class_order(self) -> None:
        probabilities = self.rule_model.predict_proba(self.rule_data.head(1))
        self.assertEqual(list(probabilities), ["bajo", "adecuado"])
        self.assertAlmostEqual(sum(probabilities.values()), 1.0)

    def test_joblib_round_trip_keeps_predictions_and_class_order(self) -> None:
        before = self.rule_model.predict(self.rule_data.head(5))
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "ria01.pkl"
            self.rule_model.save_model(path)
            loaded = ClasificadorDesempeno.load_model(path)
            self.assertEqual(before, loaded.predict(self.rule_data.head(5)))
            self.assertEqual(
                list(loaded.predict_proba(self.rule_data.head(1))),
                ["bajo", "adecuado"],
            )

    def test_binary_and_multiclass_are_reported_independently(self) -> None:
        comparison = self.rule_model.classification_mode_feature_comparison
        self.assertIn("binary", set(comparison["problem"]))
        self.assertIn("multiclass", set(comparison["problem"]))
        self.assertEqual(self.rule_model.classification_mode, "binary")

    def test_service_keeps_the_fastapi_response_contract(self) -> None:
        service = RIA01Service(self.rule_model)
        service.set_model(self.rule_model)
        response = service.predict({
            "intentos": 3,
            "errores": 1,
            "nivel_logico": "medio",
            "interacciones_ia": 2,
        })
        self.assertEqual(set(response), {"result", "accuracy", "precision"})
        self.assertIn(response["result"], {"low", "adequate"})
        self.assertEqual(self.rule_model.model_version, RIA01Service.MODEL_VERSION)


class ClasificadorDesempenoUnitTest(unittest.TestCase):
    def test_success_rate_is_normalized_per_row(self) -> None:
        model = ClasificadorDesempeno(search_mode="quick")
        values = pd.Series([0.80, 75, 0.90, 60, -1, 101, None])
        normalized = model._normalize_success_rate(values, record_report=True)

        self.assertEqual(normalized.iloc[:4].round(2).tolist(), [0.80, 0.75, 0.90, 0.60])
        self.assertTrue(normalized.iloc[4:].isna().all())
        self.assertTrue(model.success_rate_scale_report["mixed_scales"])
        self.assertEqual(model.success_rate_scale_report["invalid_count"], 3)

    def test_rule_mode_is_explicit_deterministic_and_multirecord(self) -> None:
        model = ClasificadorDesempeno(search_mode="quick")
        data = pd.DataFrame({
            "puntaje": [50, 67, 100],
            "tasa_exito": [0.50, 0.67, 1.0],
        })
        self.assertEqual(model.predict_rule(data), ["bajo", "adecuado", "adecuado"])
        self.assertEqual(model.last_prediction_mode, "rule")

    def test_existing_target_allows_each_rule_column_to_be_absent(self) -> None:
        base = grouped_rule_dataset(10)
        base["rendimiento"] = ["bajo", "adecuado"] * 10
        for missing in ("puntaje", "tasa_exito"):
            model = ClasificadorDesempeno(target_source="existing", search_mode="quick")
            prepared = model._prepare_training_data(base.drop(columns=[missing]))
            self.assertEqual(len(prepared), len(base))
            self.assertFalse(model.rule_availability_report["available"])

    def test_optional_columns_missing_are_not_directly_accessed(self) -> None:
        model = ClasificadorDesempeno(target_source="existing", search_mode="quick")
        prepared = model._prepare_training_data(external_target_without_features(20))
        y = model._encode_target(prepared["target_binary"])
        model._diagnose_leakage(prepared, y)
        self.assertFalse(model.leakage_diagnostics["logical_level"]["available"])
        self.assertFalse(model.leakage_diagnostics["success_rate_reconstruction"]["available"])

    def test_fold_transformer_learns_imputation_only_from_fit_rows(self) -> None:
        train = pd.DataFrame({"errores": [1.0, 3.0]})
        validation = pd.DataFrame({"errores": [np.nan, 999.0]})
        transformer = RIA01FeatureEngineer().fit(train)
        transformed = transformer.transform(validation)

        self.assertEqual(transformer.numeric_medians_["errores"], 2.0)
        self.assertEqual(transformed.iloc[0]["errores"], 2.0)
        self.assertNotEqual(transformer.numeric_medians_["errores"], 999.0)

    def test_negative_values_become_missing_with_indicators(self) -> None:
        transformer = RIA01FeatureEngineer().fit(pd.DataFrame({"errores": [1, 3]}))
        result = transformer.transform(pd.DataFrame({"errores": [-5]}))
        self.assertEqual(result.iloc[0]["errores"], 2.0)
        self.assertEqual(result.iloc[0]["errores_faltante"], 1)

    def test_errors_greater_than_attempts_support_all_policies(self) -> None:
        data = grouped_rule_dataset(4)
        data.loc[0, ["errores", "intentos"]] = [8, 3]

        event_model = ClasificadorDesempeno()
        prepared = event_model._prepare_training_data(data)
        relation = event_model.data_quality_report["errors_attempts_relation"]
        self.assertEqual(len(prepared), len(data))
        self.assertEqual(relation["error_semantics"], "multiple_error_events_per_attempt")
        self.assertEqual(relation["rows_invalid_under_current_semantics"], 0)
        self.assertFalse(event_model.training_warnings)

        drop_model = ClasificadorDesempeno(
            invalid_row_policy="drop",
            single_error_per_attempt=True,
        )
        self.assertEqual(len(drop_model._prepare_training_data(data)), len(data) - 1)

        error_model = ClasificadorDesempeno(
            invalid_row_policy="error",
            single_error_per_attempt=True,
        )
        with self.assertRaisesRegex(ValueError, "errores > intentos"):
            error_model._prepare_training_data(data)

        warn_model = ClasificadorDesempeno(
            invalid_row_policy="warn",
            single_error_per_attempt=True,
        )
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            self.assertEqual(len(warn_model._prepare_training_data(data)), len(data))
        self.assertEqual(warn_model.training_warnings[0]["severity"], "high")

    def test_unknown_logical_levels_are_explicit_not_silently_medium(self) -> None:
        transformer = RIA01FeatureEngineer().fit(pd.DataFrame({"nivel_logico": ["medio"]}))
        result = transformer.transform(pd.DataFrame({"nivel_logico": ["desconocido"]}))
        self.assertEqual(result.iloc[0]["nivel_logico"], -1)
        self.assertEqual(result.iloc[0]["nivel_logico_faltante"], 1)

    def test_confirmed_success_proxy_is_excluded_using_plausible_rows(self) -> None:
        attempts = pd.Series([10] * 30)
        errors = pd.Series(list(range(10)) * 3)
        data = pd.DataFrame({
            "tasa_exito": 1 - errors / attempts,
            "errores": errors,
            "intentos": attempts,
        })
        model = ClasificadorDesempeno(
            search_mode="quick",
            single_error_per_attempt=True,
        )
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            model._diagnose_leakage(data, pd.Series([0, 1] * 15))
        diagnostic = model.leakage_diagnostics["success_rate_reconstruction"]
        self.assertTrue(diagnostic["confirmed_indirect_leakage"])
        self.assertGreaterEqual(diagnostic["plausible_rows"], 20)
        self.assertIn("ratio_error", model.forced_excluded_features)

        event_model = ClasificadorDesempeno(search_mode="quick")
        event_model._diagnose_leakage(data, pd.Series([0, 1] * 15))
        event_diagnostic = event_model.leakage_diagnostics[
            "success_rate_reconstruction"
        ]
        self.assertFalse(event_diagnostic["formula_semantically_valid"])
        self.assertFalse(event_diagnostic["confirmed_indirect_leakage"])

    def test_logical_level_leakage_policies(self) -> None:
        data = pd.DataFrame({"nivel_logico": ["bajo"] * 15 + ["alto"] * 15})
        y = pd.Series([0] * 15 + [1] * 15)

        exclude = ClasificadorDesempeno(leakage_policy="exclude")
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            exclude._diagnose_leakage(data, y)
        self.assertIn("nivel_logico", exclude.forced_excluded_features)

        stop = ClasificadorDesempeno(leakage_policy="error")
        with self.assertRaisesRegex(ValueError, "origen desconocido"):
            stop._diagnose_leakage(data, y)

        declared = ClasificadorDesempeno(logical_level_source="current_performance")
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            declared._diagnose_leakage(data, y)
        self.assertIn("nivel_x_error", declared.forced_excluded_features)

    def test_auto_group_accepts_repeats_only_when_declared(self) -> None:
        data = grouped_rule_dataset(6)
        prepared_model = ClasificadorDesempeno(
            multiple_observations_per_student=True,
        )
        prepared = prepared_model._prepare_training_data(data)
        groups = prepared_model._resolve_groups(prepared)
        self.assertEqual(prepared_model.selected_group_column, "estudiante_id")
        self.assertEqual(groups.nunique(), 6)

        ambiguous = ClasificadorDesempeno()
        prepared = ambiguous._prepare_training_data(data)
        with self.assertRaisesRegex(ValueError, "multiple_observations_per_student"):
            ambiguous._resolve_groups(prepared)

    def test_no_base_features_does_not_break_repeat_detection(self) -> None:
        model = ClasificadorDesempeno(target_source="existing")
        prepared = model._prepare_training_data(external_target_without_features(10))
        self.assertIsNone(model._resolve_groups(prepared))
        report = model.data_quality_report["repeat_detection_without_group"]
        self.assertFalse(report["available"])

    def test_failed_retraining_clears_previous_state(self) -> None:
        model = ClasificadorDesempeno(search_iterations=1, random_label_permutations=2)
        model.model = object()
        model.pipeline = object()
        model.is_trained = True
        model.accuracy = 0.99
        with self.assertRaises(ValueError):
            model.train(pd.DataFrame({"puntaje": [50], "tasa_exito": [0.5]}))
        self.assertIsNone(model.model)
        self.assertIsNone(model.pipeline)
        self.assertIsNone(model.accuracy)
        self.assertFalse(model.is_trained)

    def test_predict_before_training_is_controlled(self) -> None:
        with self.assertRaisesRegex(ValueError, "entrenarse antes"):
            ClasificadorDesempeno().predict({"intentos": 2})


if __name__ == "__main__":
    unittest.main()
