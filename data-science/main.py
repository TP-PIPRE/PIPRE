from fastapi import FastAPI
import pandas as pd
from contextlib import asynccontextmanager
import os
import joblib

from schemas.ria01_schema import RIA01Input
from services.ria01_service import RIA01Service

# =========================
# 📦 CONFIG
# =========================
MODEL_PATH = "models/ria01_model.pkl"

# instancia global
ria01_service = RIA01Service()


# =========================
# 🚀 LIFESPAN
# =========================
@asynccontextmanager
async def lifespan(app: FastAPI):

    # 🔹 SI EXISTE MODELO → CARGAR
    if os.path.exists(MODEL_PATH):
        print("📦 Cargando modelo existente...")
        ria01_service.model = joblib.load(MODEL_PATH)
        ria01_service._trained = True
        print("✅ Modelo cargado correctamente")

    else:
        print("🧠 Entrenando modelo desde cero...")
        df = pd.read_excel("data/dataset.xlsx")

        ria01_service.train(df)

        # 🔥 guardar TODO el modelo (incluye encoders)
        joblib.dump(ria01_service.model, MODEL_PATH)

        print("💾 Modelo entrenado y guardado")

    yield

    print("🛑 Cerrando API...")


# =========================
# 🌐 APP
# =========================
app = FastAPI(
    title="API IA - RIA01",
    lifespan=lifespan
)


# =========================
# 📊 ENDPOINT PREDICT
# =========================
@app.post("/ria01/predict")
def predict_ria01(data: RIA01Input):
    return ria01_service.predict(data.dict())


# =========================
# 🔍 ENDPOINT INFO
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
# ❤️ HEALTH CHECK
# =========================
@app.get("/health")
def health():
    return {"status": "ok"}