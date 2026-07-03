export interface WeatherInfo {
  label: string;
  icon: string;
  description: string;
}

export const weatherCodeMap: Record<number, WeatherInfo> = {
  0:  { label: "Cerah",              icon: "☀️",  description: "Langit cerah" },
  1:  { label: "Hampir Cerah",       icon: "🌤️",  description: "Sebagian besar cerah" },
  2:  { label: "Berawan Sebagian",   icon: "⛅",  description: "Berawan sebagian" },
  3:  { label: "Mendung",            icon: "☁️",  description: "Tertutup awan" },
  45: { label: "Berkabut",           icon: "🌫️",  description: "Kabut" },
  48: { label: "Kabut Beku",         icon: "🌫️",  description: "Kabut dengan embun beku" },
  51: { label: "Gerimis Ringan",     icon: "🌦️",  description: "Gerimis intensitas ringan" },
  53: { label: "Gerimis",            icon: "🌦️",  description: "Gerimis intensitas sedang" },
  55: { label: "Gerimis Lebat",      icon: "🌧️",  description: "Gerimis intensitas lebat" },
  61: { label: "Hujan Ringan",       icon: "🌧️",  description: "Hujan intensitas ringan" },
  63: { label: "Hujan Sedang",       icon: "🌧️",  description: "Hujan intensitas sedang" },
  65: { label: "Hujan Lebat",        icon: "🌧️",  description: "Hujan intensitas lebat" },
  80: { label: "Hujan Lokal",        icon: "🌦️",  description: "Hujan lokal ringan" },
  81: { label: "Hujan Lokal Sedang", icon: "🌧️",  description: "Hujan lokal sedang" },
  82: { label: "Hujan Lokal Lebat",  icon: "⛈️",  description: "Hujan lokal sangat lebat" },
  95: { label: "Badai Petir",        icon: "⛈️",  description: "Badai petir" },
  96: { label: "Badai + Hujan Es",   icon: "⛈️",  description: "Badai petir dengan hujan es ringan" },
  99: { label: "Badai Besar",        icon: "🌩️",  description: "Badai petir dengan hujan es lebat" },
};

export function getWeatherInfo(code: number): WeatherInfo {
  return (
    weatherCodeMap[code] ?? {
      label: "Tidak Diketahui",
      icon: "❓",
      description: "Kondisi cuaca tidak diketahui",
    }
  );
}

export function getRiskColor(riskLevel: string): string {
  switch (riskLevel) {
    case "red":     return "text-red-500";
    case "orange":  return "text-orange-500";
    case "warning": return "text-yellow-500";
    default:        return "text-green-500";
  }
}

export function getRiskBg(riskLevel: string): string {
  switch (riskLevel) {
    case "red":     return "bg-red-500/10 border-red-500/30";
    case "orange":  return "bg-orange-500/10 border-orange-500/30";
    case "warning": return "bg-yellow-500/10 border-yellow-500/30";
    default:        return "bg-green-500/10 border-green-500/30";
  }
}

export function getRiskLabel(riskLevel: string): string {
  switch (riskLevel) {
    case "red":     return "Bahaya";
    case "orange":  return "Waspada Tinggi";
    case "warning": return "Waspada";
    default:        return "Aman";
  }
}