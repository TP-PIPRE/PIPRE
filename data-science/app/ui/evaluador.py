from app.application.metrics import round_metric


def generar_resultados(df, ria1, ria3, ria4, ria8, ria11, ria12):

    data = df.sample(1)

    def get_input_data(columns):
        available_columns = [col for col in columns if col in data.columns]
        return data[available_columns].to_dict(orient="records")[0]

    resultados = {
        "RIA1 - Desempeño": {
            "resultado": ria1.predict(data),
            "accuracy": round_metric(ria1.accuracy),
            "precision": round_metric(ria1.precision),
            "importancias": dict(zip(
                ria1.feature_columns,
                ria1.model.feature_importances_
            )),
            "input_data": get_input_data([
                "intentos",
                "errores",
                "nivel_logico",
                "interacciones_ia"
            ])
        },

        "RIA3 - Recomendación": {
            "resultado": ria3.predict(data),
            "accuracy": round_metric(ria3.accuracy),
            "precision": round_metric(ria3.precision),
            "importancias": dict(zip(
                ria3.feature_columns,
                ria3.model_stage1.feature_importances_
            )),
            "input_data": get_input_data([
                "nivel_logico",
                "dias_inactivo",
                "interacciones_ia",
                "intentos"
            ])
        },

        "RIA4 - Dificultad": {
            "resultado": ria4.predict(data),
            "detalle": ria4.predict_detailed(data),
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
