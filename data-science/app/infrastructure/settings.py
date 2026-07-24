from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]
DATASET_PATH = BASE_DIR / "data" / "dataset.xlsx"
SAVED_MODELS_DIR = BASE_DIR / "saved_models"
RIA01_MODEL_PATH = SAVED_MODELS_DIR / "ria01_model.pkl"
RIA02_MODEL_PATH = SAVED_MODELS_DIR / "ria02_model.pkl"
RIA03_MODEL_PATH = SAVED_MODELS_DIR / "ria03_model.pkl"
RIA04_MODEL_PATH = SAVED_MODELS_DIR / "ria04_generador.pkl"
RIA05_MODEL_PATH = SAVED_MODELS_DIR / "ria05_errores_model.pkl"
RIA06_MODEL_PATH = SAVED_MODELS_DIR / "ria06_patrones_model.pkl"
RIA07_MODEL_PATH = SAVED_MODELS_DIR / "ria07_riesgo_anomalias_model.pkl"
RIA08_MODEL_PATH = SAVED_MODELS_DIR / "ria08_pedagogica_model.pkl"
RIA09_MODEL_PATH = SAVED_MODELS_DIR / "ria09_tiempo_model.pkl"
RIA10_MODEL_PATH = SAVED_MODELS_DIR / "ria10_codigo_model.pkl"
