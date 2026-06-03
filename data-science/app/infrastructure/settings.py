from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]
DATASET_PATH = BASE_DIR / "data" / "dataset.xlsx"
SAVED_MODELS_DIR = BASE_DIR / "saved_models"
RIA01_MODEL_PATH = SAVED_MODELS_DIR / "ria01_model.pkl"
RIA03_MODEL_PATH = SAVED_MODELS_DIR / "ria03_model.pkl"
RIA04_MODEL_PATH = SAVED_MODELS_DIR / "ria04_model.pkl"
RIA08_MODEL_PATH = SAVED_MODELS_DIR / "ria08_model.pkl"
RIA10_MODEL_PATH = SAVED_MODELS_DIR / "ria10_model.pkl"
RIA11_MODEL_PATH = SAVED_MODELS_DIR / "ria11_model.pkl"
