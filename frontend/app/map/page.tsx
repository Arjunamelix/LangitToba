"use client";

import { useEffect, useState } from "react";
import { Map, RefreshCw, AlertTriangle, MapPin, Thermometer, Droplets, Wind } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getWarnings } from "@/lib/api";
import { Warning } from "@/types/weather";
import { getRiskBg, getRiskColor, getRiskLabel } from "@/lib/weatherCode";
import dynamic from "next/dynamic";

const TobaMap = dynamic(() => import("@/components/map/TobaMap"), { ssr: false });

export default function MapPage() {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Warning | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWarnings();
      setWarnings(data);
    } catch {
      setError("Gagal mengambil data. Pastikan backend berjalan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Map className="h-6 w-6 text-violet-500" />
            Peta Cuaca
          </h1>
          <p className="text-muted-foreground text-sm">
            Kondisi cuaca 5 titik pemantauan kawasan Danau Toba
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" disabled={loading} className="gap-2 w-fit">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-red-500/30 bg-red-500/10">
          <CardContent className="p-4 flex items-center gap-2 text-red-500 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </CardContent>
        </Card>
      )}

      {/* Map + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="h-[480px] w-full">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Memuat peta...</p>
                  </div>
                </div>
              ) : (
                <TobaMap warnings={warnings} onSelect={setSelected} />
              )}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-muted-foreground">
            Klik marker di peta atau pilih lokasi:
          </p>
          {warnings.map((w) => (
            <Card
              key={w.location}
              className={`cursor-pointer transition-all hover:border-primary/50 ${
                selected?.location === w.location ? "border-primary bg-primary/5" : ""
              } ${getRiskBg(w.risk_level)}`}
              onClick={() => setSelected(w)}
            >
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <p className="text-sm font-medium">{w.location_label}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getRiskColor(w.risk_level)} border-current`}
                  >
                    {getRiskLabel(w.risk_level)}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Thermometer className="h-3 w-3" />
                    {w.temp_max.toFixed(1)}°C
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Droplets className="h-3 w-3" />
                    {w.precipitation.toFixed(1)}mm
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Wind className="h-3 w-3" />
                    {w.windspeed_max.toFixed(1)}km/h
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <Card className={getRiskBg(selected.risk_level)}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                {selected.location_label}
              </span>
              <Badge
                variant="outline"
                className={`${getRiskColor(selected.risk_level)} border-current`}
              >
                {getRiskLabel(selected.risk_level)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Thermometer className="h-3 w-3" /> Suhu Maksimum
                </p>
                <p className="font-semibold">{selected.temp_max.toFixed(1)}°C</p>
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Droplets className="h-3 w-3" /> Curah Hujan
                </p>
                <p className="font-semibold">{selected.precipitation.toFixed(1)} mm</p>
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Wind className="h-3 w-3" /> Kecepatan Angin
                </p>
                <p className="font-semibold">{selected.windspeed_max.toFixed(1)} km/h</p>
              </div>
            </div>
            {selected.warnings.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {selected.warnings.map((msg, i) => (
                  <p
                    key={i}
                    className={`text-sm flex items-center gap-2 ${getRiskColor(selected.risk_level)}`}
                  >
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    {msg}
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}