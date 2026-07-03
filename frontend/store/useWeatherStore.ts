import { create } from "zustand";
import { ForecastResponse } from "@/types/forecast";
import { Location, Warning, ClimateStats } from "@/types/weather";

interface WeatherStore {
  // State
  selectedLocation: string;
  selectedDays: number;
  forecast: ForecastResponse | null;
  warnings: Warning[];
  climate: ClimateStats | null;
  locations: Location[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setSelectedLocation: (location: string) => void;
  setSelectedDays: (days: number) => void;
  setForecast: (forecast: ForecastResponse | null) => void;
  setWarnings: (warnings: Warning[]) => void;
  setClimate: (climate: ClimateStats | null) => void;
  setLocations: (locations: Location[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useWeatherStore = create<WeatherStore>((set) => ({
  // Initial state
  selectedLocation: "balige",
  selectedDays: 7,
  forecast: null,
  warnings: [],
  climate: null,
  locations: [],
  isLoading: false,
  error: null,

  // Actions
  setSelectedLocation: (location) => set({ selectedLocation: location }),
  setSelectedDays: (days) => set({ selectedDays: days }),
  setForecast: (forecast) => set({ forecast }),
  setWarnings: (warnings) => set({ warnings }),
  setClimate: (climate) => set({ climate }),
  setLocations: (locations) => set({ locations }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      forecast: null,
      warnings: [],
      climate: null,
      error: null,
      isLoading: false,
    }),
}));