"use client";

import React, { useEffect, useState } from "react";
import LocationCombobox from "@/components/ui/LocationCombobox";
import { useWeatherStore } from "@/store/useWeatherStore";
import { getForecast } from "@/lib/api";
import { ForecastResponse } from "@/types/forecast";
import { getWeatherInfo } from "@/lib/weatherCode";

export default function ForecastPage() {
  const { selectedKey, locations } = useWeatherStore();
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedKey) return;
    setLoading(true);
    setError(null);
    getForecast(selectedKey, 7)
      .then((res) => setData(res))
      .catch((err) => setError(err.message ?? "Gagal memuat prediksi"))
      .finally(() => setLoading(false));
  }, [selectedKey]);

  const selectedLocation = locations.find((l) => l.key === selectedKey);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Prediksi Cuaca</h1>
        <p className="mt-1 text-muted-foreground">
          Prediksi 7 hari ke depan berbasis model LSTM untuk kawasan Danau Toba
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <span className="text-sm font-medium text-muted-foreground">Lokasi:</span>
        <LocationCombobox className="w-full sm:w-[320px]" />
        {selectedLocation && (
          <span className="text-xs text-muted-foreground">
            {selectedLocation.lat.toFixed(4)}, {selectedLocation.lon.toFixed(4)}
            {selectedLocation.kabupaten ? ` · Kab. ${selectedLocation.kabupaten}` : ""}
          </span>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent mr-3" />
          Memuat prediksi...
        </div>
      )}

      {error && !loading && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Pastikan FastAPI (port 8000) dan Go backend (port 9000) sedang berjalan.
          </p>
        </div>
      )}

      {data && !loading && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Dihasilkan:{" "}
              {new Date(data.generated_at).toLocaleString("id-ID", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
            <span className="rounded-full bg-green-100 px-3 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
              LSTM · MAE 0.49°C
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {data.forecast.map((day, i) => {
              const weather = getWeatherInfo(day.weathercode);
              return (
                <div
                  key={day.date}
                  className={`rounded-xl border p-4 transition-shadow hover:shadow-md ${
                    i === 0 ? "border-primary/40 bg-primary/5" : "bg-card"
                  }`}
                >
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {i === 0
                      ? "Hari ini"
                      : new Date(day.date).toLocaleDateString("id-ID", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                  </p>
                  <div className="my-2 text-3xl">{weather.icon}</div>
                  <p className="text-xs text-muted-foreground">{weather.label}</p>
                  <div className="mt-3 space-y-1">
                    <p className="text-2xl font-bold">
                      {day.temp_max?.toFixed(1) ?? "—"}°
                      <span className="text-sm font-normal text-muted-foreground">
                        /{day.temp_min?.toFixed(1) ?? "—"}°
                      </span>
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>💧 {day.precipitation?.toFixed(1) ?? "0"} mm</span>
                      <span>💨 {day.windspeed_max?.toFixed(0) ?? "—"} km/h</span>
                    </div>
                    {day.warnings.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {day.warnings.map((w, wi) => (
                          <span
                            key={wi}
                            className="block rounded bg-orange-100 px-1.5 py-0.5 text-[10px] text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                          >
                            {w}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
