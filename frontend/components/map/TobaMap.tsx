"use client";

import React from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { Warning } from "@/types/weather";
import { getRiskLabel } from "@/lib/weatherCode";
import "leaflet/dist/leaflet.css";

const RISK_COLORS: Record<string, string> = {
  red:     "#ef4444",
  orange:  "#f97316",
  warning: "#eab308",
  normal:  "#22c55e",
};

function MapController() {
  const map = useMap();
  React.useEffect(() => {
    map.setView([-2.55, 98.85], 10);
  }, [map]);
  return null;
}

export default function TobaMap({
  warnings,
  onSelect,
}: {
  warnings: Warning[];
  onSelect: (w: Warning) => void;
}) {
  return (
    <MapContainer
      center={[-2.55, 98.85]}
      zoom={10}
      style={{ height: "100%", width: "100%" }}
    >
      <MapController />
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {warnings.map((w) => (
        <CircleMarker
          key={w.location}
          center={[w.lat, w.lon]}
          radius={18}
          pathOptions={{
            color: RISK_COLORS[w.risk_level] ?? "#22c55e",
            fillColor: RISK_COLORS[w.risk_level] ?? "#22c55e",
            fillOpacity: 0.35,
            weight: 2,
          }}
          eventHandlers={{ click: () => onSelect(w) }}
        >
          <Popup>
            <div style={{ minWidth: 160 }}>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>{w.location_label}</p>
              <p>🌡️ Suhu Max: {w.temp_max.toFixed(1)}°C</p>
              <p>🌧️ Hujan: {w.precipitation.toFixed(1)} mm</p>
              <p>💨 Angin: {w.windspeed_max.toFixed(1)} km/h</p>
              <p>⚠️ Status: {getRiskLabel(w.risk_level)}</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}