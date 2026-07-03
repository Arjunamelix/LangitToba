export interface ForecastDay {
  date: string;
  temp_max: number;
  temp_min: number;
  precipitation: number;
  windspeed_max: number;
  weathercode: number;
  risk_level: "normal" | "warning" | "orange" | "red";
  warnings: string[];
}

export interface ForecastResponse {
  location: string;
  location_label: string;
  lat: number;
  lon: number;
  forecast_days: number;
  generated_at: string;
  forecast: ForecastDay[];
}

export interface ForecastRequest {
  location: string;
  days: number;
}