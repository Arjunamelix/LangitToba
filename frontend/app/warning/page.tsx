"use client";

import React, { useEffect, useState } from "react";
import LocationCombobox from "@/components/ui/LocationCombobox";
import { useWeatherStore } from "@/store/useWeatherStore";
import { getWarnings } from "@/lib/api";
import { Warning } from "@/types/weather";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, AlertTriangle } from "lucide-react";

// ─── Style helpers ──────────────────────────────────────────────

const RISK_STYLE: Record<string, string> = {
  red:     "border-red-400 bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300",
  orange:  "border-orange-400 bg-orange-50 text-orange-800 dark:bg-orange-950/30 dark:text-orange-300",
  warning: "border-yellow-400 bg-yellow-50 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-300",
  normal:  "border-green-300 bg-green-50 text-green-800 dark:bg-green-950/20 dark:text-green-300",
};

const RISK_BADGE: Record<string, string> = {
  red:     "bg-red-500 text-white",
  orange:  "bg-orange-500 text-white",
  warning: "bg-yellow-400 text-yellow-900",
  normal:  "bg-green-500 text-white",
};

const RISK_LABEL: Record<string, string> = {
  red:     "BAHAYA",
  orange:  "SIAGA",
  warning: "WASPADA",
  normal:  "NORMAL",
};

// Urutan severity untuk sort
const RISK_ORDER: Record<string, number> = { red: 0, orange: 1, warning: 2, normal: 3 };

// ─── Summary per kabupaten ──────────────────────────────────────

/** Hitung count per risk level dalam satu kabupaten */
function KabupatenSummary({ kabupaten, items }: { kabupaten: string; items: Warning[] }) {
  const counts = items.reduce<Record<string, number>>((acc, w) => {
    acc[w.risk_level] = (acc[w.risk_level] ?? 0) + 1;
    return acc;
  }, {});

  // Level tertinggi di kabupaten ini
  const highestLevel = (["red", "orange", "warning", "normal"] as const).find(
    (l) => counts[l] && counts[l] > 0
  ) ?? "normal";

  const dot: Record<string, string> = {
    red: "bg-red-500", orange: "bg-orange-500", warning: "bg-yellow-400", normal: "bg-green-500",
  };

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        <span className={`w-2 h-2 rounded-full shrink-0 ${dot[highestLevel]}`} />
        <span className="text-sm font-medium truncate">{kabupaten}</span>
        <span className="text-xs text-muted-foreground">({items.length} lokasi)</span>
      </div>
      <div className="flex items-center gap-1 shrink-0 ml-2">
        {(["red", "orange", "warning"] as const).map((level) =>
          counts[level] ? (
            <span
              key={level}
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${RISK_BADGE[level]}`}
            >
              {counts[level]} {RISK_LABEL[level]}
            </span>
          ) : null
        )}
        {!counts.red && !counts.orange && !counts.warning && (
          <span className="text-xs text-muted-foreground">Semua normal</span>
        )}
      </div>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────

export default function WarningPage() {
  const { selectedKey } = useWeatherStore();
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getWarnings()
      .then((data: Warning[]) => setWarnings(data))
      .catch((err: Error) => setError(err.message ?? "Gagal memuat peringatan"))
      .finally(() => setLoading(false));
  }, [selectedKey]);

  // Filter lokasi yang dipilih, fallback ke semua jika tidak ada match
  const filtered = warnings.filter((w) =>
    w.location.toLowerCase().includes(selectedKey)
  );
  const shown = filtered.length > 0 ? filtered : warnings;
  const activeWarnings = shown
    .filter((w) => w.risk_level !== "normal")
    .sort((a, b) => (RISK_ORDER[a.risk_level] ?? 3) - (RISK_ORDER[b.risk_level] ?? 3));

  // Ringkasan per kabupaten — group dari seluruh warnings (bukan hanya filtered)
  const kabupatenGroups = warnings.reduce<Record<string, Warning[]>>((acc, w) => {
    // Cari kabupaten dari location_label (format "Nama (Kabupaten)") atau fallback ke location
    const kab = w.location_label.match(/\(([^)]+)\)/)?.[1] ?? "Lainnya";
    if (!acc[kab]) acc[kab] = [];
    acc[kab].push(w);
    return acc;
  }, {});

  const kabList = Object.entries(kabupatenGroups).sort(([, a], [, b]) => {
    // Sort kabupaten: yang ada warning dulu
    const worstLevel = (items: Warning[]) =>
      Math.min(...items.map((w) => RISK_ORDER[w.risk_level] ?? 3));
    return worstLevel(a) - worstLevel(b);
  });

  const totalActive = warnings.filter((w) => w.risk_level !== "normal").length;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 flex flex-col gap-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Peringatan Dini</h1>
        <p className="mt-1 text-muted-foreground">
          Early warning cuaca ekstrem kawasan Danau Toba
        </p>
      </div>

      {/* Location Picker */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <span className="text-sm font-medium text-muted-foreground">Lokasi:</span>
        <LocationCombobox className="w-full sm:w-[320px]" />
      </div>

      {/* Ambang Batas */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Ambang Batas Peringatan
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
          {[
            { label: "Hujan lebat",         value: "> 50 mm/hari",  level: "orange"  },
            { label: "Hujan sangat lebat",  value: "> 100 mm/hari", level: "red"     },
            { label: "Angin kencang",       value: "> 40 km/h",     level: "warning" },
            { label: "Suhu panas ekstrem",  value: "> 35°C",        level: "warning" },
            { label: "Suhu dingin ekstrem", value: "< 15°C",        level: "warning" },
          ].map((t) => (
            <div key={t.label} className="flex items-center gap-2">
              <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${RISK_BADGE[t.level]}`}>
                {RISK_LABEL[t.level]}
              </span>
              <span className="text-muted-foreground">{t.label} {t.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
          Memuat peringatan...
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ── Ringkasan per kabupaten ── */}
          {warnings.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Ringkasan per Kabupaten
                  {totalActive > 0 && (
                    <span className="ml-auto rounded bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                      {totalActive} lokasi aktif
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1.5 pt-0">
                {kabList.map(([kab, items]) => (
                  <KabupatenSummary key={kab} kabupaten={kab} items={items} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* ── Detail peringatan lokasi yang dipilih ── */}
          {activeWarnings.length === 0 ? (
            <div className="rounded-xl border border-green-300 bg-green-50 p-8 text-center dark:bg-green-950/20">
              <p className="text-4xl mb-3">✅</p>
              <p className="font-semibold text-green-800 dark:text-green-300">
                Tidak ada peringatan aktif
              </p>
              <p className="mt-1 text-sm text-green-700/70 dark:text-green-400/70">
                Kondisi cuaca dalam batas normal untuk lokasi ini.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                {activeWarnings.length} lokasi dengan peringatan aktif
              </p>
              {activeWarnings.map((w, i) => (
                <div
                  key={i}
                  className={`rounded-xl border-l-4 p-5 ${RISK_STYLE[w.risk_level] ?? RISK_STYLE.warning}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`rounded px-2 py-0.5 text-xs font-bold ${RISK_BADGE[w.risk_level]}`}>
                          {RISK_LABEL[w.risk_level]}
                        </span>
                        <span className="font-medium">{w.location_label}</span>
                      </div>

                      {w.warnings.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {w.warnings.map((tag, wi) => (
                            <span key={wi} className="rounded-full border px-2 py-0.5 text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span>🌡️ Maks {w.temp_max?.toFixed(1) ?? "—"}°C</span>
                        <span>💧 {w.precipitation?.toFixed(1) ?? "0"} mm</span>
                        <span>💨 {w.windspeed_max?.toFixed(0) ?? "—"} km/h</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 text-xs text-muted-foreground">
                      <p>{w.lat.toFixed(3)}, {w.lon.toFixed(3)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
