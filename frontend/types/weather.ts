export interface Location {
  key: string;
  label: string;
  lat: number;
  lon: number;
}

export interface Warning {
  location: string;
  location_label: string;
  lat: number;
  lon: number;
  risk_level: "normal" | "warning" | "orange" | "red";
  warnings: string[];
  temp_max: number;
  precipitation: number;
  windspeed_max: number;
}

export interface ClimateStats {
  location: string;
  avg_temp_max: number;
  avg_precipitation: number;
  max_temp: number;
  max_precipitation: number;
  total_days: number;
  period: string;
  // optional fields yang mungkin tidak ada
  avg_temp_min?: number;
  avg_windspeed?: number;
  min_temp_ever?: number;
  rainy_days_percent?: number;
}

export type RiskLevel = "normal" | "warning" | "orange" | "red";