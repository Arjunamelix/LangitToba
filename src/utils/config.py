from pathlib import Path
import os
import sys
import logging
from urllib.parse import quote_plus

# Pastikan root project ada di path — fix untuk uvicorn subprocess
_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

logger = logging.getLogger(__name__)

# Base paths
BASE_DIR           = Path(__file__).resolve().parent.parent.parent
MODELS_DIR         = BASE_DIR / "models"
DATA_DIR           = BASE_DIR / "data"

# Model paths
LSTM_MODEL_PATH    = MODELS_DIR / "lstm_model.keras"
LSTM_SCALER_PATH   = MODELS_DIR / "lstm_scaler.pkl"
PROPHET_MODEL_PATH = MODELS_DIR / "prophet_model.pkl"

# LSTM config
WINDOW_SIZE = 14

# Early warning thresholds
THRESHOLDS = {
    "rain_heavy"      : 50,
    "rain_very_heavy" : 100,
    "wind_danger"     : 40,
    "temp_hot"        : 35,
    "temp_cold"       : 15,
}

# ---------------------------------------------------------------------------
# LOCATIONS — DB-first, fallback ke hardcode kalau DB tidak tersedia
# ---------------------------------------------------------------------------

_LOCATIONS_HARDCODE = {
    "balige":       {"lat": -2.3333, "lon": 99.0667, "label": "Balige (Tobasa)"},
    "parapat":      {"lat": -2.6600, "lon": 98.9400, "label": "Parapat"},
    "pangururan":   {"lat": -2.5900, "lon": 98.6900, "label": "Pangururan (Samosir)"},
    "nainggolan":   {"lat": -2.6300, "lon": 98.8100, "label": "Nainggolan"},
    "tengah_danau": {"lat": -2.6000, "lon": 98.8000, "label": "Tengah Danau Toba"},
}


def _load_locations_from_db() -> dict:
    """Load lokasi aktif dari PostgreSQL. Return empty dict kalau gagal."""
    try:
        from sqlalchemy import create_engine, text
        from dotenv import load_dotenv

        load_dotenv(BASE_DIR / ".env")

        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            host     = os.getenv("DB_HOST", "localhost")
            port     = os.getenv("DB_PORT", "5432")
            name     = quote_plus(os.getenv("DB_NAME", "langittoba"))
            user     = quote_plus(os.getenv("DB_USER", "postgres"))
            password = quote_plus(os.getenv("DB_PASSWORD", ""))
            db_url   = f"postgresql://{user}:{password}@{host}:{port}/{name}"

        engine = create_engine(db_url, connect_args={"connect_timeout": 5})

        with engine.connect() as conn:
            rows = conn.execute(
                text("SELECT key, label, lat, lon FROM locations WHERE is_active = TRUE ORDER BY label")
            ).fetchall()

        if not rows:
            print("[config] Tabel locations kosong, pakai hardcode", flush=True)
            logger.warning("config.py: Tabel locations kosong, pakai hardcode")
            return {}

        result = {
            row.key: {"lat": row.lat, "lon": row.lon, "label": row.label}
            for row in rows
        }
        print(f"[config] Loaded {len(result)} lokasi dari DB", flush=True)
        logger.info(f"config.py: Loaded {len(result)} lokasi dari DB")
        return result

    except Exception as e:
        print(f"[config] ERROR: {type(e).__name__}: {e}", flush=True)
        logger.warning(f"config.py: Gagal load dari DB ({e}), pakai hardcode")
        return {}


def get_locations() -> dict:
    """Return LOCATIONS dict — dari DB kalau bisa, fallback hardcode."""
    db_locations = _load_locations_from_db()
    return db_locations if db_locations else _LOCATIONS_HARDCODE


# Load saat modul pertama kali di-import
LOCATIONS = get_locations()