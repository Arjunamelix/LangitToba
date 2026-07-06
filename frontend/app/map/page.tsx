"use client";

import dynamic from "next/dynamic";

// TobaMap tidak bisa SSR (Leaflet butuh window)
const TobaMap = dynamic(() => import("@/components/map/TobaMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen text-slate-400">
      Memuat peta...
    </div>
  ),
});

export default function MapPage() {
  return (
    <div style={{ height: "calc(100vh - 64px)", width: "100%" }}>
      <TobaMap />
    </div>
  );
}