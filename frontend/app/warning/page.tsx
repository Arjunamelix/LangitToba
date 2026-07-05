"use client";

import React, { useEffect, useState } from "react";
import LocationCombobox from "@/components/ui/LocationCombobox";
import { useWeatherStore } from "@/store/useWeatherStore";
import { getWarnings } from "@/lib/api";
import { Warning } from "@/types/weather";

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
  const activeWarnings = shown.filter((w) => w.risk_level !== "normal");

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Peringatan Dini</h1>
        <p className="mt-1 text-muted-foreground">
          Early warning cuaca ekstrem kawasan Danau Toba
        </p>
      </div>

      {/* Location Picker */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <span className="text-sm font-medium text-muted-foreground">Lokasi:</span>
        <LocationCombobox className="w-full sm:w-[320px]" />
      </div>

      {/* Thresholds */}
      <div className="mb-6 rounded-lg border bg-muted/30 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Ambang Batas Peringatan
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
          {[
            { label: "Hujan lebat",         value: "> 50 mm/hari",  level: "orange" },
            { label: "Hujan sangat lebat",  value: "> 100 mm/hari", level: "red" },
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

      {/* States */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
          Memuat peringatan...
        </div>
      )}

      {error && !loading && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && (
        activeWarnings.length === 0 ? (
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
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
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

                    {/* Warning tags */}
                    {w.warnings.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {w.warnings.map((tag, wi) => (
                          <span
                            key={wi}
                            className="rounded-full border px-2 py-0.5 text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Stats */}
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
        )
      )}
    </div>
  );
}
