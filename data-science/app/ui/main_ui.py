from app.infrastructure.container import create_dataset_repository, create_pipeline
from app.ui.evaluador import generar_resultados
from app.ui.ui_resultados import mostrar_resultados


def main():

    #  cargar dataset
    df = create_dataset_repository().load()

    #  pipeline
    pipeline = create_pipeline()
    pipeline.train(df)

    ria1, ria3, ria8, ria11, ria12 = pipeline.get_models()

    # función reutilizable
    def evaluar():
        return generar_resultados(df, ria1, ria3, ria8, ria11, ria12)

    resultados = evaluar()

    #  UI
    mostrar_resultados(resultados, evaluar)


if __name__ == "__main__":
    main()
