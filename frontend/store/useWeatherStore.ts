import { create } from "zustand";

// ─── Types 
export interface Location {
  id: number;
  key: string;
  label: string;
  lat: number;
  lon: number;
  kabupaten: string | null;
  tahap: number;
  is_lakeside: boolean;
  is_active: boolean;
}

export interface WeatherStore {
  // Locations
  locations: Location[];
  locationsLoading: boolean;
  locationsError: string | null;
  fetchLocations: () => Promise<void>;

  // Selected location key (dipakai forecast & warning page)
  selectedKey: string;
  setSelectedKey: (key: string) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:9000";

export const useWeatherStore = create<WeatherStore>((set, get) => ({
  // ─── Locations 
  locations: [],
  locationsLoading: false,
  locationsError: null,

  fetchLocations: async () => {
    if (get().locations.length > 0) return; // sudah ter-load, skip
    set({ locationsLoading: true, locationsError: null });
    try {
      const res = await fetch(`${API_BASE}/api/locations`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const locs: Location[] = (data.locations ?? []).filter(
        (l: Location) => l.is_active
      );
      set({ locations: locs, locationsLoading: false });
    } catch (err) {
      set({
        locationsError: err instanceof Error ? err.message : "Gagal memuat lokasi",
        locationsLoading: false,
      });
    }
  },


  selectedKey: "balige",
  setSelectedKey: (key) => set({ selectedKey: key }),
}));