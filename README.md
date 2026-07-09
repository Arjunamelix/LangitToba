#  LangitToba

> **Platform prediksi dan analisis cuaca kawasan Danau Toba berbasis Machine Learning**

LangitToba adalah platform cuaca full-stack yang memprediksi kondisi cuaca 7–14 hari ke depan untuk 118 kecamatan di 7 kabupaten kawasan Danau Toba, Sumatera Utara. Model LSTM yang dilatih dengan data 10 tahun (2015–2024) menghasilkan prediksi suhu dengan MAE 0.490°C, mengungguli SARIMA dan Prophet dalam semua metrik evaluasi.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![Go](https://img.shields.io/badge/Go-1.25-00ADD8?style=flat-square&logo=go)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=flat-square&logo=fastapi)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.21-FF6F00?style=flat-square&logo=tensorflow)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)

---

##  Daftar Isi

- [Fitur](#-fitur)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Tech Stack](#-tech-stack)
- [Model Machine Learning](#-model-machine-learning)
- [Struktur Project](#-struktur-project)
- [Instalasi & Menjalankan Lokal](#-instalasi--menjalankan-lokal)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Cakupan Wilayah](#-cakupan-wilayah)

---

##  Fitur

| Fitur | Deskripsi |
|---|---|
|  **Prediksi 7–14 Hari** | Prediksi suhu, curah hujan, kecepatan angin, dan weather code berbasis LSTM |
|  **Peta Interaktif** | Visualisasi 118 titik pemantauan dengan Leaflet + MarkerCluster, filter per kabupaten |
|  **Tren Iklim** | Analisis data historis 2015–2024 per kecamatan dengan grafik interaktif |
|  **Early Warning** | Peringatan dini cuaca ekstrem (hujan lebat, angin kencang, suhu ekstrem) |
|  **Forecast Cache** | Cache prediksi di PostgreSQL dengan TTL 6 jam, scheduler refresh otomatis |
|  **118 Kecamatan** | Mencakup 7 kabupaten — Toba, Samosir, Simalungun, Tapanuli Utara, Humbang Hasundutan, Dairi, Karo |

---

##  Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                     Browser / Client                     │
│              Next.js 16 + TypeScript (port 3000)         │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP REST
┌──────────────────────▼──────────────────────────────────┐
│                   Go / Gin Backend                       │
│                      (port 9000)                         │
│                                                          │
│  ┌─────────────────┐     ┌──────────────────────────┐   │
│  │  Forecast Cache │     │  Background Scheduler    │   │
│  │  (PostgreSQL)   │     │  Refresh setiap 6 jam    │   │
│  └────────┬────────┘     └──────────────────────────┘   │
└───────────┼──────────────────────────┬──────────────────┘
            │ GORM                     │ HTTP POST /predict
┌───────────▼──────────┐  ┌───────────▼──────────────────┐
│     PostgreSQL        │  │    FastAPI Inference          │
│   - locations         │  │       (port 8000)             │
│   - forecast_cache    │  │                               │
│   - climate data      │  │  LSTM Model (TensorFlow)      │
└──────────────────────┘  │  Open-Meteo Archive API       │
                           │  Open-Meteo Forecast API      │
                           └───────────────────────────────┘
```

**Alur request prediksi:**
1. Frontend request ke Go backend `GET /api/forecast?location=balige&days=7`
2. Go backend cek `forecast_cache` di PostgreSQL
3. **Cache hit** → return langsung dengan `source: "cache"`
4. **Cache miss** → Go backend POST ke FastAPI `/predict`
5. FastAPI fetch data historis dari Open-Meteo Archive → jalankan LSTM → return prediksi
6. Go backend simpan hasil ke cache → return ke frontend dengan `source: "live"`

---

##  Tech Stack

### Machine Learning & Inference
| Komponen | Teknologi |
|---|---|
| Model | LSTM (TensorFlow 2.21) |
| Inference API | FastAPI + Uvicorn |
| Data Source | Open-Meteo Archive API, Open-Meteo Forecast API |
| Feature Engineering | pandas, scikit-learn, numpy |

### Backend
| Komponen | Teknologi |
|---|---|
| Language | Go 1.25 |
| Framework | Gin v1.12 |
| ORM | GORM v1.31 |
| Database | PostgreSQL 16 |
| Scheduler | robfig/cron |

### Frontend
| Komponen | Teknologi |
|---|---|
| Framework | Next.js 16 + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | Recharts (ComposedChart) |
| Map | Leaflet + react-leaflet + MarkerCluster |
| State | Zustand |

---

##  Model Machine Learning

### Perbandingan Model

| Model | MAE (°C) | RMSE (°C) | MAPE (%) | R² | Status |
|---|---|---|---|---|---|
| SARIMA | 0.933 | 1.112 | 3.24 | -0.098 | — |
| Prophet | 0.726 | 0.884 | 2.56 | 0.307 | — |
| **LSTM** | **0.490** | **0.629** | **1.70** | **0.649** | ✅ Digunakan |

### Arsitektur LSTM

```
Input  → window 14 hari (temperature_2m_max)
       → LSTM(64, return_sequences=True)
       → Dropout(0.2)
       → LSTM(32, return_sequences=False)
       → Dropout(0.2)
       → Dense(16, relu)
       → Dense(1)

Optimizer : Adam (lr=0.001)
Loss      : MSE
Callbacks : EarlyStopping(patience=15), ReduceLROnPlateau(patience=7)
```

### Cara Kerja Prediksi
1. Fetch 30 hari data historis suhu dari Open-Meteo Archive API
2. Scale dengan `MinMaxScaler` yang disimpan di `models/lstm_scaler.pkl`
3. LSTM prediksi `temp_max` untuk N hari ke depan (autoregressive)
4. Fetch `precipitation`, `windspeed`, `weathercode` dari Open-Meteo Forecast API
5. Gabungkan hasil → hitung `risk_level` dan `warnings`

---

##  Struktur Project

```
LangitToba/
├── src/                        # Python — ML & Inference
│   ├── inference/
│   │   ├── main.py             # FastAPI app
│   │   ├── predictor.py        # WeatherPredictor class (LSTM)
│   │   └── schemas.py          # Pydantic request/response models
│   └── utils/
│       ├── config.py           # Konfigurasi, load lokasi dari DB
│       └── logger.py
│
├── models/                     # Model artifacts (gitignored)
│   ├── lstm_model.keras
│   └── lstm_scaler.pkl
│
├── backend/                    # Go — REST API
│   ├── cmd/main.go             # Entry point
│   └── internal/
│       ├── handler/            # HTTP handlers (forecast, location, warning, climate)
│       ├── repository/         # GORM queries (weather, location)
│       ├── service/            # Business logic (forecast service)
│       ├── job/                # Background scheduler (forecast_refresh)
│       └── model/              # GORM models
│
├── frontend/                   # Next.js — UI
│   ├── app/
│   │   ├── page.tsx            # Homepage
│   │   ├── forecast/page.tsx   # Prediksi 7 hari + chart
│   │   ├── climate/page.tsx    # Tren iklim historis
│   │   ├── warning/page.tsx    # Early warning per kabupaten
│   │   ├── map/page.tsx        # Peta interaktif
│   │   └── about/page.tsx      # Tentang project
│   ├── components/
│   │   ├── ui/LocationCombobox.tsx   # Searchable dropdown 118 lokasi
│   │   └── layout/             # Navbar, Footer
│   ├── lib/api.ts              # Axios API client
│   ├── store/useWeatherStore.ts # Zustand global state
│   └── types/                  # TypeScript interfaces
│
├── scripts/                    # Seeding & utility scripts
├── data/                       # Data historis (gitignored)
├── notebooks/                  # Jupyter notebooks eksplorasi & training
├── .env                        # Environment variables (gitignored)
└── README.md
```

---

##  Instalasi & Menjalankan Lokal

### Prerequisites

- **Go** 1.25+
- **Python** 3.10+
- **Node.js** 18+
- **PostgreSQL** 16+

### 1. Clone Repository

```bash
git clone https://github.com/Arjunamelix/LangitToba.git
cd LangitToba
```

### 2. Setup Environment Variables

Buat file `.env` di root project:

```bash
cp .env.example .env
# Edit sesuai konfigurasi lokal kamu
```

Lihat bagian [Environment Variables](#-environment-variables) untuk detail.

### 3. Setup Database PostgreSQL

```sql
CREATE DATABASE "LangitToba";
```

Kemudian jalankan seeding lokasi:

```bash
# Aktifkan virtual environment Python dulu
python scripts/seed_locations.py
```

### 4. Jalankan FastAPI (Inference)

```bash
# Buat dan aktifkan virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Jalankan
uvicorn src.inference.main:app --host 0.0.0.0 --port 8000
```

FastAPI akan otomatis load 118 lokasi dari PostgreSQL saat startup.

### 5. Jalankan Go Backend

```bash
cd backend
go run cmd/main.go
```

Backend berjalan di `http://localhost:9000`. Scheduler forecast refresh akan otomatis berjalan setiap 6 jam.

### 6. Jalankan Frontend

```bash
cd frontend
npm install
npm run dev
```

Buka `http://localhost:3000`.

### Urutan yang Benar

```
PostgreSQL → FastAPI (port 8000) → Go Backend (port 9000) → Frontend (port 3000)
```

>  FastAPI **harus jalan lebih dulu** sebelum Go backend, karena Go backend akan langsung coba connect ke FastAPI saat startup scheduler.

---

## 🔧 Environment Variables

### Root `.env`

```env
# FastAPI Inference URL (dibaca oleh Go backend)
INFERENCE_URL=http://127.0.0.1:8000

# Go Backend
BACKEND_PORT=9000

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=LangitToba
DB_USER=postgres
DB_PASSWORD=your_password_here
```

### `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:9000
```

---

## 📡 API Reference

Base URL: `http://localhost:9000`

### Health Check

```
GET /api/health
```

### Prediksi Cuaca

```
GET /api/forecast?location={key}&days={1-14}
```

**Response:**
```json
{
  "source": "cache",
  "expires_at": "2026-07-07T12:00:00Z",
  "forecast": {
    "location": "balige",
    "location_label": "Balige (Tobasa)",
    "lat": -2.3333,
    "lon": 99.0667,
    "forecast_days": 7,
    "generated_at": "2026-07-07T06:00:00Z",
    "forecast": [
      {
        "date": "2026-07-07",
        "temp_max": 28.5,
        "temp_min": 21.2,
        "precipitation": 5.3,
        "windspeed_max": 18.0,
        "weathercode": 2,
        "risk_level": "normal",
        "warnings": []
      }
    ]
  }
}
```

### Daftar Lokasi

```
GET /api/locations
GET /api/locations?tahap=1
GET /api/locations/{key}
```

### Early Warning

```
GET /api/warnings
GET /api/warnings/{key}
```

### Data Iklim Historis

```
GET /api/climate?location={key}
GET /api/climate/all
```

---

##  Cakupan Wilayah

| Kabupaten | Jumlah Kecamatan |
|---|---|
| Toba | 16 |
| Samosir | 9 |
| Simalungun | 32 |
| Tapanuli Utara | 15 |
| Humbang Hasundutan | 10 |
| Dairi | 15 |
| Karo | 17 |
| **Total** | **118** |

Data koordinat kecamatan bersumber dari **OpenStreetMap Overpass API** dan **BPS (Badan Pusat Statistik)**, disimpan dalam tabel `locations` di PostgreSQL.

---

##  Author

**Arjuna Melix Sihombing**  
D4 TRPL · Institut Teknologi Del · 2026  
GitHub: [@Arjunamelix](https://github.com/Arjunamelix)

---

*Data cuaca bersumber dari [Open-Meteo](https://open-meteo.com/) — gratis untuk penggunaan non-komersial.*
