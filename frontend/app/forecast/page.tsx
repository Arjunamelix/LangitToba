"use client";

import React, { useEffect, useState } from "react";
import LocationCombobox from "@/components/ui/LocationCombobox";
import { useWeatherStore } from "@/store/useWeatherStore";
import { getForecast } from "@/lib/api";
import { ForecastResponse, ForecastDay } from "@/types/forecast";
import { getWeatherInfo } from "@/lib/weatherCode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Database, Wifi } from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

// ─── Cache indicator ────────────────────────────────────────────

function CacheIndicator({
  source,
  expiresAt,
  generatedAt,
}: {
  source?: string;
  expiresAt?: string;
  generatedAt: string;
}) {
  const isCache = source === "cache";

  const generated = new Date(generatedAt).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const expires = expiresAt
    ? new Date(expiresAt).toLocaleString("id-ID", {
        timeStyle: "short",
        dateStyle: "short",
      })
    : null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span>Dihasilkan: {generated}</span>
      <span className="text-border">·</span>
      {isCache ? (
        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
          <Database className="h-3 w-3" />
          Cache{expires ? ` · kedaluwarsa ${expires}` : ""}
        </span>
      ) : (
        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <Wifi className="h-3 w-3" />
          Data terbaru
        </span>
      )}
      <span className="ml-auto rounded-full bg-green-100 px-3 py-0.5 font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
        LSTM · MAE 0.49°C
      </span>
    </div>
  );
}

// ─── Custom tooltip untuk chart ─────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-md text-xs space-y-1">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color ?? p.fill }}>
          {p.name}: {p.value}{p.unit ?? ""}
        </p>
      ))}
    </div>
  );
}

// ─── 7-day chart ────────────────────────────────────────────────

function ForecastChart({ days }: { days: ForecastDay[] }) {
  const chartData = days.map((d) => ({
    date: new Date(d.date).toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }),
    "Suhu Max": parseFloat(d.temp_max.toFixed(1)),
    "Suhu Min": parseFloat(d.temp_min.toFixed(1)),
    "Hujan":    parseFloat(d.precipitation.toFixed(1)),
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Grafik 7 Hari</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              stroke="var(--muted-foreground)"
            />
            {/* Sumbu kiri: suhu */}
            <YAxis
              yAxisId="temp"
              orientation="left"
              tick={{ fontSize: 10 }}
              stroke="var(--muted-foreground)"
              unit="°"
              domain={["auto", "auto"]}
            />
            {/* Sumbu kanan: hujan */}
            <YAxis
              yAxisId="rain"
              orientation="right"
              tick={{ fontSize: 10 }}
              stroke="var(--muted-foreground)"
              unit="mm"
              domain={[0, "auto"]}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />

            {/* Hujan sebagai bar (background) */}
            <Bar
              yAxisId="rain"
              dataKey="Hujan"
              fill="#0ea5e9"
              opacity={0.35}
              radius={[2, 2, 0, 0]}
              unit=" mm"
            />
            {/* Suhu max */}
            <Line
              yAxisId="temp"
              type="monotone"
              dataKey="Suhu Max"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ r: 3, fill: "#f97316" }}
              activeDot={{ r: 5 }}
              unit="°C"
            />
            {/* Suhu min */}
            <Line
              yAxisId="temp"
              type="monotone"
              dataKey="Suhu Min"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 3, fill: "#6366f1" }}
              activeDot={{ r: 5 }}
              unit="°C"
              strokeDasharray="4 2"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Day card ───────────────────────────────────────────────────

function DayCard({ day, index }: { day: ForecastDay; index: number }) {
  const weather = getWeatherInfo(day.weathercode);
  const isToday = index === 0;

  return (
    <div
      className={`rounded-xl border p-4 transition-shadow hover:shadow-md ${
        isToday ? "border-primary/40 bg-primary/5" : "bg-card"
      }`}
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {isToday
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
}

// ─── Page ───────────────────────────────────────────────────────

// getForecast sekarang kembalikan meta (source, expires_at) — extend return type
interface ForecastWithMeta {
  data: ForecastResponse;
  source?: string;
  expiresAt?: string;
}

export default function ForecastPage() {
  const { selectedKey, locations } = useWeatherStore();
  const [result, setResult] = useState<ForecastWithMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedKey) return;
    setLoading(true);
    setError(null);

    // api.ts sudah unwrap inner; tapi kita butuh source & expires_at
    // Panggil axios langsung supaya bisa ambil wrapper
    import("axios").then(({ default: axios }) => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
      axios
        .get(`${API_URL}/api/forecast`, { params: { location: selectedKey, days: 7 } })
        .then((res) => {
          const raw = res.data;
          const inner: ForecastResponse = raw.forecast ?? raw;

          // Normalize warnings
          if (inner.forecast) {
            inner.forecast = inner.forecast.map((day: any) => ({
              ...day,
              warnings: Array.isArray(day.warnings)
                ? day.warnings
                : day.warnings
                ? [day.warnings]
                : [],
            }));
          }

          setResult({
            data: inner,
            source: raw.source,
            expiresAt: raw.expires_at,
          });
        })
        .catch((err) =>
          setError(err.response?.data?.error ?? err.message ?? "Gagal memuat prediksi")
        )
        .finally(() => setLoading(false));
    });
  }, [selectedKey]);

  const selectedLocation = locations.find((l) => l.key === selectedKey);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 flex flex-col gap-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Prediksi Cuaca</h1>
        <p className="mt-1 text-muted-foreground">
          Prediksi 7 hari ke depan berbasis model LSTM untuk kawasan Danau Toba
        </p>
      </div>

      {/* Location Picker */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <span className="text-sm font-medium text-muted-foreground">Lokasi:</span>
        <LocationCombobox className="w-full sm:w-[320px]" />
        {selectedLocation && (
          <span className="text-xs text-muted-foreground">
            {selectedLocation.lat.toFixed(4)}, {selectedLocation.lon.toFixed(4)}
            {selectedLocation.kabupaten ? ` · Kab. ${selectedLocation.kabupaten}` : ""}
          </span>
        )}
      </div>

      {/* Belum pilih lokasi */}
      {!selectedKey && !loading && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground text-sm">
            Pilih lokasi untuk melihat prediksi cuaca 7 hari.
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent mr-3" />
          Memuat prediksi...
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Pastikan FastAPI (port 8000) dan Go backend (port 9000) sedang berjalan.
          </p>
        </div>
      )}

      {/* Data */}
      {result && !loading && (
        <>
          {/* Cache indicator */}
          <CacheIndicator
            source={result.source}
            expiresAt={result.expiresAt}
            generatedAt={result.data.generated_at}
          />

          {/* Chart */}
          <ForecastChart days={result.data.forecast} />

          {/* Day cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {result.data.forecast.map((day, i) => (
              <DayCard key={day.date} day={day} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
