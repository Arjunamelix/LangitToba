import { Cloud, ExternalLink, Database, Cpu, Globe, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const MODELS = [
  { name: "SARIMA",  mae: "0.933", rmse: "1.112", mape: "3.24", r2: "-0.098", winner: false },
  { name: "Prophet", mae: "0.726", rmse: "0.884", mape: "2.56", r2: "0.307",  winner: false },
  { name: "LSTM",    mae: "0.490", rmse: "0.629", mape: "1.70", r2: "0.649",  winner: true  },
];

const STACK = [
  { layer: "ML & Data Science", items: ["Python 3.10", "TensorFlow 2.21", "Prophet", "SARIMA", "scikit-learn", "pandas"], icon: Cpu },
  { layer: "Inference API",     items: ["FastAPI", "Uvicorn", "Pydantic"],                                                  icon: Globe },
  { layer: "Backend API",       items: ["Go 1.25", "Gin", "GORM", "PostgreSQL", "robfig/cron"],                             icon: Database },
  { layer: "Frontend",          items: ["Next.js 16", "TypeScript", "Tailwind CSS", "shadcn/ui", "Recharts", "Leaflet"],    icon: BookOpen },
];

const LOCATIONS = [
  { label: "Balige (Tobasa)",      lat: "-2.3333", lon: "99.0667" },
  { label: "Parapat",              lat: "-2.6600", lon: "98.9400" },
  { label: "Pangururan (Samosir)", lat: "-2.5900", lon: "98.6900" },
  { label: "Nainggolan",           lat: "-2.6300", lon: "98.8100" },
  { label: "Tengah Danau Toba",    lat: "-2.6000", lon: "98.8000" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">

      <div className="flex flex-col items-center text-center gap-4 py-6">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
          <Cloud className="h-7 w-7 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">LangitToba</h1>
          <p className="text-muted-foreground mt-1">Membaca Langit Toba dengan Data</p>
        </div>
        <p className="max-w-xl text-sm text-muted-foreground leading-relaxed">
          Platform prediksi dan analisis cuaca kawasan Danau Toba berbasis Machine Learning.
          Dibangun sebagai proyek portofolio semester break oleh mahasiswa D4 Teknik Informatika Institut Teknologi Del.
        </p>
        <Button asChild variant="outline" className="gap-2">
          <a href="https://github.com/Arjunamelix/LangitToba" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            <span>Lihat di GitHub</span>
          </a>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            Dataset
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Data",       value: "18.265 baris" },
              { label: "Periode",          value: "2015 – 2024" },
              { label: "Titik Lokasi",     value: "5 lokasi" },
              { label: "Fitur Engineered", value: "40+ fitur" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col gap-0.5 p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-semibold text-sm">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Titik Pemantauan</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {LOCATIONS.map((loc) => (
                <div key={loc.label} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-xs">
                  <span className="font-medium">{loc.label}</span>
                  <span className="text-muted-foreground ml-auto">{loc.lat}°, {loc.lon}°</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            Perbandingan Model ML
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Model</th>
                  <th className="text-right py-2 px-4 text-muted-foreground font-medium">MAE (°C)</th>
                  <th className="text-right py-2 px-4 text-muted-foreground font-medium">RMSE (°C)</th>
                  <th className="text-right py-2 px-4 text-muted-foreground font-medium">MAPE (%)</th>
                  <th className="text-right py-2 pl-4 text-muted-foreground font-medium">R²</th>
                </tr>
              </thead>
              <tbody>
                {MODELS.map((m) => (
                  <tr key={m.name} className={`border-b border-border/50 ${m.winner ? "bg-primary/5" : ""}`}>
                    <td className="py-3 pr-4 font-medium">
                      <span className="flex items-center gap-2">
                        {m.name}
                        {m.winner && <Badge className="text-xs px-1.5 py-0">🏆 Terbaik</Badge>}
                      </span>
                    </td>
                    <td className={`text-right py-3 px-4 ${m.winner ? "text-primary font-semibold" : ""}`}>{m.mae}</td>
                    <td className={`text-right py-3 px-4 ${m.winner ? "text-primary font-semibold" : ""}`}>{m.rmse}</td>
                    <td className={`text-right py-3 px-4 ${m.winner ? "text-primary font-semibold" : ""}`}>{m.mape}</td>
                    <td className={`text-right py-3 pl-4 ${m.winner ? "text-primary font-semibold" : ""}`}>{m.r2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm font-medium mb-2">Arsitektur LSTM</p>
            <pre className="text-xs text-muted-foreground leading-relaxed overflow-x-auto whitespace-pre-wrap">
{`Input (window 14 hari)
→ LSTM(64, return_sequences=True)
→ Dropout(0.2)
→ LSTM(32, return_sequences=False)
→ Dropout(0.2)
→ Dense(16, relu)
→ Dense(1)

Optimizer : Adam (lr=0.001)
Loss      : MSE
Callbacks : EarlyStopping(patience=15)
            ReduceLROnPlateau(patience=7)`}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            Tech Stack
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {STACK.map((s) => (
            <div key={s.layer} className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{s.layer}</p>
              <div className="flex flex-wrap gap-1.5">
                {s.items.map((item) => (
                  <Badge key={item} variant="secondary" className="text-xs">{item}</Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-col items-center text-center gap-2 py-4 text-sm text-muted-foreground">
        <p>Dibangun oleh <span className="font-semibold text-foreground">Arjuna Melix Sihombing</span></p>
        <p>D4 Teknik Informatika · Institut Teknologi Del · 2026</p>
        <p className="text-xs">Data sumber: Open-Meteo Archive API · NASA POWER · BMKG</p>
      </div>

    </div>
  );
}