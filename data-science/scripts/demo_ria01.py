from __future__ import annotations

import sys
import tempfile
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.adapters.ml_models.ria01_desempeño import ClasificadorDesempeno
from app.infrastructure.settings import DATASET_PATH


def print_section(title: str) -> None:
    print("\n" + "=" * 80)
    print(title)
    print("=" * 80)


def main() -> None:
    df = pd.read_excel(DATASET_PATH)

    print_section("1. Entrenamiento RIA-01")
    model = ClasificadorDesempeno(
        verbose=True,
        search_iterations=4,
        search_mode="quick",
        target_source="rule",
        logical_level_source="unknown",
    )
    model.train(df)

    print_section("2. Modo predictivo y modo de regla")
    one_row = df.head(1)
    one_prediction = model.predict(one_row)
    one_proba = model.predict_proba(one_row)
    rule_prediction = model.predict_rule(one_row[["puntaje", "tasa_exito"]])
    print("Estimacion ML sin target:", one_prediction)
    print("Probabilidades:", one_proba)
    print("Clasificacion exacta por regla:", rule_prediction)

    print_section("3. Prediccion de varios registros")
    many_predictions = model.predict(df.head(5))
    many_probas = model.predict_proba(df.head(5))
    print("Predicciones:", many_predictions)
    print("Probabilidades:", many_probas)

    print_section("4. Robustez ante columnas faltantes, nulos y divisiones por cero")
    edge_cases = pd.DataFrame([
        {"nivel_logico": None, "intentos": 0, "errores": None, "interacciones_ia": 0},
        {"nivel_logico": "alto", "intentos": None, "errores": 5, "interacciones_ia": None},
        {"nivel_logico": "bajo"},
    ])
    print(model.predict(edge_cases))

    print_section("5. Separacion por estudiante")
    print("Columna grupo detectada:", model.selected_group_column)
    print("Estrategia split:", model.split_strategy)
    print("Reporte train/test:", model.split_report)
    print("Reporte folds:", model.cv_overlap_report)
    assert model.split_report["group_overlap_count"] == 0
    assert all(fold["group_overlap_count"] == 0 for fold in model.cv_overlap_report)

    print_section("6. Diagnostico de fuga y calidad")
    print("Fuga:", model.leakage_diagnostics)
    print("Escala tasa_exito:", model.success_rate_scale_report)
    print("Faltantes:", model.missing_value_report)
    print("Niveles desconocidos:", model.unknown_logical_values)
    print("Features correlacionadas:", model.redundant_feature_pairs)

    print_section("7. Comparacion de features")
    print(model.feature_set_comparison)
    print("Conjunto seleccionado:", model.selected_feature_set)
    print("Features eliminadas:", model.removed_features)

    print_section("8. Baselines y prueba aleatoria")
    print("Baseline accuracy:", model.baseline_accuracy)
    print("Baseline f1_macro:", model.baseline_f1_macro)
    print("Regla directa:", model.rule_baseline_metrics)
    print("Etiquetas aleatorias:", model.random_label_sanity)
    assert model.random_label_sanity["passed"] is True

    print_section("9. Comparacion binaria/multiclase y modelos")
    print(model.binary_multiclass_comparison)
    print(model.model_comparison)
    print("Mejor modelo:", model.best_model_name)
    print("Mejores hiperparametros:", model.best_params)

    print_section("10. Metricas test final")
    print("accuracy:", model.accuracy)
    print("balanced_accuracy:", model.balanced_accuracy)
    print("precision_macro:", model.precision_macro)
    print("recall_macro:", model.recall_macro)
    print("f1_macro:", model.f1_macro)
    print("precision_weighted:", model.precision_weighted)
    print("recall_weighted:", model.recall_weighted)
    print("f1_weighted:", model.f1_weighted)
    print("confusion_matrix:", model.confusion_matrix)
    print("classification_report:", model.classification_report)
    print("recall_por_clase:", model.recall_por_clase)
    print("falsos_negativos_por_clase:", model.falsos_negativos_por_clase)
    print("tasa_falsos_negativos_por_clase:", model.tasa_falsos_negativos_por_clase)

    print_section("11. Importancia de variables")
    print("Importancia nativa:")
    print(model.native_feature_importance)
    print("Importancia por permutacion:")
    print(model.permutation_feature_importance)

    print_section("12. Guardado y carga")
    with tempfile.TemporaryDirectory() as tmp_dir:
        model_path = Path(tmp_dir) / "ria01_demo.pkl"
        model.save_model(model_path)
        loaded = ClasificadorDesempeno.load_model(model_path)
        before = model.predict(df.head(10))
        after = loaded.predict(df.head(10))
        print("Predicciones iguales:", before == after)
        if before != after:
            raise AssertionError("Las predicciones cambiaron despues de cargar el modelo.")

    print_section("13. Target externo sin columnas de la regla")
    external_df = df.drop(columns=["puntaje", "tasa_exito"])
    external_model = ClasificadorDesempeno(
        search_iterations=1,
        search_mode="quick",
        target_source="existing",
        random_label_permutations=2,
    )
    external_model.train(external_df)
    print("Entrenado:", external_model.is_trained)
    print("Baseline por regla:", external_model.rule_baseline_metrics)
    print("Prediccion:", external_model.predict(external_df.head(1)))

    print_section("14. Clases con pocos registros")
    small_df = df.head(2).copy()
    small_df["puntaje"] = [0, 100]
    small_df["tasa_exito"] = [0, 1]
    try:
        ClasificadorDesempeno(search_iterations=1, search_mode="quick").train(small_df)
    except ValueError as exc:
        print("Error controlado:", exc)


if __name__ == "__main__":
    main()
