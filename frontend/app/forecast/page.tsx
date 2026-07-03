"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Cloud, Droplets, Wind, Thermometer, RefreshCw, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getForecast } from "@/lib/api";
import { ForecastResponse, ForecastDay } from "@/types/forecast";
import { getWeatherInfo, getRiskBg, getRiskColor, getRiskLabel } from "@/lib/weatherCode";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const LOCATIONS = [
  { key: "balige",       label: "Balige (Tobasa)" },
  { key: "parapat",      label: "Parapat" },
  { key: "pangururan",   label: "Pangururan (Samosir)" },
  { key: "nainggolan",   label: "Nainggolan" },
  { key: "tengah_danau", label: "Tengah Danau Toba" },
];

const DAYS_OPTIONS = [
  { value: "7",  label: "7 Hari" },
  { value: "14", label: "14 Hari" },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

//  Komponen WeatherCard harian 
function DayCard({ day, isToday }: { day: ForecastDay; isToday: boolean }) {
  const info = getWeatherInfo(day.weathercode);
  return (
    <Card className={`${isToday ? "border-primary bg-primary/5" : ""} ${getRiskBg(day.risk_level)}`}>
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">{formatDate(day.date)}</p>
          {isToday && <Badge className="text-xs px-1.5 py-0">Hari ini</Badge>}
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-3xl">{info.icon}</span>
          <p className="text-xs text-center text-muted-foreground">{info.label}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Thermometer className="h-3 w-3" /> Suhu
            </div>
            <p className="text-xs font-medium">
              {day.temp_min.toFixed(1)}° – {day.temp_max.toFixed(1)}°C
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Droplets className="h-3 w-3" /> Hujan
            </div>
            <p className="text-xs font-medium">{day.precipitation.toFixed(1)} mm</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Wind className="h-3 w-3" /> Angin
            </div>
            <p className="text-xs font-medium">{day.windspeed_max.toFixed(1)} km/h</p>
          </div>
        </div>

        {day.warnings.length > 0 && (
          <div className="flex flex-col gap-1">
            {day.warnings.map((w, i) => (
              <p key={i} className={`text-xs font-medium flex items-center gap-1 ${getRiskColor(day.risk_level)}`}>
                <AlertTriangle className="h-3 w-3 shrink-0" /> {w}
              </p>
            ))}
          </div>
        )}

        <Badge
          variant="outline"
          className={`text-xs w-fit ${getRiskColor(day.risk_level)} border-current`}
        >
          {getRiskLabel(day.risk_level)}
        </Badge>
      </CardContent>
    </Card>
  );
}

//  Custom Tooltip Recharts 
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-md text-xs">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

//  Halaman Utama 
export default function ForecastPage() {
  const searchParams = useSearchParams();
  const [location, setLocation] = useState(searchParams.get("location") || "balige");
  const [days, setDays] = useState("7");
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchForecast = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getForecast(location, parseInt(days));
      setData(res);
    } catch {
      setError("Gagal mengambil data prediksi. Pastikan backend berjalan.");
    } finally {
      setLoading(false);
    }
  }, [location, days]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  // Chart data
  const chartData = data?.forecast.map((d) => ({
    date: formatDateShort(d.date),
    "Suhu Max": parseFloat(d.temp_max.toFixed(1)),
    "Suhu Min": parseFloat(d.temp_min.toFixed(1)),
    "Curah Hujan": parseFloat(d.precipitation.toFixed(1)),
    "Kec. Angin": parseFloat(d.windspeed_max.toFixed(1)),
  })) || [];

  const locationLabel = LOCATIONS.find((l) => l.key === location)?.label || location;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">

      {/*  Header  */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Cloud className="h-6 w-6 text-primary" />
          Prediksi Cuaca
        </h1>
        <p className="text-muted-foreground text-sm">
          Prediksi cuaca berbasis model LSTM untuk kawasan Danau Toba
        </p>
      </div>

      {/*  Filter  */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={location} onValueChange={setLocation}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Pilih lokasi" />
          </SelectTrigger>
          <SelectContent>
            {LOCATIONS.map((loc) => (
              <SelectItem key={loc.key} value={loc.key}>{loc.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Hari" />
          </SelectTrigger>
          <SelectContent>
            {DAYS_OPTIONS.map((d) => (
              <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={fetchForecast} variant="outline" disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/*  Error  */}
      {error && (
        <Card className="border-red-500/30 bg-red-500/10">
          <CardContent className="p-4 flex items-center gap-2 text-red-500 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </CardContent>
        </Card>
      )}

      {/*  Loading  */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Mengambil prediksi...</p>
          </div>
        </div>
      )}

      {/*  Data  */}
      {!loading && data && (
        <>
          {/* Info bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="font-semibold">{locationLabel}</p>
              <p className="text-xs text-muted-foreground">
                {data.forecast_days} hari ke depan · Diperbarui:{" "}
                {new Date(data.generated_at).toLocaleString("id-ID")}
              </p>
            </div>
            <Badge variant="outline" className="w-fit text-xs">
              Model LSTM · MAE 0.490°C
            </Badge>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="cards">
            <TabsList>
              <TabsTrigger value="cards">Kartu Harian</TabsTrigger>
              <TabsTrigger value="chart">Grafik</TabsTrigger>
            </TabsList>

            {/* Cards view */}
            <TabsContent value="cards" className="mt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {data.forecast.map((day, i) => (
                  <DayCard key={day.date} day={day} isToday={i === 0} />
                ))}
              </div>
            </TabsContent>

            {/* Chart view */}
            <TabsContent value="chart" className="mt-4">
              <div className="flex flex-col gap-4">

                {/* Suhu */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-orange-500" />
                      Suhu (°C)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                        <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" unit="°" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line type="monotone" dataKey="Suhu Max" stroke="#f97316" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="Suhu Min" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Hujan */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-sky-500" />
                      Curah Hujan (mm)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                        <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" unit=" mm" />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="Curah Hujan" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Angin */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Wind className="h-4 w-4 text-violet-500" />
                      Kecepatan Angin (km/h)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                        <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" unit=" km/h" />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="Kec. Angin" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}