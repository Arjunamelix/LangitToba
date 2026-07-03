import numpy as np
import pandas as pd
import pickle
import requests
from datetime import datetime, timedelta
from typing import List, Dict

import tensorflow as tf

from src.utils.config import (
    LSTM_MODEL_PATH, LSTM_SCALER_PATH,
    WINDOW_SIZE, THRESHOLDS, LOCATIONS
)
from src.utils.logger import get_logger

logger = get_logger("predictor")

class WeatherPredictor:
    def __init__(self):
        self.lstm_model = None
        self.scaler     = None
        self._load_models()

    def _load_models(self):
        logger.info("Loading LSTM model...")
        self.lstm_model = tf.keras.models.load_model(str(LSTM_MODEL_PATH))
        logger.info("Loading scaler...")
        with open(LSTM_SCALER_PATH, "rb") as f:
            self.scaler = pickle.load(f)
        logger.info("Models loaded successfully!")

    def _fetch_recent_weather(self, lat: float, lon: float, days: int = 30) -> pd.DataFrame:
        """Ambil data cuaca terbaru dari Open-Meteo untuk input LSTM."""
        end_date = (datetime.now() - timedelta(days=5)).strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")

        url    = "https://archive-api.open-meteo.com/v1/archive"
        params = {
            "latitude"   : lat,
            "longitude"  : lon,
            "start_date" : start_date,
            "end_date"   : end_date,
            "daily"      : [
                "temperature_2m_max",
                "temperature_2m_min",
                "precipitation_sum",
                "windspeed_10m_max",
                "weathercode",
            ],
            "timezone": "Asia/Jakarta"
        }

        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        df = pd.DataFrame(data["daily"])
        df["date"] = pd.to_datetime(df["time"])
        df = df.drop(columns=["time"])
        return df



    def _fetch_forecast_weather(self, lat: float, lon: float, days: int = 14) -> pd.DataFrame:
        url = 'https://api.open-meteo.com/v1/forecast'
        params = {
            'latitude': lat,
            'longitude': lon,
            'daily': [
                'temperature_2m_min',
                'precipitation_sum',
                'windspeed_10m_max',
                'weathercode',
            ],
            'timezone': 'Asia/Jakarta',
            'forecast_days': days,
        }
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        df = pd.DataFrame(data['daily'])
        df['date'] = pd.to_datetime(df['time'])
        df = df.drop(columns=['time'])
        return df

    def _predict_lstm(self, recent_temps: np.ndarray, n_days: int) -> List[float]:
        """Prediksi suhu n hari ke depan menggunakan LSTM."""
        scaled    = self.scaler.transform(recent_temps.reshape(-1, 1)).flatten()
        sequence  = list(scaled[-WINDOW_SIZE:])
        predictions = []

        for _ in range(n_days):
            x   = np.array(sequence[-WINDOW_SIZE:]).reshape(1, WINDOW_SIZE, 1)
            pred_scaled = self.lstm_model.predict(x, verbose=0)[0][0]
            predictions.append(pred_scaled)
            sequence.append(pred_scaled)

        # Inverse transform ke °C
        preds = self.scaler.inverse_transform(
            np.array(predictions).reshape(-1, 1)
        ).flatten()
        return preds.tolist()

    def _get_risk_level(self, precip: float, wind: float) -> str:
        if precip > THRESHOLDS["rain_very_heavy"] or wind > THRESHOLDS["wind_danger"] * 1.5:
            return "sangat_tinggi"
        elif precip > THRESHOLDS["rain_heavy"] or wind > THRESHOLDS["wind_danger"]:
            return "tinggi"
        elif precip > 20 or wind > 30:
            return "sedang"
        return "normal"

    def _get_warnings(self, precip: float, wind: float, temp_max: float) -> List[str]:
        warnings = []
        if precip > THRESHOLDS["rain_very_heavy"]:
            warnings.append("Hujan sangat lebat — potensi banjir")
        elif precip > THRESHOLDS["rain_heavy"]:
            warnings.append("Hujan lebat")
        if wind > THRESHOLDS["wind_danger"]:
            warnings.append("Angin kencang — berbahaya untuk nelayan")
        if temp_max > THRESHOLDS["temp_hot"]:
            warnings.append("Suhu ekstrem tinggi")
        return warnings

    def predict(self, location: str, days: int) -> Dict:
        loc_info = LOCATIONS[location]
        lat, lon = loc_info["lat"], loc_info["lon"]

        logger.info(f"Predicting {days} days for {location} ({lat}, {lon})")

        # Ambil data historis terbaru untuk input LSTM
        recent_df    = self._fetch_recent_weather(lat, lon, days=30)
        recent_temps = recent_df["temperature_2m_max"].values

        # Prediksi suhu dengan LSTM
        lstm_preds = self._predict_lstm(recent_temps, days)

        # Ambil forecast cuaca lain (hujan, angin) dari Open-Meteo
        forecast_df = self._fetch_forecast_weather(lat, lon, days)

        # Gabungkan hasil
        results = []
        for i in range(min(days, len(forecast_df))):
            row          = forecast_df.iloc[i]
            temp_max     = round(float(lstm_preds[i]), 2)
            temp_min     = round(float(row["temperature_2m_min"]), 2)
            precip       = round(float(row["precipitation_sum"]), 2)
            wind         = round(float(row["windspeed_10m_max"]), 2)
            weathercode  = int(row["weathercode"])

            results.append({
                "date"         : row["date"].strftime("%Y-%m-%d"),
                "temp_max"     : temp_max,
                "temp_min"     : temp_min,
                "precipitation": precip,
                "windspeed_max": wind,
                "weathercode"  : weathercode,
                "risk_level"   : self._get_risk_level(precip, wind),
                "warnings"     : self._get_warnings(precip, wind, temp_max),
            })

        return {
            "location"      : location,
            "location_label": loc_info["label"],
            "lat"           : lat,
            "lon"           : lon,
            "forecast_days" : days,
            "generated_at"  : datetime.now().isoformat(),
            "forecast"      : results,
        }