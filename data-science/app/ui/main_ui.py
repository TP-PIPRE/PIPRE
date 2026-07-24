from time import perf_counter

from app.application.services.ria01_service import RIA01Service
from app.application.services.ria02_service import RIA02Service
from app.application.services.ria03_service import RIA03Service
from app.application.services.ria04_service import RIA04Service
from app.application.services.ria05_service import RIA05Service
from app.application.services.ria06_service import RIA06Service
from app.application.services.ria07_service import RIA07Service
from app.application.services.ria08_service import RIA08Service
from app.application.services.ria09_service import RIA09Service
from app.application.services.ria10_service import RIA10Service
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
    "ria5": RIA05Service.MODEL_VERSION,
    "ria6": RIA06Service.MODEL_VERSION,
    "ria7": RIA07Service.MODEL_VERSION,
    "ria8": RIA08Service.MODEL_VERSION,
    "ria9": RIA09Service.MODEL_VERSION,
    "ria10": RIA10Service.MODEL_VERSION,
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

    ria1, ria2, ria3, ria4, ria5, ria6, ria7, ria8, ria9, ria10 = (
        pipeline.get_models()
    )

    def evaluar():
        return generar_resultados(
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
        )

    resultados = evaluar()

    mostrar_resultados(resultados, evaluar)


if __name__ == "__main__":
    main()
