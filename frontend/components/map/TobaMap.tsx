"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { Warning } from "@/types/weather";
import { getRiskLabel } from "@/lib/weatherCode";
import { useWeatherStore, Location } from "@/store/useWeatherStore";
import { useRouter } from "next/navigation";

// ─── Konstanta ────────────────────────────────────────────────────────────────

const RISK_COLORS: Record<string, string> = {
  red: "#ef4444",
  orange: "#f97316",
  warning: "#eab308",
  normal: "#22c55e",
};

const KABUPATEN_COLORS: Record<string, string> = {
  Toba: "#6366f1",
  Samosir: "#8b5cf6",
  "Tapanuli Utara": "#ec4899",
  "Humbang Hasundutan": "#f97316",
  Dairi: "#14b8a6",
  Karo: "#0ea5e9",
  Simalungun: "#f59e0b",
  default: "#64748b",
};

// ─── Map Controller ───────────────────────────────────────────────────────────

function MapController() {
  const map = useMap();
  useEffect(() => {
    map.setView([-2.55, 98.85], 9);
  }, [map]);
  return null;
}

// ─── Cluster Layer (pakai L.markerClusterGroup langsung) ─────────────────────

function ClusterLayer({
  locations,
  activeKabupaten,
  onSelectLocation,
}: {
  locations: Location[];
  activeKabupaten: Set<string>;
  onSelectLocation: (loc: Location) => void;
}) {
  const map = useMap();
  const clusterRef = useRef<any>(null);

  useEffect(() => {
    // Pastikan leaflet.markercluster sudah di-import
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("leaflet.markercluster");

    // Bersihkan cluster lama
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }

    const cluster = (L as any).markerClusterGroup({
      maxClusterRadius: 50,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
    });

    const filtered = locations.filter((loc) => {
      const kab = loc.kabupaten ?? "default";
      return activeKabupaten.has(kab) || activeKabupaten.has("default");
    });

    filtered.forEach((loc) => {
      const color = loc.is_lakeside
        ? "#06b6d4"  // cyan — tepi danau
        : (KABUPATEN_COLORS[loc.kabupaten ?? ""] ?? KABUPATEN_COLORS.default);

      const icon = L.divIcon({
        className: "",
        html: `
          <div style="
            width: 12px; height: 12px;
            background: ${color};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 1px 4px rgba(0,0,0,0.4);
            ${loc.is_lakeside ? "outline: 2px solid #06b6d4; outline-offset: 2px;" : ""}
          "></div>
        `,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
        popupAnchor: [0, -8],
      });

      const marker = L.marker([loc.lat, loc.lon], { icon });

      const popupEl = document.createElement("div");
      popupEl.style.minWidth = "180px";
      popupEl.innerHTML = `
        <p style="font-weight:600;margin-bottom:4px;font-size:14px">${loc.label}</p>
        <p style="color:#64748b;font-size:12px;margin-bottom:2px">
          ${loc.kabupaten ?? "—"} ${loc.is_lakeside ? '<span style="color:#06b6d4">⬡ Tepi Danau</span>' : ""}
        </p>
        <p style="font-size:11px;color:#94a3b8;margin-bottom:8px">
          ${loc.lat.toFixed(4)}, ${loc.lon.toFixed(4)}
        </p>
        <button
          id="btn-forecast-${loc.key}"
          style="
            background:#6366f1;color:white;border:none;
            padding:5px 12px;border-radius:6px;
            font-size:12px;cursor:pointer;width:100%
          "
        >
          🔮 Lihat Prediksi
        </button>
      `;

      marker.bindPopup(L.popup({ maxWidth: 220 }).setContent(popupEl));

      marker.on("popupopen", () => {
        const btn = document.getElementById(`btn-forecast-${loc.key}`);
        if (btn) {
          btn.onclick = () => onSelectLocation(loc);
        }
      });

      cluster.addLayer(marker);
    });

    map.addLayer(cluster);
    clusterRef.current = cluster;

    return () => {
      map.removeLayer(cluster);
    };
  }, [locations, activeKabupaten, map, onSelectLocation]);

  return null;
}

// ─── Filter Sidebar ───────────────────────────────────────────────────────────

function KabupatenFilter({
  kabupatenList,
  active,
  onChange,
}: {
  kabupatenList: string[];
  active: Set<string>;
  onChange: (kab: string) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 1000,
        background: "white",
        borderRadius: 10,
        boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
        padding: "10px 14px",
        minWidth: 180,
        maxHeight: "80vh",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 13 }}>Filter Kabupaten</span>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 12,
            color: "#6366f1",
          }}
        >
          {open ? "Tutup" : "Buka"}
        </button>
      </div>

      {open && (
        <>
          {/* Legend */}
          <div style={{ marginBottom: 8, borderBottom: "1px solid #f1f5f9", paddingBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748b" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#06b6d4", outline: "2px solid #06b6d4", outlineOffset: 2 }} />
              Tepi Danau
            </div>
          </div>

          {/* Kabupaten checkboxes */}
          {kabupatenList.map((kab) => (
            <label
              key={kab}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              <input
                type="checkbox"
                checked={active.has(kab)}
                onChange={() => onChange(kab)}
                style={{ accentColor: KABUPATEN_COLORS[kab] ?? "#64748b" }}
              />
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: KABUPATEN_COLORS[kab] ?? KABUPATEN_COLORS.default,
                  flexShrink: 0,
                }}
              />
              {kab}
            </label>
          ))}
        </>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TobaMap({
  warnings,
  onSelect,
}: {
  warnings?: Warning[];
  onSelect?: (w: Warning) => void;
}) {
  const router = useRouter();
  const { locations, fetchLocations } = useWeatherStore();
  const setSelectedKey = useWeatherStore((s) => s.setSelectedKey);

  // Ambil daftar kabupaten unik dari locations
  const kabupatenList = React.useMemo(() => {
    const set = new Set<string>();
    locations.forEach((l) => { if (l.kabupaten) set.add(l.kabupaten); });
    return Array.from(set).sort();
  }, [locations]);

  // State filter — default: semua aktif
  const [activeKabupaten, setActiveKabupaten] = useState<Set<string>>(new Set());

  // Sinkron activeKabupaten saat kabupatenList berubah (pertama load)
  useEffect(() => {
    if (kabupatenList.length > 0 && activeKabupaten.size === 0) {
      setActiveKabupaten(new Set(kabupatenList));
    }
  }, [kabupatenList]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const toggleKabupaten = (kab: string) => {
    setActiveKabupaten((prev) => {
      const next = new Set(prev);
      if (next.has(kab)) next.delete(kab);
      else next.add(kab);
      return next;
    });
  };

  const handleSelectLocation = React.useCallback(
    (loc: Location) => {
      setSelectedKey(loc.key);
      router.push("/forecast");
    },
    [setSelectedKey, router]
  );

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <MapContainer
        center={[-2.55, 98.85]}
        zoom={9}
        style={{ height: "100%", width: "100%" }}
      >
        <MapController />
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Layer 1: Cluster marker dari DB */}
        {locations.length > 0 && (
          <ClusterLayer
            locations={locations}
            activeKabupaten={activeKabupaten}
            onSelectLocation={handleSelectLocation}
          />
        )}

        {/* Layer 2: CircleMarker warnings (overlay) */}
        {warnings?.map((w) => (
          <CircleMarker
            key={`warning-${w.location}`}
            center={[w.lat, w.lon]}
            radius={20}
            pathOptions={{
              color: RISK_COLORS[w.risk_level] ?? "#22c55e",
              fillColor: RISK_COLORS[w.risk_level] ?? "#22c55e",
              fillOpacity: 0.25,
              weight: 2.5,
            }}
            eventHandlers={{ click: () => onSelect?.(w) }}
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

      {/* Sidebar filter — di luar MapContainer agar tidak terblokir Leaflet */}
      {kabupatenList.length > 0 && (
        <KabupatenFilter
          kabupatenList={kabupatenList}
          active={activeKabupaten}
          onChange={toggleKabupaten}
        />
      )}
    </div>
  );
}