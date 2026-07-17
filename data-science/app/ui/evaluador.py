from app.application.metrics import round_metric


DIFFICULTY_LABELS = {
    "low": "dificultad baja",
    "medium": "dificultad media",
    "high": "dificultad alta",
}

DIFFICULTY_RECOMMENDATIONS = {
    "low": "Bajar dificultad y reforzar bases.",
    "medium": "Mantener dificultad actual.",
    "high": "Subir dificultad con mayor reto.",
}

REASON_LABELS = {
    "strong_results": "Buen rendimiento.",
    "high_error_ratio": "Errores altos.",
    "high_frustration": "Frustracion elevada.",
    "strong_recent_progress": "Buen progreso reciente.",
    "unstable_performance": "Desempeno inestable.",
    "balanced_performance": "Desempeno equilibrado.",
    "mixed_adaptation_signals": "Senales mixtas.",
}

RIA2_RESULT_LABELS = {
    "needs_guidance": "Requiere retroalimentacion",
    "on_track": "En buen camino",
}


def traducir_detalle_dificultad(detalle):
    difficulty_level = detalle.get("difficulty_level")

    return {
        "nivel_dificultad": DIFFICULTY_LABELS.get(
            difficulty_level,
            difficulty_level
        ),
        "recomendacion": DIFFICULTY_RECOMMENDATIONS.get(
            difficulty_level,
            "Ajustar dificultad segun desempeno."
        ),
        "razones": [
            REASON_LABELS.get(reason, reason)
            for reason in detalle.get("reasons", [])
        ],
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
        columns = getattr(
            modelo, "selected_feature_columns", modelo.feature_columns
        )
        return dict(zip(columns, modelo.model.feature_importances_))

    return {}


def generar_resultados(df, ria1, ria2, ria3, ria4, ria8, ria11, ria12):

    data = df.sample(1)
    ria4_resultado = ria4.predict(data)
    ria4_detalle = ria4.predict_detailed(data)
    ria2_input = construir_input_ria2(data)
    ria2_detalle = ria2.predict_detailed(ria2_input)

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

        "RIA4 - Dificultad": {
            "resultado": DIFFICULTY_LABELS.get(ria4_resultado, ria4_resultado),
            "detalle": traducir_detalle_dificultad(ria4_detalle),
            "accuracy": round_metric(ria4.accuracy),
            "precision": round_metric(ria4.precision),
            "importancias": dict(zip(
                ria4.feature_columns,
                ria4.model.feature_importances_
            )),
            "input_data": get_input_data([
                "puntaje",
                "tasa_exito",
                "errores",
                "intentos",
                "ayuda_solicitada",
                "actividades_completadas",
                "dias_inactivo",
                "nivel_logico"
            ])
        },

        "RIA8 - Anomalías": {
            "resultado": ria8.predict(data),
            "interpretacion": ria8.predict_detailed(data),
            "anomalias": f"{ria8.anomaly_ratio:.2%} del dataset detectado como anómalo",
            "importancias": ria8.calcular_importancia(df),
            "input_data": get_input_data([
                "intentos",
                "errores",
                "puntaje",
                "dias_inactivo"
            ])
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
