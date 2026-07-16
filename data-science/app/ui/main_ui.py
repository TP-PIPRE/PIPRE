from time import perf_counter

from app.application.services.ria01_service import RIA01Service
from app.application.services.ria02_service import RIA02Service
from app.application.services.ria03_service import RIA03Service
from app.application.services.ria04_service import RIA04Service
from app.application.services.ria08_service import RIA08Service
from app.application.services.ria11_service import RIA11Service
from app.infrastructure.container import (
    create_dataset_repository,
    create_pipeline,
    create_ui_model_repositories,
)
from app.ui.evaluador import generar_resultados
from app.ui.ui_resultados import mostrar_resultados


UI_MODEL_VERSIONS = {
    "ria1": RIA01Service.MODEL_VERSION,
    "ria2": RIA02Service.MODEL_VERSION,
    "ria3": RIA03Service.MODEL_VERSION,
    "ria4": RIA04Service.MODEL_VERSION,
    "ria8": RIA08Service.MODEL_VERSION,
    "ria11": RIA11Service.MODEL_VERSION,
    "ria12": "ria12-v1-ui",
}


def load_ui_pipeline(df):
    pipeline = create_pipeline()
    status = pipeline.load_or_train(
        df,
        create_ui_model_repositories(),
        UI_MODEL_VERSIONS,
    )
    return pipeline, status


def main():
    started_at = perf_counter()
    df = create_dataset_repository().load()
    pipeline, status = load_ui_pipeline(df)
    elapsed = perf_counter() - started_at
    print(f"UI models ready in {elapsed:.2f}s: {status}")

    ria1, ria2, ria3, ria4, ria8, ria11, ria12 = pipeline.get_models()

    def evaluar():
        return generar_resultados(df, ria1, ria2, ria3, ria4, ria8, ria11, ria12)

    resultados = evaluar()

    mostrar_resultados(resultados, evaluar)


if __name__ == "__main__":
    main()
