from app.application.metrics import round_metric

RIA2_RESULT_LABELS = {
    "needs_guidance": "Requiere retroalimentacion",
    "on_track": "En buen camino",
}

RIA10_RESULT_LABELS = {
    "individual_support": "Requiere apoyo individual",
    "reinforce_group": "Requiere refuerzo pedagogico",
    "maintain_strategy": "Mantener estrategia actual",
    "increase_challenge": "Proponer un reto mayor",
}

RIA10_COMPARISON_LABELS = {
    "favorable": "Favorable respecto al grado",
    "near_grade_average": "Cercano al promedio del grado",
    "needs_attention": "Requiere atencion",
}

RIA10_REFERENCE_LABELS = {
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


def generar_resultados(df, ria1, ria2, ria3, ria4, ria8, ria10, ria11, ria12):

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
    ria2_input = construir_input_ria2(data)
    ria2_detalle = ria2.predict_detailed(ria2_input)
    ria10_detalle = ria10.predict_detailed(data)
    ria8_detalle = ria8.predict_detailed(data)
    ria8_estudiantes = ria8.predict_batch(df, sort_by_risk=True)
    ria8_resumen = {
        "total": len(ria8_estudiantes),
        "normal": sum(row["risk_level"] == "low" for row in ria8_estudiantes),
        "atencion": sum(row["risk_level"] == "medium" for row in ria8_estudiantes),
        "critico": sum(row["risk_level"] == "high" for row in ria8_estudiantes),
        "anomalias": sum(row["anomaly"] for row in ria8_estudiantes),
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

        "RIA8 - Riesgo y anomalías": {
            "resultado": ria8_detalle["risk_label"],
            "detalle": {
                "puntaje_riesgo": ria8_detalle["risk_score"],
                "anomalia": ria8_detalle["anomaly"],
                "puntaje_anomalia": ria8_detalle["anomaly_score"],
                "razones": ria8_detalle["reasons"],
                "recomendacion_docente": ria8_detalle["teacher_recommendation"],
                "usa_historial_del_estudiante": ria8_detalle["student_history_used"],
                "usa_cohorte_de_referencia": ria8_detalle["reference_cohort_used"],
            },
            "resumen_docente": ria8_resumen,
            "tabla_docente": ria8_estudiantes,
            "anomalias": f"{ria8.reference_anomaly_ratio:.2%} de la cohorte de referencia marcada como anómala (no es calidad del modelo)",
            "pesos_riesgo": ria8.obtener_pesos_riesgo()["weights"],
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

        "RIA10 - Recomendacion pedagogica": {
            "resultado": RIA10_RESULT_LABELS.get(
                ria10_detalle["pedagogical_recommendation"],
                ria10_detalle["pedagogical_recommendation"],
            ),
            "detalle": {
                "perfil_pedagogico": ria10_detalle["pedagogical_profile"],
                "riesgo_pedagogico": ria10_detalle["pedagogical_risk"],
                "confianza": f"{ria10_detalle['confidence']:.2%}",
                "comparacion_con_grado": traducir_comparacion_ria10(
                    ria10_detalle["grade_comparison"]
                ),
                "razones": ria10_detalle["reasons"],
                "sugerencia_docente": traducir_sugerencia_ria10(
                    ria10_detalle["teacher_suggestion"]
                ),
            },
            "accuracy": round_metric(ria10.accuracy),
            "precision": round_metric(ria10.precision),
            "importancias": obtener_importancias_modelo(ria10),
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

        "RIA11 - Tiempo": {
            "resultado": ria11.predict(data),
            "accuracy": round_metric(ria11.accuracy),
            "precision": round_metric(ria11.precision),
            "importancias": dict(zip(
                ria11.feature_columns,
                ria11.model.feature_importances_
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

        "RIA12 - Código": {
            "resultado": ria12.predict(data),
            "accuracy": round_metric(ria12.accuracy),
            "precision": round_metric(ria12.precision),
            "importancias": dict(zip(
                ria12.feature_columns,
                ria12.model.feature_importances_
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


def traducir_comparacion_ria10(comparison):
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
            "estado": RIA10_COMPARISON_LABELS.get(
                values["status"],
                values["status"],
            ),
        }

    return {
        "grado": comparison["grade"],
        "referencia": RIA10_REFERENCE_LABELS.get(
            comparison["reference_scope"],
            comparison["reference_scope"],
        ),
        "metricas": metrics,
    }


def traducir_sugerencia_ria10(suggestion):
    return {
        "titulo": suggestion["title"],
        "resumen": suggestion["summary"],
        "prioridad": suggestion["priority"],
        "acciones": suggestion["actions"],
        "revisar_despues_de_actividades": suggestion["review_after_activities"],
        "basada_en_razones": suggestion["based_on_reasons"],
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
