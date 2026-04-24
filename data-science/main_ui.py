import pandas as pd

from services.pipeline_service import PipelineIA
from ui.evaluador import generar_resultados
from ui.ui_resultados import mostrar_resultados


def main():

    # 🔹 cargar dataset
    df = pd.read_excel("data-science/data/dataset.xlsx")

    # 🔹 pipeline
    pipeline = PipelineIA()
    pipeline.train(df)

    ria1, ria3, ria8, ria11, ria12 = pipeline.get_models()

    # 🔁 función reutilizable
    def evaluar():
        return generar_resultados(df, ria1, ria3, ria8, ria11, ria12)

    resultados = evaluar()

    # 🔥 UI
    mostrar_resultados(resultados, evaluar)


if __name__ == "__main__":
    main()