import numpy as np
import pandas as pd

from app.application.metrics import round_metric

RIA2_RESULT_LABELS = {
    "needs_guidance": "Requiere retroalimentacion",
    "on_track": "En buen camino",
}

RIA8_RESULT_LABELS = {
    "individual_support": "Requiere apoyo individual",
    "reinforce_group": "Requiere refuerzo pedagogico",
    "maintain_strategy": "Mantener estrategia actual",
    "increase_challenge": "Proponer un reto mayor",
}

RIA8_COMPARISON_LABELS = {
    "favorable": "Favorable respecto al grado",
    "near_grade_average": "Cercano al promedio del grado",
    "needs_attention": "Requiere atencion",
}

RIA8_REFERENCE_LABELS = {
    "same_grade_training_group": "Promedio del mismo grado en entrenamiento",
    "global_training_group": "Promedio global de entrenamiento",
}


def obtener_importancias_modelo(modelo):
    if hasattr(modelo, "native_feature_importance") and not modelo.native_feature_importance.empty:
        return dict(zip(
            modelo.native_feature_importance["variable"],
            modelo.native_feature_importance["importancia"]
        ))

    if hasattr(modelo, "permutation_feature_importance") and not modelo.permutation_feature_importance.empty:
        return dict(zip(
            modelo.permutation_feature_importance["variable"],
            modelo.permutation_feature_importance["importancia_promedio"]
        ))

    if hasattr(modelo.model, "feature_importances_"):
        columns = (
            getattr(modelo, "model_feature_columns", None)
            or getattr(modelo, "selected_feature_columns", None)
            or modelo.feature_columns
        )
        return dict(zip(columns, modelo.model.feature_importances_))

    return {}


def generar_resultados(
    df,
    ria1,
    ria2,
    ria3,
    ria4,
    ria5,
    ria6,
    ria7,
    ria8,
    ria9,
    ria10,
):

    data = df.sample(1)
    ria4_input = {
        "topic": "ciclos",
        "learning_objective": "Controlar el movimiento de un robot usando repeticiones",
        "difficulty": "basic",
        "allowed_blocks": ["repeat", "move_forward", "turn_right"],
        "constraints": ["usar al menos un ciclo"],
        "quantity": 1,
        "seed": None,
    }
    ria4_detalle = ria4.predict_detailed(ria4_input)
    ria5_input = construir_input_ria5()
    ria5_detalle = ria5.predict_detailed(ria5_input)
    ria2_input = construir_input_ria2(data)
    ria2_detalle = ria2.predict_detailed(ria2_input)
    ria6_input = construir_input_ria6(data)
    ria6_detalle = ria6.predict_detailed(ria6_input)
    ria6_calidad = ria6.quality_summary()
    ria6_estudiantes = predecir_lote_ria6(ria6, df)
    ria6_segment_counts = {
        segment_id: sum(
            row["segment_id"] == segment_id
            for row in ria6_estudiantes
        )
        for segment_id in ria6.segment_profiles
    }
    ria8_detalle = ria8.predict_detailed(data)
    ria7_detalle = ria7.predict_detailed(data)
    ria7_estudiantes = ria7.predict_batch(df, sort_by_risk=True)
    ria7_resumen = {
        "total": len(ria7_estudiantes),
        "normal": sum(row["risk_level"] == "low" for row in ria7_estudiantes),
        "atencion": sum(row["risk_level"] == "medium" for row in ria7_estudiantes),
        "critico": sum(row["risk_level"] == "high" for row in ria7_estudiantes),
        "anomalias": sum(row["anomaly"] for row in ria7_estudiantes),
    }

    def get_input_data(columns):
        available_columns = [col for col in columns if col in data.columns]
        return data[available_columns].to_dict(orient="records")[0]

    resultados = {
        "RIA1 - Desempeño": {
            "resultado": ria1.predict(data),
            "accuracy": round_metric(ria1.accuracy),
            "precision": round_metric(ria1.precision),
            "importancias": obtener_importancias_modelo(ria1),
            "input_data": get_input_data([
                "intentos",
                "errores",
                "nivel_logico",
                "interacciones_ia"
            ])
        },

        "RIA2 - Retroalimentación": {
            "resultado": RIA2_RESULT_LABELS.get(
                ria2_detalle.get("result"),
                ria2_detalle.get("result", "N/A")
            ),
            "detalle": {
                "tipo_feedback": ria2_detalle.get("feedback_type"),
                "prioridad": ria2_detalle.get("priority"),
                "complejidad_codigo": ria2_detalle.get("code_complexity"),
                "errores_recurrentes": ria2_detalle.get("recurrent_errors", []),
                "sugerencias": ria2_detalle.get("suggestions", []),
                "contexto_ia": ria2_detalle.get("llm_context", {}),
            },
            "accuracy": round_metric(ria2.accuracy),
            "precision": round_metric(ria2.precision),
            "input_data": ria2_input.to_dict(orient="records")[0],
        },

        "RIA3 - Recomendación": {
            "resultado": ria3.predict(data),
            "accuracy": round_metric(ria3.accuracy),
            "precision": round_metric(ria3.precision),
            "importancias": obtener_importancias_modelo(ria3),
            "input_data": get_input_data([
                "nivel_logico",
                "dias_inactivo",
                "interacciones_ia",
                "intentos",
                "errores",
                "ayuda_solicitada",
                "intentos_historicos_promedio",
                "errores_historicos_promedio",
                "ayuda_historica_promedio",
                "rendimiento_previo",
            ])
        },

        "RIA4 - Generador de retos": {
            "resultado": ria4_detalle["status"],
            "detalle": {
                "tecnica": ria4_detalle["technique"],
                "retos": ria4_detalle["challenges"],
            },
            "metricas_operativas": ria4_detalle["operational_metrics"],
            "input_data": ria4_input,
        },

        "RIA5 - Clasificador de errores": {
            "resultado": ria5_detalle["error_label"],
            "detalle": {
                "confianza": f"{ria5_detalle['confidence']:.2%}",
                "requiere_revision_docente": ria5_detalle["requires_review"],
                "razones": ria5_detalle["reasons"],
                "aviso": ria5_detalle["details"]["teacher_notice"],
            },
            "accuracy": round_metric(ria5.validation_accuracy),
            "precision": round_metric(ria5.validation_precision),
            "importancias": dict(zip(
                ria5.feature_columns,
                ria5.model.feature_importances_,
            )),
            "input_data": ria5_input,
        },

        "RIA6 - Análisis de patrones": {
            "resultado": ria6_detalle["segment_name"],
            "detalle": {
                "Resumen": ria6_detalle["teacher_summary"],
                "Motivos principales": ria6_detalle["reasons"],
                "Acción recomendada": {
                    "Prioridad": {
                        "high": "Alta",
                        "medium": "Media",
                        "low": "Baja",
                    }.get(
                        ria6_detalle["teacher_suggestion"]["priority"],
                        ria6_detalle["teacher_suggestion"]["priority"],
                    ),
                    "Acción principal": (
                        ria6_detalle["teacher_suggestion"]["title"]
                    ),
                    "Pasos sugeridos": (
                        ria6_detalle["teacher_suggestion"]["actions"]
                    ),
                },
                "Aviso": ria6_detalle["details"]["teacher_notice"],
            },
            "calidad_clustering": {
                "Calidad de los grupos": ria6_calidad["quality_label"],
                "Uso recomendado": ria6_calidad["recommended_use"],
                "Grupos encontrados": ria6_calidad["selected_clusters"],
            },
            "resumen_segmentos": {
                "conteos": ria6_segment_counts,
                "perfiles": list(ria6.segment_profiles.values()),
            },
            "input_data": {
                "Estudiante": ria6_detalle.get("student_id") or "Sin identificador",
                "Actividades completadas": (
                    ria6_detalle["feature_values"]["frecuencia_actividad"]
                ),
                "Duración promedio de sesión": (
                    f"{ria6_detalle['feature_values']['duracion_promedio_min']:.1f} minutos"
                ),
                "Días sin actividad": (
                    f"{ria6_detalle['feature_values']['dias_inactivo']:.1f}"
                ),
            },
        },

        "RIA7 - Riesgo y anomalías": {
            "resultado": ria7_detalle["risk_label"],
            "detalle": {
                "puntaje_riesgo": ria7_detalle["risk_score"],
                "anomalia": ria7_detalle["anomaly"],
                "puntaje_anomalia": ria7_detalle["anomaly_score"],
                "razones": ria7_detalle["reasons"],
                "recomendacion_docente": ria7_detalle["teacher_recommendation"],
                "usa_historial_del_estudiante": ria7_detalle["student_history_used"],
                "usa_cohorte_de_referencia": ria7_detalle["reference_cohort_used"],
            },
            "resumen_docente": ria7_resumen,
            "tabla_docente": ria7_estudiantes,
            "anomalias": f"{ria7.reference_anomaly_ratio:.2%} de la cohorte de referencia marcada como anómala (no es calidad del modelo)",
            "pesos_riesgo": ria7.obtener_pesos_riesgo()["weights"],
            "input_data": get_input_data([
                "intentos",
                "errores",
                "puntaje",
                "dias_inactivo",
                "actividades_completadas",
                "tasa_exito",
                "ayuda_solicitada",
            ])
        },

        "RIA8 - Recomendacion pedagogica": {
            "resultado": RIA8_RESULT_LABELS.get(
                ria8_detalle["pedagogical_recommendation"],
                ria8_detalle["pedagogical_recommendation"],
            ),
            "detalle": {
                "perfil_pedagogico": ria8_detalle["pedagogical_profile"],
                "riesgo_pedagogico": ria8_detalle["pedagogical_risk"],
                "confianza": f"{ria8_detalle['confidence']:.2%}",
                "comparacion_con_grado": traducir_comparacion_ria8(
                    ria8_detalle["grade_comparison"]
                ),
                "razones": ria8_detalle["reasons"],
                "sugerencia_docente": traducir_sugerencia_ria8(
                    ria8_detalle["teacher_suggestion"]
                ),
            },
            "accuracy": round_metric(ria8.accuracy),
            "precision": round_metric(ria8.precision),
            "importancias": obtener_importancias_modelo(ria8),
            "input_data": get_input_data([
                "intentos",
                "errores",
                "interacciones_ia",
                "dias_inactivo",
                "ayuda_solicitada",
                "actividades_completadas",
                "grado",
                "nivel_logico",
            ]),
        },

        "RIA9 - Tiempo": {
            "resultado": ria9.predict(data),
            "accuracy": round_metric(ria9.accuracy),
            "precision": round_metric(ria9.precision),
            "importancias": dict(zip(
                ria9.feature_columns,
                ria9.model.feature_importances_
            )),
            "input_data": get_input_data([
                "intentos",
                "errores",
                "interacciones_ia",
                "dias_inactivo",
                "ayuda_solicitada",
                "actividades_completadas",
                "edad",
                "grado",
                "nivel_logico"
            ])
        },

        "RIA10 - Código": {
            "resultado": ria10.predict(data),
            "accuracy": round_metric(ria10.accuracy),
            "precision": round_metric(ria10.precision),
            "importancias": dict(zip(
                ria10.feature_columns,
                ria10.model.feature_importances_
            )),
            "input_data": get_input_data([
                "errores",
                "intentos",
                "interacciones_ia",
                "ayuda_solicitada",
                "actividades_completadas",
                "dias_inactivo",
                "edad",
                "grado",
                "nivel_logico",
                "emocion_detectada"
            ])
        }
    }

    return resultados


def traducir_comparacion_ria8(comparison):
    metric_labels = {
        "errors": "errores",
        "inactive_days": "dias_inactivo",
        "completed_activities": "actividades_completadas",
    }
    metrics = {}

    for metric, values in comparison["metrics"].items():
        metrics[metric_labels.get(metric, metric)] = {
            "valor_estudiante": values["student_value"],
            "promedio_grado": values["grade_average"],
            "diferencia": values["difference"],
            "estado": RIA8_COMPARISON_LABELS.get(
                values["status"],
                values["status"],
            ),
        }

    return {
        "grado": comparison["grade"],
        "referencia": RIA8_REFERENCE_LABELS.get(
            comparison["reference_scope"],
            comparison["reference_scope"],
        ),
        "metricas": metrics,
    }


def traducir_sugerencia_ria8(suggestion):
    return {
        "titulo": suggestion["title"],
        "resumen": suggestion["summary"],
        "prioridad": suggestion["priority"],
        "acciones": suggestion["actions"],
        "revisar_despues_de_actividades": suggestion["review_after_activities"],
        "basada_en_razones": suggestion["based_on_reasons"],
    }


def construir_input_ria5():
    """
    Ejecución demostrativa hasta que el simulador entregue telemetría real.

    La UI local no intenta inferir estas variables desde el dataset académico,
    porque describen una ejecución concreta del robot y no el perfil histórico
    del estudiante.
    """
    return {
        "resultado_esperado": {
            "posicion": {"x": 4, "y": 2},
            "sensores": {"frontal": False, "derecho": True},
            "pasos_ejecutados": 6,
            "completion_ratio": 1.0,
        },
        "resultado_obtenido": {
            "posicion": {"x": 3, "y": 2},
            "sensores": {"frontal": True, "derecho": True},
            "pasos_ejecutados": 4,
            "completion_ratio": 0.67,
        },
        "posicion_robot": {"x": 3, "y": 2},
        "estados_sensores": {
            "esperado": {"frontal": False, "derecho": True},
            "obtenido": {"frontal": True, "derecho": True},
        },
        "instrucciones_utilizadas": [
            "move_forward",
            "repeat",
            "move_forward",
            "turn_right",
            "move_forward",
            "stop",
        ],
        "colisiones": 1,
        "paso_interrupcion": 4,
        "completion_ratio": 0.67,
    }


def construir_input_ria2(data):
    row = data.iloc[0]
    errors = int(row.get("errores", 0))
    attempts = int(row.get("intentos", 0))
    logical_level = str(row.get("nivel_logico", "medio"))

    current_errors = []
    previous_errors = []

    if errors >= 7:
        current_errors.append("high_error_count")
        previous_errors.extend(["high_error_count", "logic_error"])
    if attempts >= 6:
        current_errors.append("too_many_attempts")
        previous_errors.append("too_many_attempts")
    if not current_errors:
        current_errors.append("minor_review")

    code = (
        "while x < 10:\n"
        "    print(x)\n"
        "    # revisar actualizacion de la variable"
        if "logic_error" in previous_errors
        else "for paso in range(3):\n    print(paso)"
    )

    return data.__class__([{
        "code": code,
        "language": "python",
        "errors": current_errors,
        "attempts": attempts,
        "previous_errors": previous_errors,
        "logical_level": logical_level,
        "activity_objective": "Resolver la actividad de programacion con pasos claros",
    }])


def construir_input_ria6(data):
    """
    Adapta el resumen heredado de la UI al contrato canónico de RIA06.

    La conversión queda en la frontera de integración para que el modelo no
    confunda automáticamente conteos o sesiones individuales con agregados.
    El repositorio de la UI garantiza que estas columnas son resúmenes por
    estudiante dentro de la misma cohorte.
    """
    mappings = {
        "frecuencia_actividad": "actividades_completadas",
        "duracion_promedio_min": "tiempo_sesion_min",
        "dias_inactivo": "dias_inactivo",
    }
    result = pd.DataFrame(index=data.index)

    for canonical, legacy in mappings.items():
        canonical_available = canonical in data.columns
        legacy_available = legacy in data.columns
        if not canonical_available and not legacy_available:
            raise ValueError(
                "La UI no puede construir la entrada RIA06. Falta "
                f"'{canonical}' o su columna de resumen '{legacy}'."
            )
        if canonical_available and legacy_available and canonical != legacy:
            canonical_values = pd.to_numeric(data[canonical], errors="coerce")
            legacy_values = pd.to_numeric(data[legacy], errors="coerce")
            comparable = canonical_values.notna() & legacy_values.notna()
            contradictory = comparable & ~np.isclose(
                canonical_values,
                legacy_values,
                rtol=1e-9,
                atol=1e-9,
            )
            if contradictory.any():
                rows = (
                    np.flatnonzero(contradictory.to_numpy()) + 1
                ).tolist()
                raise ValueError(
                    f"La UI recibió valores contradictorios entre '{canonical}' "
                    f"y '{legacy}' en filas {rows}."
                )
        source_column = canonical if canonical_available else legacy
        result[canonical] = data[source_column].to_numpy()

    optional_identifiers = {
        "student_id": ("student_id", "id_estudiante"),
        "student_name": ("student_name", "nombre_estudiante"),
    }
    for output, candidates in optional_identifiers.items():
        source_column = next(
            (column for column in candidates if column in data.columns),
            None,
        )
        if source_column is not None:
            result[output] = data[source_column].to_numpy()

    return result.reset_index(drop=True)


def predecir_lote_ria6(ria6, data):
    """Procesa cohortes de UI mayores al límite seguro de un solo lote."""
    canonical = construir_input_ria6(data)
    batch_size = ria6.max_batch_size
    results = []
    for start in range(0, len(canonical), batch_size):
        results.extend(
            ria6.predict_batch(canonical.iloc[start : start + batch_size])
        )
    return results
