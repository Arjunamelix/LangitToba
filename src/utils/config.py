from pathlib import Path

# Base paths
BASE_DIR   = Path(__file__).resolve().parent.parent.parent
MODELS_DIR = BASE_DIR / "models"
DATA_DIR   = BASE_DIR / "data"

# Model paths
LSTM_MODEL_PATH  = MODELS_DIR / "lstm_model.keras"
LSTM_SCALER_PATH = MODELS_DIR / "lstm_scaler.pkl"
PROPHET_MODEL_PATH = MODELS_DIR / "prophet_model.pkl"

# Koordinat lokasi kawasan Toba
LOCATIONS = {
    "balige": {
        "lat": -2.3333, "lon": 99.0667,
        "label": "Balige (Tobasa)"
    },
    "parapat": {
        "lat": -2.6600, "lon": 98.9400,
        "label": "Parapat"
    },
    "pangururan": {
        "lat": -2.5900, "lon": 98.6900,
        "label": "Pangururan (Samosir)"
    },
    "nainggolan": {
        "lat": -2.6300, "lon": 98.8100,
        "label": "Nainggolan"
    },
    "tengah_danau": {
        "lat": -2.6000, "lon": 98.8000,
        "label": "Tengah Danau Toba"
    },
}

# LSTM config
WINDOW_SIZE = 14

# Early warning thresholds
THRESHOLDS = {
    "rain_heavy"      : 50,   # mm/hari
    "rain_very_heavy" : 100,  # mm/hari
    "wind_danger"     : 40,   # km/h
    "temp_hot"        : 35,   # °C
    "temp_cold"       : 15,   # °C
}