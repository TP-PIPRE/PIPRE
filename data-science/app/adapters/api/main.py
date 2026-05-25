from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.adapters.api.schemas import RIA01Input
from app.infrastructure.container import (
    create_dataset_repository,
    create_ria01_model_repository,
    create_ria01_service,
)


dataset_repository = create_dataset_repository()
model_repository = create_ria01_model_repository()
ria01_service = create_ria01_service()


# =========================
#  LIFESPAN
# =========================

@asynccontextmanager
async def lifespan(app: FastAPI):

    if model_repository.exists():
        print("Cargando modelo existente...")

        ria01_service.set_model(model_repository.load())

        print("Modelo cargado correctamente")

    else:
        print("Entrenando modelo desde cero...")

        df = dataset_repository.load()

        ria01_service.train(df)

        model_repository.save(ria01_service.model)

        print("Modelo entrenado y guardado")

    yield

    print("Cerrando API...")


# =========================
#  APP
# =========================

app = FastAPI(
    title="API IA - RIA01",
    lifespan=lifespan
)


# =========================
# ENDPOINT PREDICT
# =========================

@app.post("/ria01/predict")
def predict_ria01(data: RIA01Input):
    return ria01_service.predict(data.model_dump())


# =========================
#  ENDPOINT INFO
# =========================

@app.get("/ria01/info")
def info():
    return {
        "trained": ria01_service._trained,
        "features": ria01_service.model.feature_columns if ria01_service._trained else [],
        "accuracy": getattr(ria01_service.model, "accuracy", None),
        "precision": getattr(ria01_service.model, "precision", None)
    }


# =========================
#  HEALTH CHECK
# =========================

@app.get("/health")
def health():
    return {
        "status": "ok"
    }
