"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, MapPin, Thermometer, Droplets, Wind, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getWarnings } from "@/lib/api";
import { Warning } from "@/types/weather";
import { getRiskBg, getRiskColor, getRiskLabel, getWeatherInfo } from "@/lib/weatherCode";

const THRESHOLDS = [
  { label: "Hujan Lebat",         value: "> 50 mm/hari",  level: "ORANGE", icon: Droplets },
  { label: "Hujan Sangat Lebat",  value: "> 100 mm/hari", level: "RED",    icon: Droplets },
  { label: "Angin Kencang",       value: "> 40 km/h",     level: "WARNING", icon: Wind },
  { label: "Suhu Panas Ekstrem",  value: "> 35°C",        level: "WARNING", icon: Thermometer },
  { label: "Suhu Dingin Ekstrem", value: "< 15°C",        level: "WARNING", icon: Thermometer },
];

function WarningCard({ w }: { w: Warning }) {
  const isNormal = w.risk_level === "normal";
  return (
    <Card className={`${getRiskBg(w.risk_level)} transition-all`}>
      <CardContent className="p-5 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <p className="font-semibold text-sm">{w.location_label}</p>
          </div>
          <Badge
            variant="outline"
            className={`text-xs shrink-0 ${getRiskColor(w.risk_level)} border-current`}
          >
            {getRiskLabel(w.risk_level)}
          </Badge>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Thermometer className="h-3 w-3" /> Suhu Max
            </p>
            <p className="text-sm font-medium">{w.temp_max.toFixed(1)}°C</p>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Droplets className="h-3 w-3" /> Hujan
            </p>
            <p className="text-sm font-medium">{w.precipitation.toFixed(1)} mm</p>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Wind className="h-3 w-3" /> Angin
            </p>
            <p className="text-sm font-medium">{w.windspeed_max.toFixed(1)} km/h</p>
          </div>
        </div>

        {/* Warnings list */}
        {isNormal ? (
          <div className="flex items-center gap-2 text-green-500 text-sm">
            <CheckCircle className="h-4 w-4 shrink-0" />
            Kondisi cuaca normal, tidak ada peringatan
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {w.warnings.map((msg, i) => (
              <div key={i} className={`flex items-center gap-2 text-sm ${getRiskColor(w.risk_level)}`}>
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {msg}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function WarningPage() {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchWarnings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWarnings();
      setWarnings(data);
      setLastUpdate(new Date());
    } catch {
      setError("Gagal mengambil data peringatan. Pastikan backend berjalan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarnings();
  }, []);

  const activeWarnings = warnings.filter((w) => w.risk_level !== "normal");
  const safeLocations = warnings.filter((w) => w.risk_level === "normal");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            Early Warning
          </h1>
          <p className="text-muted-foreground text-sm">
            Peringatan dini cuaca ekstrem kawasan Danau Toba
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <p className="text-xs text-muted-foreground">
              Update: {lastUpdate.toLocaleTimeString("id-ID")}
            </p>
          )}
          <Button onClick={fetchWarnings} variant="outline" disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Summary badges ── */}
      {!loading && warnings.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1.5 text-sm py-1 px-3">
            <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
            {safeLocations.length} Lokasi Aman
          </Badge>
          {activeWarnings.length > 0 && (
            <Badge variant="outline" className="gap-1.5 text-sm py-1 px-3 border-orange-500/50 text-orange-500">
              <AlertTriangle className="h-3 w-3" />
              {activeWarnings.length} Lokasi Peringatan
            </Badge>
          )}
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <Card className="border-red-500/30 bg-red-500/10">
          <CardContent className="p-4 flex items-center gap-2 text-red-500 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </CardContent>
        </Card>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Mengambil data peringatan...</p>
          </div>
        </div>
      )}

      {/* ── Warning Cards ── */}
      {!loading && warnings.length > 0 && (
        <>
          {activeWarnings.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="font-semibold text-orange-500 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Lokasi dengan Peringatan Aktif
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeWarnings.map((w) => (
                  <WarningCard key={w.location} w={w} />
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <h2 className="font-semibold text-green-500 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Lokasi Aman
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {safeLocations.map((w) => (
                <WarningCard key={w.location} w={w} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Threshold Info ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Ambang Batas Peringatan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {THRESHOLDS.map((t) => (
              <div key={t.label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <t.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs font-medium">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.value}</p>
                </div>
                <Badge
                  variant="outline"
                  className={`ml-auto text-xs shrink-0 ${
                    t.level === "RED" ? "text-red-500 border-red-500/50" :
                    t.level === "ORANGE" ? "text-orange-500 border-orange-500/50" :
                    "text-yellow-500 border-yellow-500/50"
                  }`}
                >
                  {t.level}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}