import pandas as pd


def generar_resultados(df, ria1, ria3, ria8, ria11, ria12):

    data = df.sample(1)

    input_data = data.to_dict(orient="records")[0]

    resultados = {

        "RIA1 - Desempeño": {
            "resultado": ria1.predict(data),
            "accuracy": ria1.accuracy,
            "precision": ria1.precision,
            "importancias": dict(zip(
                ria1.feature_columns,
                ria1.model.feature_importances_
            )),
            "input_data": input_data
        },

        "RIA3 - Recomendación": {
            "resultado": ria3.predict(data),
            "accuracy": ria3.accuracy,
            "precision": ria3.precision,
            "importancias": dict(zip(
                ria3.feature_columns,
                ria3.model_stage1.feature_importances_
            )),
            "input_data": input_data
        },

        "RIA8 - Anomalías": {
            "resultado": ria8.predict(data),
            "anomalias": f"{ria8.anomaly_ratio:.2%} del dataset detectado como anómalo",
            "importancias": ria8.calcular_importancia(df),
            "input_data": input_data
        },

        "RIA11 - Tiempo": {
            "resultado": ria11.predict(data),
            "accuracy": ria11.accuracy,
            "precision": ria11.precision,
            "importancias": dict(zip(
                ria11.feature_columns,
                ria11.model.feature_importances_
            )),
            "input_data": input_data
        },

        "RIA12 - Código": {
            "resultado": ria12.predict(data),
            "accuracy": ria12.accuracy,
            "precision": ria12.precision,
            "importancias": dict(zip(
                ria12.feature_columns,
                ria12.model.feature_importances_
            )),
            "input_data": input_data
        }
    }

    return resultados