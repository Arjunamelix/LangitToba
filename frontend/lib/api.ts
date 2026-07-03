import axios from "axios";
import { ForecastResponse } from "@/types/forecast";
import { Location, Warning, ClimateStats } from "@/types/weather";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

export async function getLocations(): Promise<Location[]> {
  const res = await api.get("/api/locations");
  return Array.isArray(res.data) ? res.data : (res.data.locations ?? []);
}

export async function getForecast(location: string, days: number = 7): Promise<ForecastResponse> {
  const res = await api.get("/api/forecast", { params: { location, days } });
  return res.data;
}

export async function getWarnings(): Promise<Warning[]> {
  const res = await api.get("/api/warnings");
  return Array.isArray(res.data) ? res.data : (res.data.warnings ?? []);
}

export async function getClimate(location: string): Promise<ClimateStats> {
  const res = await api.get("/api/climate", { params: { location } });
  return res.data;
}

export async function getHealth(): Promise<{ status: string }> {
  const res = await api.get("/api/health");
  return res.data;
}