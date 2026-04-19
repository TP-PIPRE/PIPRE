import pandas as pd

# 🔥 IMPORTAR MODELOS
from models.ria01_desempeño import ClasificadorDesempeno
from models.ria03_recomendador import RecomendadorActividades
from models.ria08_anomalias import DetectorAnomalias
from models.ria11_tiempo import ClasificadorTiempo
from models.ria12_codigo import EvaluadorCodigo

# 🔥 UI
from ui.ui_resultados import mostrar_resultados

# 🔥 LÓGICA EXTERNA
from ui.evaluador import generar_resultados


def main():

    # =========================
    # 📊 CARGAR DATASET
    # =========================
    df = pd.read_excel("data/dataset.xlsx")

    # =========================
    # 🔹 ENTRENAR MODELOS
    # =========================
    ria1 = ClasificadorDesempeno()
    ria1.train(df)

    ria3 = RecomendadorActividades()
    ria3.train(df)
    ria3.evaluar(df)

    ria8 = DetectorAnomalias()
    ria8.train(df)

    ria11 = ClasificadorTiempo()
    ria11.train(df)

    ria12 = EvaluadorCodigo()
    ria12.train(df)

    # =========================
    # 🔥 GENERAR RESULTADOS INICIALES
    # =========================
    resultados = generar_resultados(df, ria1, ria3, ria8, ria11, ria12)

    # =========================
    # 🔄 CALLBACK BOTÓN
    # =========================
    def evaluar_otro():
        return generar_resultados(df, ria1, ria3, ria8, ria11, ria12)

    # =========================
    # 🖥️ MOSTRAR UI
    # =========================
    mostrar_resultados(resultados, evaluar_otro)


if __name__ == "__main__":
    main()