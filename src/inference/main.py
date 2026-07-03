from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import traceback

from src.inference.schemas import (
    PredictRequest, PredictResponse,
    HealthResponse, ErrorResponse
)
from src.inference.predictor import WeatherPredictor
from src.utils.logger import get_logger
from src.utils.config import LOCATIONS

logger = get_logger("main")

# Inisialisasi FastAPI
app = FastAPI(
    title="LangitToba Inference API",
    description="API prediksi cuaca kawasan Danau Toba berbasis LSTM",
    version="1.0.0"
)

# CORS — izinkan request dari frontend Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model saat startup
predictor = WeatherPredictor()

@app.get("/", response_model=HealthResponse)
def health_check():
    return {
        "status" : "ok",
        "model"  : "LSTM",
        "version": "1.0.0"
    }

@app.get("/health", response_model=HealthResponse)
def health():
    return {
        "status" : "ok",
        "model"  : "LSTM",
        "version": "1.0.0"
    }

@app.get("/locations")
def get_locations():
    """Daftar lokasi yang tersedia."""
    return {
        "locations": [
            {
                "key"  : key,
                "label": val["label"],
                "lat"  : val["lat"],
                "lon"  : val["lon"],
            }
            for key, val in LOCATIONS.items()
        ]
    }

@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    """
    Prediksi cuaca kawasan Danau Toba.
    - location: kode lokasi (balige, parapat, pangururan, dll)
    - days: jumlah hari prediksi (1-14)
    """
    if request.location not in LOCATIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Lokasi '{request.location}' tidak ditemukan. "
                   f"Pilihan: {list(LOCATIONS.keys())}"
        )

    try:
        logger.info(f"Predict request: location={request.location}, days={request.days}")
        result = predictor.predict(request.location, request.days)
        return result

    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predict/{location}")
def predict_get(location: str, days: int = 7):
    """
    GET version dari predict — untuk testing mudah via browser.
    Contoh: /predict/balige?days=7
    """
    if location not in LOCATIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Lokasi '{location}' tidak ditemukan."
        )
    try:
        result = predictor.predict(location, days)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))