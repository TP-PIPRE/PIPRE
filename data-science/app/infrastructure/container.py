from app.adapters.ml_models.ria01_desempeño import ClasificadorDesempeno
from app.adapters.ml_models.ria02_feedback import RetroalimentacionAutomatica
from app.adapters.ml_models.ria03_recomendador import RecomendadorActividades
from app.adapters.ml_models.ria04_generador import GeneradorRetosProgramacion
from app.adapters.ml_models.ria05_errores import ClasificadorErroresLogicos
from app.adapters.ml_models.ria06_patrones import AnalizadorPatronesEstudiantiles
from app.adapters.ml_models.ria07_riesgo_anomalias import DetectorRiesgoAnomalias
from app.adapters.ml_models.ria08_pedagogica import RecomendadorPedagogico
from app.adapters.ml_models.ria09_tiempo import ClasificadorTiempo
from app.adapters.ml_models.ria10_codigo import EvaluadorCodigo
from app.adapters.repositories.dataset_repository import ExcelDatasetRepository
from app.adapters.repositories.model_repository import JoblibModelRepository
from app.application.services.pipeline_service import PipelineIA
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
from app.infrastructure.settings import (
    DATASET_PATH,
    RIA01_MODEL_PATH,
    RIA02_MODEL_PATH,
    RIA03_MODEL_PATH,
    RIA04_MODEL_PATH,
    RIA05_MODEL_PATH,
    RIA06_MODEL_PATH,
    RIA07_MODEL_PATH,
    RIA08_MODEL_PATH,
    RIA09_MODEL_PATH,
    RIA10_MODEL_PATH,
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


def create_ria05_model_repository():
    return JoblibModelRepository(RIA05_MODEL_PATH)


def create_ria06_model_repository():
    return JoblibModelRepository(RIA06_MODEL_PATH)


def create_ria07_model_repository():
    return JoblibModelRepository(RIA07_MODEL_PATH)


def create_ria08_model_repository():
    return JoblibModelRepository(RIA08_MODEL_PATH)


def create_ria09_model_repository():
    return JoblibModelRepository(RIA09_MODEL_PATH)


def create_ria10_model_repository():
    return JoblibModelRepository(RIA10_MODEL_PATH)


def create_ui_model_repositories():
    return {
        "ria1": create_ria01_model_repository(),
        "ria2": create_ria02_model_repository(),
        "ria3": create_ria03_model_repository(),
        "ria4": create_ria04_model_repository(),
        "ria5": create_ria05_model_repository(),
        "ria6": create_ria06_model_repository(),
        "ria7": create_ria07_model_repository(),
        "ria8": create_ria08_model_repository(),
        "ria9": create_ria09_model_repository(),
        "ria10": create_ria10_model_repository(),
    }


def create_ria01_service():
    return RIA01Service(ClasificadorDesempeno())


def create_ria02_service():
    return RIA02Service(RetroalimentacionAutomatica())


def create_ria03_service():
    return RIA03Service(RecomendadorActividades())


def create_ria04_service():
    return RIA04Service(GeneradorRetosProgramacion())


def create_ria05_service():
    return RIA05Service(ClasificadorErroresLogicos())


def create_ria06_service():
    return RIA06Service(AnalizadorPatronesEstudiantiles())


def create_ria07_service():
    return RIA07Service(DetectorRiesgoAnomalias())


def create_ria08_service():
    return RIA08Service(RecomendadorPedagogico())


def create_ria09_service():
    return RIA09Service(ClasificadorTiempo())


def create_ria10_service():
    return RIA10Service(EvaluadorCodigo())


def create_pipeline():
    return PipelineIA(
        ria1=ClasificadorDesempeno(),
        ria2=RetroalimentacionAutomatica(),
        ria3=RecomendadorActividades(),
        ria4=GeneradorRetosProgramacion(),
        ria5=ClasificadorErroresLogicos(),
        ria6=AnalizadorPatronesEstudiantiles(),
        ria7=DetectorRiesgoAnomalias(),
        ria8=RecomendadorPedagogico(),
        ria9=ClasificadorTiempo(),
        ria10=EvaluadorCodigo(),
    )
