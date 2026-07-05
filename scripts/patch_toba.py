import os, sys, logging
import psycopg2
from psycopg2.extras import execute_batch
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger("patch_toba")

# Kabupaten Toba — 16 kecamatan (sumber: BPS Kabupaten Toba)
TOBA_KECAMATAN = [
    {"key": "balige_toba",          "label": "Balige (Toba)",          "lat": -2.3333, "lon": 99.0667},
    {"key": "laguboti_toba",        "label": "Laguboti (Toba)",         "lat": -2.3667, "lon": 99.1500},
    {"key": "silaen_toba",          "label": "Silaen (Toba)",           "lat": -2.2833, "lon": 99.1167},
    {"key": "sigumpar_toba",        "label": "Sigumpar (Toba)",         "lat": -2.4167, "lon": 99.0333},
    {"key": "porsea_toba",          "label": "Porsea (Toba)",           "lat": -2.5167, "lon": 99.0667},
    {"key": "uluan_toba",           "label": "Uluan (Toba)",            "lat": -2.5500, "lon": 99.0167},
    {"key": "pintu_pohan_meranti_toba", "label": "Pintu Pohan Meranti (Toba)", "lat": -2.4500, "lon": 99.0000},
    {"key": "habinsaran_toba",      "label": "Habinsaran (Toba)",       "lat": -2.3000, "lon": 99.2500},
    {"key": "borbor_toba",          "label": "Borbor (Toba)",           "lat": -2.2167, "lon": 99.2167},
    {"key": "nassau_toba",          "label": "Nassau (Toba)",           "lat": -2.1833, "lon": 99.2833},
    {"key": "tampahan_toba",        "label": "Tampahan (Toba)",         "lat": -2.4333, "lon": 98.9833},
    {"key": "lumban_julu_toba",     "label": "Lumban Julu (Toba)",      "lat": -2.5667, "lon": 98.9833},
    {"key": "ajibata_toba",         "label": "Ajibata (Toba)",          "lat": -2.6167, "lon": 98.9500},
    {"key": "siantar_narumonda_toba","label": "Siantar Narumonda (Toba)","lat": -2.4667, "lon": 99.1167},
    {"key": "parmaksian_toba",      "label": "Parmaksian (Toba)",       "lat": -2.5000, "lon": 99.1333},
    {"key": "bonatua_lunasi_toba",  "label": "Bonatua Lunasi (Toba)",   "lat": -2.3500, "lon": 98.9833},
]

def main():
    log.info("Patch Kabupaten Toba — 16 kecamatan")
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST","localhost"), port=int(os.getenv("DB_PORT",5432)),
        dbname=os.getenv("DB_NAME","LangitToba"), user=os.getenv("DB_USER","postgres"),
        password=os.getenv("DB_PASSWORD",""),
    )

    rows = [{**k, "kabupaten": "Toba", "tahap": 1, "is_lakeside": False, "is_active": True}
            for k in TOBA_KECAMATAN]
    # Ajibata dan Lumban Julu berbatasan danau
    for r in rows:
        if r["key"] in ("ajibata_toba", "lumban_julu_toba", "uluan_toba", "tampahan_toba"):
            r["is_lakeside"] = True

    sql = """
        INSERT INTO locations (key, label, lat, lon, kabupaten, tahap, is_lakeside, is_active)
        VALUES (%(key)s, %(label)s, %(lat)s, %(lon)s, %(kabupaten)s, %(tahap)s, %(is_lakeside)s, %(is_active)s)
        ON CONFLICT (key) DO NOTHING
    """
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM locations"); before = cur.fetchone()[0]
        execute_batch(cur, sql, rows)
        cur.execute("SELECT COUNT(*) FROM locations"); after = cur.fetchone()[0]
    conn.commit()

    log.info(f"Inserted: {after - before}, Skipped: {len(rows) - (after - before)}")
    log.info(f"Total di DB: {after}")

    with conn.cursor() as cur:
        cur.execute("SELECT kabupaten, COUNT(*) FROM locations GROUP BY kabupaten ORDER BY COUNT(*) DESC")
        for kab, count in cur.fetchall():
            log.info(f"  {str(kab or 'NULL'):<35} {count:>4}")

    conn.close()
    log.info("\nDone. Verifikasi: curl http://localhost:9000/api/locations")

if __name__ == "__main__":
    main()