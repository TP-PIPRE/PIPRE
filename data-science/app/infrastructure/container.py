from app.adapters.ml_models.ria01_desempeño import ClasificadorDesempeno
from app.adapters.ml_models.ria03_recomendador import RecomendadorActividades
from app.adapters.ml_models.ria08_anomalias import DetectorAnomalias
from app.adapters.ml_models.ria11_tiempo import ClasificadorTiempo
from app.adapters.ml_models.ria12_codigo import EvaluadorCodigo
from app.adapters.repositories.dataset_repository import ExcelDatasetRepository
from app.adapters.repositories.model_repository import JoblibModelRepository
from app.application.services.pipeline_service import PipelineIA
from app.application.services.ria01_service import RIA01Service
from app.infrastructure.settings import DATASET_PATH, RIA01_MODEL_PATH


def create_dataset_repository():
    return ExcelDatasetRepository(DATASET_PATH)


def create_ria01_model_repository():
    return JoblibModelRepository(RIA01_MODEL_PATH)


def create_ria01_service():
    return RIA01Service(ClasificadorDesempeno())


def create_pipeline():
    return PipelineIA(
        ria1=ClasificadorDesempeno(),
        ria3=RecomendadorActividades(),
        ria8=DetectorAnomalias(),
        ria11=ClasificadorTiempo(),
        ria12=EvaluadorCodigo(),
    )
