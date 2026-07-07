"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Thermometer, Droplets, Wind, RefreshCw, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getClimate } from "@/lib/api";
import { ClimateStats } from "@/types/weather";
import { useWeatherStore } from "@/store/useWeatherStore";
import LocationCombobox from "@/components/ui/LocationCombobox";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

function StatCard({ icon: Icon, label, value, unit, color }: {
  icon: any; label: string; value: number; unit: string; color: string;
}) {
  return (
    <Card>
      <CardContent className="p-5 flex flex-col gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: `color-mix(in srgb, var(--color-${color}-500, #0ea5e9) 10%, transparent)` }}
        >
          <Icon className="h-4 w-4" style={{ color: `var(--color-${color}-500, #0ea5e9)` }} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">
            {typeof value === "number" ? value.toFixed(1) : "—"}
            <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-md text-xs">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

const BAR_COLORS = ["#f97316", "#0ea5e9", "#ef4444", "#6366f1"];

export default function ClimatePage() {
  const { selectedKey, locations, fetchLocations } = useWeatherStore();
  const [data, setData] = useState<ClimateStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pastikan locations ter-load (idempotent)
  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  // Fetch ulang setiap kali selectedKey berubah
  useEffect(() => {
    if (!selectedKey) return;
    setLoading(true);
    setError(null);
    getClimate(selectedKey)
      .then((res) => setData(res))
      .catch(() => setError("Gagal mengambil data iklim. Pastikan backend berjalan."))
      .finally(() => setLoading(false));
  }, [selectedKey]);

  const selectedLocation = locations.find((l) => l.key === selectedKey);
  const locationLabel = selectedLocation?.label ?? selectedKey ?? "—";

  const barData = data
    ? [
        { name: "Suhu Max Avg",  value: parseFloat(data.avg_temp_max.toFixed(1)) },
        { name: "Hujan Avg",     value: parseFloat(data.avg_precipitation.toFixed(1)) },
        { name: "Suhu Max",      value: parseFloat(data.max_temp.toFixed(1)) },
        { name: "Hujan Max",     value: parseFloat(data.max_precipitation.toFixed(1)) },
      ]
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-emerald-500" />
            Tren Iklim
          </h1>
          <p className="text-muted-foreground text-sm">
            Analisis data historis 2015–2024 kawasan Danau Toba
          </p>
        </div>
        <Badge variant="outline" className="w-fit text-xs">
          Data {data?.total_days?.toLocaleString() ?? "—"} hari · {data?.period ?? "2015-2024"}
        </Badge>
      </div>

      {/* Location Picker — pakai LocationCombobox (118 lokasi dari Zustand) */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <span className="text-sm font-medium text-muted-foreground">Lokasi:</span>
        <LocationCombobox className="w-full sm:w-[320px]" />
      </div>

      {/* Belum pilih lokasi */}
      {!selectedKey && !loading && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground text-sm">
            Pilih lokasi untuk melihat data tren iklim.
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="border-red-500/30 bg-red-500/10">
          <CardContent className="p-4 flex items-center gap-2 text-red-500 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />{error}
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Mengambil data iklim...</p>
          </div>
        </div>
      )}

      {/* Data */}
      {!loading && data && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Thermometer} label="Rata-rata Suhu Max" value={data.avg_temp_max}      unit="°C"     color="orange" />
            <StatCard icon={Droplets}    label="Rata-rata Hujan"    value={data.avg_precipitation} unit="mm/hari" color="sky"    />
            <StatCard icon={Thermometer} label="Suhu Tertinggi"     value={data.max_temp}           unit="°C"     color="red"    />
            <StatCard icon={Droplets}    label="Hujan Terbesar"     value={data.max_precipitation}  unit="mm"     color="violet" />
          </div>

          {/* Bar chart — pakai Cell agar warna per bar render */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ringkasan Statistik Iklim</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    stroke="var(--muted-foreground)"
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11 }}
                    stroke="var(--muted-foreground)"
                    width={110}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {barData.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Keterangan */}
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground text-center">
                Data iklim historis{" "}
                <span className="font-semibold text-foreground">{locationLabel}</span> periode{" "}
                <span className="font-semibold text-foreground">{data.period}</span> mencakup{" "}
                <span className="font-semibold text-foreground">{data.total_days?.toLocaleString()} hari</span> pengamatan.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
