import os
import sys
import logging
import psycopg2
from psycopg2.extras import execute_batch
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("patch")

PATCH_DATA = [
    # ─── KABUPATEN SAMOSIR (9 kecamatan) ───────────────────────
    {"key": "pangururan_samosir",        "label": "Pangururan (Samosir)",        "lat": -2.5900, "lon": 98.6900, "kabupaten": "Samosir",    "tahap": 1, "is_lakeside": True,  "is_active": True},
    {"key": "sianjur_mula_mula_samosir", "label": "Sianjur Mula-mula (Samosir)","lat": -2.5710, "lon": 98.6410, "kabupaten": "Samosir",    "tahap": 1, "is_lakeside": True,  "is_active": True},
    {"key": "harian_samosir",            "label": "Harian (Samosir)",            "lat": -2.5480, "lon": 98.5540, "kabupaten": "Samosir",    "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "sitio_tio_samosir",         "label": "Sitio-tio (Samosir)",         "lat": -2.6220, "lon": 98.5640, "kabupaten": "Samosir",    "tahap": 1, "is_lakeside": True,  "is_active": True},
    {"key": "onan_runggu_samosir",       "label": "Onan Runggu (Samosir)",       "lat": -2.6520, "lon": 98.7930, "kabupaten": "Samosir",    "tahap": 1, "is_lakeside": True,  "is_active": True},
    {"key": "nainggolan_samosir",        "label": "Nainggolan (Samosir)",        "lat": -2.6300, "lon": 98.8100, "kabupaten": "Samosir",    "tahap": 1, "is_lakeside": True,  "is_active": True},
    {"key": "palipi_samosir",            "label": "Palipi (Samosir)",            "lat": -2.6200, "lon": 98.7240, "kabupaten": "Samosir",    "tahap": 1, "is_lakeside": True,  "is_active": True},
    {"key": "ronggurnihuta_samosir",     "label": "Ronggurnihuta (Samosir)",     "lat": -2.5940, "lon": 98.7480, "kabupaten": "Samosir",    "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "simanindo_samosir",         "label": "Simanindo (Samosir)",         "lat": -2.5660, "lon": 98.8440, "kabupaten": "Samosir",    "tahap": 1, "is_lakeside": True,  "is_active": True},

    # ─── KABUPATEN KARO (17 kecamatan) ─────────────────────────
    {"key": "berastagi_karo",            "label": "Berastagi (Karo)",            "lat":  3.1920, "lon": 98.5080, "kabupaten": "Karo",        "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "kabanjahe_karo",            "label": "Kabanjahe (Karo)",            "lat":  3.0990, "lon": 98.4930, "kabupaten": "Karo",        "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "tigabinanga_karo",          "label": "Tigabinanga (Karo)",          "lat":  3.1750, "lon": 98.2890, "kabupaten": "Karo",        "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "merek_karo",                "label": "Merek (Karo)",                "lat":  2.9840, "lon": 98.5970, "kabupaten": "Karo",        "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "mardingding_karo",          "label": "Mardingding (Karo)",          "lat":  3.2510, "lon": 98.1980, "kabupaten": "Karo",        "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "laubaleng_karo",            "label": "Laubaleng (Karo)",            "lat":  3.3270, "lon": 98.2370, "kabupaten": "Karo",        "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "juhar_karo",                "label": "Juhar (Karo)",                "lat":  3.3700, "lon": 98.3760, "kabupaten": "Karo",        "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "kutabuluh_karo",            "label": "Kutabuluh (Karo)",            "lat":  3.3780, "lon": 98.4570, "kabupaten": "Karo",        "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "munte_karo",                "label": "Munte (Karo)",                "lat":  3.1710, "lon": 98.3810, "kabupaten": "Karo",        "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "tiga_panah_karo",           "label": "Tiga Panah (Karo)",           "lat":  3.0920, "lon": 98.5410, "kabupaten": "Karo",        "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "simpang_empat_karo",        "label": "Simpang Empat (Karo)",        "lat":  3.0230, "lon": 98.4940, "kabupaten": "Karo",        "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "payung_karo",               "label": "Payung (Karo)",               "lat":  3.0270, "lon": 98.5690, "kabupaten": "Karo",        "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "dolat_rayat_karo",          "label": "Dolat Rayat (Karo)",          "lat":  3.1450, "lon": 98.5340, "kabupaten": "Karo",        "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "barusjahe_karo",            "label": "Barusjahe (Karo)",            "lat":  3.0690, "lon": 98.6380, "kabupaten": "Karo",        "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "tiganderket_karo",          "label": "Tiganderket (Karo)",          "lat":  3.2630, "lon": 98.3870, "kabupaten": "Karo",        "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "naman_teran_karo",          "label": "Naman Teran (Karo)",          "lat":  3.2140, "lon": 98.4540, "kabupaten": "Karo",        "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "merdeka_karo",              "label": "Merdeka (Karo)",              "lat":  3.1660, "lon": 98.5250, "kabupaten": "Karo",        "tahap": 1, "is_lakeside": False, "is_active": True},

    # ─── KABUPATEN SIMALUNGUN (32 kecamatan) ───────────────────
    {"key": "girsang_sipangan_bolon_simalungun",  "label": "Girsang Sipangan Bolon (Simalungun)",  "lat": -2.6570, "lon": 98.9510, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": True,  "is_active": True},
    {"key": "haranggaol_horison_simalungun",      "label": "Haranggaol Horison (Simalungun)",      "lat": -2.6670, "lon": 98.8310, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": True,  "is_active": True},
    {"key": "dolok_pardamean_simalungun",         "label": "Dolok Pardamean (Simalungun)",         "lat": -2.7160, "lon": 98.9750, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "silimakuta_simalungun",              "label": "Silimakuta (Simalungun)",              "lat": -2.7640, "lon": 98.9740, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "pamatang_silimahuta_simalungun",     "label": "Pamatang Silimahuta (Simalungun)",     "lat": -2.7580, "lon": 98.9910, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "purba_simalungun",                   "label": "Purba (Simalungun)",                   "lat": -2.8740, "lon": 98.9790, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "tanah_jawa_simalungun",              "label": "Tanah Jawa (Simalungun)",              "lat": -2.6930, "lon": 99.0750, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "hatonduhan_simalungun",              "label": "Hatonduhan (Simalungun)",              "lat": -2.9560, "lon": 99.0080, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "dolok_panribuan_simalungun",         "label": "Dolok Panribuan (Simalungun)",         "lat": -2.9780, "lon": 99.0350, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "jorlang_hataran_simalungun",         "label": "Jorlang Hataran (Simalungun)",         "lat": -2.8710, "lon": 99.0040, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "panei_simalungun",                   "label": "Panei (Simalungun)",                   "lat": -2.9600, "lon": 99.0600, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "panombeian_panei_simalungun",        "label": "Panombeian Panei (Simalungun)",        "lat": -2.8870, "lon": 99.0630, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "raya_simalungun",                    "label": "Raya (Simalungun)",                    "lat": -3.0010, "lon": 99.0900, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "dolok_silau_simalungun",             "label": "Dolok Silau (Simalungun)",             "lat": -3.0420, "lon": 99.0710, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "silau_kahean_simalungun",            "label": "Silau Kahean (Simalungun)",            "lat": -3.0870, "lon": 99.0980, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "ujung_padang_simalungun",            "label": "Ujung Padang (Simalungun)",            "lat": -3.0280, "lon": 99.2030, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "hutabayu_raja_simalungun",           "label": "Hutabayu Raja (Simalungun)",           "lat": -2.9710, "lon": 99.1930, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "jawa_maraja_bah_jambi_simalungun",   "label": "Jawa Maraja Bah Jambi (Simalungun)",   "lat": -2.9380, "lon": 99.1680, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "pematang_bandar_simalungun",         "label": "Pematang Bandar (Simalungun)",         "lat": -2.8760, "lon": 99.1350, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "bandar_huluan_simalungun",           "label": "Bandar Huluan (Simalungun)",           "lat": -2.8120, "lon": 99.1360, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "bandar_simalungun",                  "label": "Bandar (Simalungun)",                  "lat": -2.8170, "lon": 99.1960, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "bandar_masilam_simalungun",          "label": "Bandar Masilam (Simalungun)",          "lat": -2.7590, "lon": 99.1720, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "bosar_maligas_simalungun",           "label": "Bosar Maligas (Simalungun)",           "lat": -2.7620, "lon": 99.2550, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "pematang_silima_huta_simalungun",    "label": "Pematang Silima Huta (Simalungun)",    "lat": -2.8170, "lon": 99.0670, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "sidamanik_simalungun",               "label": "Sidamanik (Simalungun)",               "lat": -2.9200, "lon": 99.0200, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "pematang_sidamanik_simalungun",      "label": "Pematang Sidamanik (Simalungun)",      "lat": -2.9200, "lon": 99.0200, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "gunung_maligas_simalungun",          "label": "Gunung Maligas (Simalungun)",          "lat": -2.7110, "lon": 99.1860, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "gunung_malela_simalungun",           "label": "Gunung Malela (Simalungun)",           "lat": -2.8080, "lon": 99.1250, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "raya_kahean_simalungun",             "label": "Raya Kahean (Simalungun)",             "lat": -3.0280, "lon": 99.0680, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "siantar_simalungun",                 "label": "Siantar (Simalungun)",                 "lat": -2.9330, "lon": 99.0730, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "huta_bayu_raja_simalungun",          "label": "Huta Bayu Raja (Simalungun)",          "lat": -2.9710, "lon": 99.1930, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": False, "is_active": True},
    {"key": "girsang_simalungun",                 "label": "Girsang (Simalungun)",                 "lat": -2.6600, "lon": 98.9400, "kabupaten": "Simalungun", "tahap": 1, "is_lakeside": True,  "is_active": True},
]


def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 5432)),
        dbname=os.getenv("DB_NAME", "LangitToba"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", ""),
    )


def main():
    log.info("LangitToba — Patch Missing Kabupaten")
    log.info("Samosir (9) + Karo (17) + Simalungun (32) = 58 kecamatan")

    try:
        conn = get_db_connection()
        log.info(f"DB: {os.getenv('DB_NAME')} @ {os.getenv('DB_HOST')}")
    except Exception as e:
        log.error(f"Gagal koneksi DB: {e}")
        sys.exit(1)

    sql = """
        INSERT INTO locations (key, label, lat, lon, kabupaten, tahap, is_lakeside, is_active)
        VALUES (%(key)s, %(label)s, %(lat)s, %(lon)s, %(kabupaten)s, %(tahap)s, %(is_lakeside)s, %(is_active)s)
        ON CONFLICT (key) DO NOTHING
    """

    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM locations")
        before = cur.fetchone()[0]
        log.info(f"Lokasi di DB sebelum patch: {before}")

        execute_batch(cur, sql, PATCH_DATA, page_size=100)

        cur.execute("SELECT COUNT(*) FROM locations")
        after = cur.fetchone()[0]

    conn.commit()
    inserted = after - before
    skipped = len(PATCH_DATA) - inserted

    log.info(f"\nInserted: {inserted}")
    log.info(f"Skipped (sudah ada): {skipped}")
    log.info(f"Total di DB sekarang: {after}")

    # Breakdown
    with conn.cursor() as cur:
        cur.execute(
            "SELECT kabupaten, COUNT(*) FROM locations GROUP BY kabupaten ORDER BY COUNT(*) DESC"
        )
        rows = cur.fetchall()

    log.info("\nBreakdown per kabupaten:")
    for kab_name, count in rows:
        log.info(f"  {str(kab_name or 'NULL'):<35} {count:>4} lokasi")

    log.info("\nVerifikasi:")
    log.info("  curl http://localhost:9000/api/locations")
    conn.close()


if __name__ == "__main__":
    main()