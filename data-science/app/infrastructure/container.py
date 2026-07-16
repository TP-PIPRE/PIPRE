from app.adapters.ml_models.ria01_desempeño import ClasificadorDesempeno
from app.adapters.ml_models.ria02_feedback import RetroalimentacionAutomatica
from app.adapters.ml_models.ria03_recomendador import RecomendadorActividades
from app.adapters.ml_models.ria04_dificultad import AjusteAdaptativoDificultad
from app.adapters.ml_models.ria08_anomalias import DetectorAnomalias
from app.adapters.ml_models.ria10_pedagogica import RecomendadorPedagogico
from app.adapters.ml_models.ria11_tiempo import ClasificadorTiempo
from app.adapters.ml_models.ria12_codigo import EvaluadorCodigo
from app.adapters.repositories.dataset_repository import ExcelDatasetRepository
from app.adapters.repositories.model_repository import JoblibModelRepository
from app.application.services.pipeline_service import PipelineIA
from app.application.services.ria01_service import RIA01Service
from app.application.services.ria02_service import RIA02Service
from app.application.services.ria03_service import RIA03Service
from app.application.services.ria04_service import RIA04Service
from app.application.services.ria08_service import RIA08Service
from app.application.services.ria10_service import RIA10Service
from app.application.services.ria11_service import RIA11Service
from app.infrastructure.settings import (
    DATASET_PATH,
    RIA01_MODEL_PATH,
    RIA02_MODEL_PATH,
    RIA03_MODEL_PATH,
    RIA04_MODEL_PATH,
    RIA08_MODEL_PATH,
    RIA10_MODEL_PATH,
    RIA11_MODEL_PATH,
    RIA12_MODEL_PATH,
)


def create_dataset_repository():
    return ExcelDatasetRepository(DATASET_PATH)


def create_ria01_model_repository():
    return JoblibModelRepository(RIA01_MODEL_PATH)


def create_ria02_model_repository():
    return JoblibModelRepository(RIA02_MODEL_PATH)


def create_ria03_model_repository():
    return JoblibModelRepository(RIA03_MODEL_PATH)


def create_ria04_model_repository():
    return JoblibModelRepository(RIA04_MODEL_PATH)


def create_ria08_model_repository():
    return JoblibModelRepository(RIA08_MODEL_PATH)


def create_ria10_model_repository():
    return JoblibModelRepository(RIA10_MODEL_PATH)


def create_ria11_model_repository():
    return JoblibModelRepository(RIA11_MODEL_PATH)


def create_ria12_model_repository():
    return JoblibModelRepository(RIA12_MODEL_PATH)


def create_ui_model_repositories():
    return {
        "ria1": create_ria01_model_repository(),
        "ria2": create_ria02_model_repository(),
        "ria3": create_ria03_model_repository(),
        "ria4": create_ria04_model_repository(),
        "ria8": create_ria08_model_repository(),
        "ria11": create_ria11_model_repository(),
        "ria12": create_ria12_model_repository(),
    }


def create_ria01_service():
    return RIA01Service(ClasificadorDesempeno())


def create_ria02_service():
    return RIA02Service(RetroalimentacionAutomatica())


def create_ria03_service():
    return RIA03Service(RecomendadorActividades())


def create_ria04_service():
    return RIA04Service(AjusteAdaptativoDificultad())


def create_ria08_service():
    return RIA08Service(DetectorAnomalias())


def create_ria10_service():
    return RIA10Service(RecomendadorPedagogico())


def create_ria11_service():
    return RIA11Service(ClasificadorTiempo())


def create_pipeline():
    return PipelineIA(
        ria1=ClasificadorDesempeno(),
        ria2=RetroalimentacionAutomatica(),
        ria3=RecomendadorActividades(),
        ria4=AjusteAdaptativoDificultad(),
        ria8=DetectorAnomalias(),
        ria11=ClasificadorTiempo(),
        ria12=EvaluadorCodigo(),
    )
