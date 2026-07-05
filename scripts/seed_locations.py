import os
import sys
import time
import logging
import requests
import psycopg2
from psycopg2.extras import execute_batch
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("seed_locations")

# Overpass endpoints — pakai mirror jika utama down/rate-limited
OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]

REQUEST_TIMEOUT = 90   # detik
DELAY_BETWEEN_REQUESTS = 5   # detik
MAX_RETRY = 3
RETRY_BACKOFF = [10, 30, 60]  # detik tunggu setelah retry ke-1, 2, 3

LAT_MIN, LAT_MAX = -3.5, 4.0
LON_MIN, LON_MAX = 97.5, 100.5

KABUPATEN_LIST = [
    {"name": "Kabupaten Toba",                 "short": "Toba",                 "tahap": 1},
    {"name": "Kabupaten Samosir",              "short": "Samosir",              "tahap": 1},
    {"name": "Kabupaten Tapanuli Utara",       "short": "Tapanuli Utara",       "tahap": 1},
    {"name": "Kabupaten Humbang Hasundutan",   "short": "Humbang Hasundutan",   "tahap": 1},
    {"name": "Kabupaten Dairi",                "short": "Dairi",                "tahap": 1},
    {"name": "Kabupaten Karo",                 "short": "Karo",                 "tahap": 1},
    {"name": "Kabupaten Simalungun",           "short": "Simalungun",           "tahap": 1},
]

SEED_5_AWAL = [
    {"key": "balige",       "label": "Balige (Tobasa)",       "lat": -2.3333, "lon": 99.0667, "kabupaten": "Toba",       "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "parapat",      "label": "Parapat",               "lat": -2.6600, "lon": 98.9400, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": True,  "is_active": True},
    {"key": "pangururan",   "label": "Pangururan (Samosir)",  "lat": -2.5900, "lon": 98.6900, "kabupaten": "Samosir",    "tahap": 1, "is_lakeside": True,  "is_active": True},
    {"key": "nainggolan",   "label": "Nainggolan",            "lat": -2.6300, "lon": 98.8100, "kabupaten": "Samosir",    "tahap": 1, "is_lakeside": True,  "is_active": True},
    {"key": "tengah_danau", "label": "Tengah Danau Toba",     "lat": -2.6000, "lon": 98.8000, "kabupaten": None,         "tahap": 1, "is_lakeside": True,  "is_active": True},
]


def build_overpass_query(kab_name: str) -> str:
    return f"""[out:json][timeout:90];
area["name"="{kab_name}"]["admin_level"="5"]->.searchArea;
(
  relation["admin_level"="6"](area.searchArea);
);
out center;"""


def fetch_with_retry(kab: dict) -> list[dict]:
    """Query Overpass dengan retry + fallback ke mirror."""
    query = build_overpass_query(kab["name"])
    
    for attempt in range(1, MAX_RETRY + 1):
        # Pilih endpoint: rotasi berdasarkan attempt
        endpoint = OVERPASS_ENDPOINTS[(attempt - 1) % len(OVERPASS_ENDPOINTS)]
        
        log.info(f"  Attempt {attempt}/{MAX_RETRY} via {endpoint.split('/')[2]} ...")
        try:
            resp = requests.post(
                endpoint,
                data={"data": query},
                timeout=REQUEST_TIMEOUT,
                headers={"User-Agent": "LangitToba-Seeder/2.0 (github.com/Arjunamelix/LangitToba)"},
            )
            
            if resp.status_code == 429:
                wait = RETRY_BACKOFF[attempt - 1]
                log.warning(f"  Rate limited (429). Tunggu {wait}s lalu retry ...")
                time.sleep(wait)
                continue
            
            if resp.status_code == 504:
                wait = RETRY_BACKOFF[attempt - 1]
                log.warning(f"  Gateway Timeout (504). Tunggu {wait}s lalu retry ...")
                time.sleep(wait)
                continue
            
            resp.raise_for_status()
            
            elements = resp.json().get("elements", [])
            log.info(f"  → {len(elements)} elemen ditemukan dari OSM")
            return parse_elements(elements, kab)
        
        except requests.exceptions.Timeout:
            log.warning(f"  Timeout. Tunggu {RETRY_BACKOFF[attempt-1]}s ...")
            time.sleep(RETRY_BACKOFF[attempt - 1])
        except requests.exceptions.RequestException as e:
            log.error(f"  Error: {e}")
            if attempt < MAX_RETRY:
                time.sleep(RETRY_BACKOFF[attempt - 1])
    
    log.error(f"  Semua {MAX_RETRY} attempt gagal untuk {kab['name']}")
    return []


def parse_elements(elements: list, kab: dict) -> list[dict]:
    results = []
    skipped_coord = 0
    skipped_name = 0

    for el in elements:
        tags = el.get("tags", {})
        name = tags.get("name") or tags.get("name:id") or ""
        if not name:
            skipped_name += 1
            continue

        center = el.get("center", {})
        lat = center.get("lat")
        lon = center.get("lon")

        if lat is None or lon is None:
            skipped_coord += 1
            continue

        if not (LAT_MIN <= lat <= LAT_MAX and LON_MIN <= lon <= LON_MAX):
            log.warning(f"  Out of bounds: '{name}' lat={lat:.4f}, lon={lon:.4f}")
            skipped_coord += 1
            continue

        # Key: {nama_kecamatan}_{kabupaten_suffix}
        kabupaten_suffix = kab["short"].lower().replace(" ", "_")
        key_raw = name.lower().replace(" ", "_")
        key_clean = "".join(c for c in key_raw if c.isalnum() or c == "_")
        key = f"{key_clean}_{kabupaten_suffix}"

        results.append({
            "key": key,
            "label": f"{name} ({kab['short']})",
            "lat": round(lat, 6),
            "lon": round(lon, 6),
            "kabupaten": kab["short"],
            "tahap": kab["tahap"],
            "is_lakeside": False,
            "is_active": True,
        })

    if skipped_coord or skipped_name:
        log.info(f"  Dilewati: {skipped_coord} koordinat invalid, {skipped_name} tanpa nama")
    
    return results


def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 5432)),
        dbname=os.getenv("DB_NAME", "LangitToba"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", ""),
    )


def get_row_count(cur) -> int:
    cur.execute("SELECT COUNT(*) FROM locations")
    return cur.fetchone()[0]


def insert_locations(conn, locations: list[dict]) -> tuple[int, int]:
    if not locations:
        return 0, 0
    sql = """
        INSERT INTO locations (key, label, lat, lon, kabupaten, tahap, is_lakeside, is_active)
        VALUES (%(key)s, %(label)s, %(lat)s, %(lon)s, %(kabupaten)s, %(tahap)s, %(is_lakeside)s, %(is_active)s)
        ON CONFLICT (key) DO NOTHING
    """
    with conn.cursor() as cur:
        before = get_row_count(cur)
        execute_batch(cur, sql, locations, page_size=50)
        after = get_row_count(cur)
    conn.commit()
    return (after - before), (len(locations) - (after - before))


def main():
    log.info("LangitToba — Seed Locations v2")

    try:
        conn = get_db_connection()
        log.info(f"DB: {os.getenv('DB_NAME')} @ {os.getenv('DB_HOST')}")
    except Exception as e:
        log.error(f"Gagal koneksi DB: {e}")
        sys.exit(1)

    # Fase 0: pastikan 5 lokasi awal
    log.info("\n[Fase 0] Seed 5 lokasi awal ...")
    ins, skip = insert_locations(conn, SEED_5_AWAL)
    log.info(f"  Inserted: {ins}, Skipped: {skip}")

    with conn.cursor() as cur:
        log.info(f"  Total di DB: {get_row_count(cur)}")

    # Fase 1: fetch per kabupaten
    log.info("\n[Fase 1] Fetch dari Overpass API ...")
    semua: list[dict] = []
    gagal: list[str] = []
    berhasil: list[str] = []

    for i, kab in enumerate(KABUPATEN_LIST, 1):
        log.info(f"\n[{i}/{len(KABUPATEN_LIST)}] {kab['name']}")
        hasil = fetch_with_retry(kab)
        
        if hasil:
            semua.extend(hasil)
            berhasil.append(kab["name"])
            log.info(f"  ✓ {len(hasil)} kecamatan")
        else:
            gagal.append(kab["name"])
            log.warning(f"  ✗ Gagal — akan di-skip")

        if i < len(KABUPATEN_LIST):
            log.info(f"  Tunggu {DELAY_BETWEEN_REQUESTS}s ...")
            time.sleep(DELAY_BETWEEN_REQUESTS)

    log.info(f"\nTotal fetch berhasil: {len(semua)} kecamatan dari {len(berhasil)} kabupaten")

    # Fase 2: insert
    if semua:
        log.info("\n[Fase 2] Insert ke DB ...")
        inserted, skipped = insert_locations(conn, semua)
        log.info(f"  Inserted: {inserted}, Skipped (duplikat): {skipped}")
    else:
        log.error("Tidak ada data untuk di-insert.")

    # Summary
    with conn.cursor() as cur:
        total = get_row_count(cur)
        cur.execute("SELECT kabupaten, COUNT(*) FROM locations GROUP BY kabupaten ORDER BY COUNT(*) DESC")
        breakdown = cur.fetchall()

    log.info(f"TOTAL LOKASI DI DB: {total}")
    log.info("Breakdown per kabupaten:")
    for kab_name, count in breakdown:
        log.info(f"  {str(kab_name or 'NULL'):<30} {count:>4}")

    if gagal:
        log.warning(f"\nKabupaten yang GAGAL ({len(gagal)}/{len(KABUPATEN_LIST)}):")
        for k in gagal:
            log.warning(f"  - {k}")
        log.warning("Jalankan ulang script untuk retry kabupaten yang gagal.")
        log.warning("Script aman dijalankan berulang (ON CONFLICT DO NOTHING).")

    log.info("\nVerifikasi: curl http://localhost:9000/api/locations")
    conn.close()


if __name__ == "__main__":
    main()