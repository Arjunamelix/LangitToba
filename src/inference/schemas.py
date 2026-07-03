from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date

class PredictRequest(BaseModel):
    location: str = Field(
        default="balige",
        description="Kode lokasi: balige, parapat, pangururan, nainggolan, tengah_danau"
    )
    days: int = Field(
        default=7,
        ge=1, le=14,
        description="Jumlah hari prediksi ke depan (1-14)"
    )

class DailyForecast(BaseModel):
    date: str
    temp_max: float
    temp_min: float
    precipitation: float
    windspeed_max: float
    weathercode: int
    risk_level: str        # normal, sedang, tinggi, sangat_tinggi
    warnings: List[str]    # list peringatan aktif

class PredictResponse(BaseModel):
    location: str
    location_label: str
    lat: float
    lon: float
    forecast_days: int
    generated_at: str
    forecast: List[DailyForecast]

class HealthResponse(BaseModel):
    status: str
    model: str
    version: str

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None