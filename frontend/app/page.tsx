"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Cloud, MapPin, TrendingUp, AlertTriangle, Map,
  ArrowRight, Thermometer, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getHealth, getWarnings } from "@/lib/api";
import { Warning } from "@/types/weather";
import { useWeatherStore } from "@/store/useWeatherStore";

// ─── Konstanta ──────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Cloud,
    title: "Prediksi 7–14 Hari",
    desc: "Model LSTM dengan akurasi MAE 0.490°C untuk prediksi suhu, curah hujan, dan kecepatan angin.",
    href: "/forecast",
    color: "text-sky-500",
    bg: "bg-sky-500/10",
  },
  {
    icon: TrendingUp,
    title: "Tren Iklim 10 Tahun",
    desc: "Analisis data historis 2015–2024 kawasan Danau Toba dalam grafik interaktif.",
    href: "/climate",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: AlertTriangle,
    title: "Early Warning",
    desc: "Peringatan dini cuaca ekstrem — hujan lebat, angin kencang, dan suhu ekstrem.",
    href: "/warning",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    icon: Map,
    title: "Peta Cuaca",
    desc: "Visualisasi kondisi cuaca 118 titik pemantauan kawasan Danau Toba secara real-time.",
    href: "/map",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
];

const RISK_BADGE: Record<string, string> = {
  red:     "bg-red-500 text-white",
  orange:  "bg-orange-500 text-white",
  warning: "bg-yellow-400 text-yellow-900",
};

const RISK_LABEL: Record<string, string> = {
  red: "BAHAYA", orange: "SIAGA", warning: "WASPADA",
};

// ─── Kabupaten locations accordion ──────────────────────────────

function KabupatenAccordion({
  kabupaten,
  locations,
}: {
  kabupaten: string;
  locations: { key: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-accent/30 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
          {kabupaten}
          <span className="text-xs text-muted-foreground font-normal">
            ({locations.length} kecamatan)
          </span>
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="border-t border-border/50 px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {locations.map((loc) => (
            <Link
              key={loc.key}
              href={`/forecast?location=${loc.key}`}
              className="text-xs text-muted-foreground hover:text-primary transition-colors truncate"
            >
              {loc.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────

const KAB_ORDER = [
  "Toba", "Samosir", "Simalungun", "Tapanuli Utara",
  "Humbang Hasundutan", "Dairi", "Karo",
];

export default function HomePage() {
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [activeWarnings, setActiveWarnings] = useState<Warning[]>([]);
  const { locations, fetchLocations } = useWeatherStore();

  useEffect(() => {
    getHealth()
      .then(() => setApiStatus("online"))
      .catch(() => setApiStatus("offline"));

    getWarnings()
      .then((data) => setActiveWarnings(data.filter((w) => w.risk_level !== "normal")))
      .catch(() => {});

    fetchLocations();
  }, [fetchLocations]);

  // Group locations by kabupaten
  const kabGroups = locations.reduce<Record<string, { key: string; label: string }[]>>(
    (acc, loc) => {
      const kab = loc.kabupaten ?? "Lainnya";
      if (!acc[kab]) acc[kab] = [];
      acc[kab].push({ key: loc.key, label: loc.label });
      return acc;
    },
    {}
  );

  const kabList = [
    ...KAB_ORDER.filter((k) => kabGroups[k]),
    ...Object.keys(kabGroups).filter((k) => !KAB_ORDER.includes(k)).sort(),
  ];

  const STATS = [
    { label: "Tahun Data",       value: "10",             suffix: " tahun" },
    { label: "Titik Pemantauan", value: locations.length > 0 ? String(locations.length) : "118", suffix: " lokasi" },
    { label: "Akurasi LSTM",     value: "98.3",           suffix: "%" },
    { label: "Data Historis",    value: "18.265",         suffix: " baris" },
  ];

  return (
    <div className="flex flex-col">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="flex flex-col items-center text-center gap-6">

            <Badge
              variant="outline"
              className={
                apiStatus === "online"  ? "border-green-500/50 text-green-500 bg-green-500/10" :
                apiStatus === "offline" ? "border-red-500/50 text-red-500 bg-red-500/10" :
                "border-muted text-muted-foreground"
              }
            >
              <span className={`mr-1.5 h-1.5 w-1.5 rounded-full inline-block ${
                apiStatus === "online"  ? "bg-green-500" :
                apiStatus === "offline" ? "bg-red-500"   : "bg-muted-foreground"
              }`} />
              {apiStatus === "online"   ? "Sistem Online" :
               apiStatus === "offline"  ? "Sistem Offline" : "Mengecek sistem..."}
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Baca Cuaca{" "}
              <span className="text-primary">Danau Toba</span>
              <br />dengan Kecerdasan Buatan
            </h1>

            <p className="max-w-2xl text-lg text-muted-foreground">
              Platform prediksi cuaca kawasan Danau Toba berbasis Machine Learning.
              Prediksi akurat 7–14 hari ke depan untuk wisatawan, nelayan, petani,
              dan masyarakat umum.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <Button asChild size="lg">
                <Link href="/forecast">
                  Lihat Prediksi Cuaca
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/warning">Cek Early Warning</Link>
              </Button>
            </div>

            {/* Active warnings — list singkat */}
            {activeWarnings.length > 0 && (
              <div className="w-full max-w-xl mt-2 rounded-lg border border-orange-500/30 bg-orange-500/10 p-4 text-left">
                <p className="text-sm font-semibold text-orange-500 flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4" />
                  {activeWarnings.length} lokasi sedang dalam status peringatan
                </p>
                <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                  {activeWarnings.slice(0, 6).map((w, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold shrink-0 ${RISK_BADGE[w.risk_level]}`}>
                        {RISK_LABEL[w.risk_level]}
                      </span>
                      <span className="text-orange-800/80 dark:text-orange-200/80 truncate">
                        {w.location_label}
                      </span>
                    </div>
                  ))}
                  {activeWarnings.length > 6 && (
                    <Link
                      href="/warning"
                      className="text-xs text-orange-500 hover:underline mt-1"
                    >
                      +{activeWarnings.length - 6} lokasi lainnya →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-border/50 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center text-center gap-1">
                <p className="text-3xl font-bold text-primary">
                  {stat.value}
                  <span className="text-lg font-medium text-muted-foreground">{stat.suffix}</span>
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col items-center text-center gap-3 mb-10">
          <h2 className="text-2xl md:text-3xl font-bold">Fitur Platform</h2>
          <p className="text-muted-foreground max-w-xl">
            Semua yang kamu butuhkan untuk memahami cuaca kawasan Danau Toba
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <Link key={f.href} href={f.href}>
              <Card className="h-full hover:border-primary/50 hover:bg-accent/30 transition-all cursor-pointer group">
                <CardContent className="p-6 flex flex-col gap-3">
                  <div className={`w-10 h-10 rounded-lg ${f.bg} flex items-center justify-center`}>
                    <f.icon className={`h-5 w-5 ${f.color}`} />
                  </div>
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  <div className={`flex items-center gap-1 text-xs font-medium mt-auto ${f.color}`}>
                    Buka <ArrowRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Locations — 118 lokasi grouped by kabupaten ── */}
      <section className="bg-muted/30 border-t border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col items-center text-center gap-3 mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">
              {locations.length > 0 ? `${locations.length} Titik Pemantauan` : "118 Titik Pemantauan"}
            </h2>
            <p className="text-muted-foreground max-w-xl">
              Mencakup 7 kabupaten di kawasan Danau Toba — klik kabupaten untuk lihat daftar kecamatan
            </p>
          </div>

          {kabList.length === 0 ? (
            // Skeleton saat loading
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {kabList.map((kab) => (
                <KabupatenAccordion
                  key={kab}
                  kabupaten={kab}
                  locations={kabGroups[kab]}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Model Info ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="flex flex-col gap-4">
            <Badge variant="outline" className="w-fit border-primary/50 text-primary bg-primary/10">
              Machine Learning
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold">
              Didukung Model LSTM Terbaik
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              LangitToba menggunakan model Long Short-Term Memory (LSTM) yang dilatih
              dengan data cuaca 10 tahun kawasan Danau Toba. Model ini mengungguli
              SARIMA dan Prophet dalam semua metrik evaluasi.
            </p>
            <Button asChild variant="outline" className="w-fit">
              <Link href="/about">Pelajari Lebih Lanjut</Link>
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { model: "SARIMA",  mae: "0.933", r2: "-0.098", winner: false },
              { model: "Prophet", mae: "0.726", r2: "0.307",  winner: false },
              { model: "LSTM",    mae: "0.490", r2: "0.649",  winner: true  },
            ].map((m) => (
              <Card key={m.model} className={m.winner ? "border-primary bg-primary/5" : ""}>
                <CardContent className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{m.model}</p>
                    {m.winner && (
                      <Badge className="text-[10px] px-1.5 py-0">Best</Badge>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <Thermometer className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">MAE</p>
                      <p className={`text-xs font-medium ml-auto ${m.winner ? "text-primary" : ""}`}>
                        {m.mae}°C
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">R²</p>
                      <p className={`text-xs font-medium ml-auto ${m.winner ? "text-primary" : ""}`}>
                        {m.r2}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Bottom ── */}
      <section className="border-t border-border/50 bg-primary/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center text-center gap-4">
          <h2 className="text-2xl md:text-3xl font-bold">
            Siap Memantau Cuaca Danau Toba?
          </h2>
          <p className="text-muted-foreground max-w-lg">
            Dapatkan prediksi cuaca akurat untuk perjalanan, aktivitas danau, dan pertanian kamu.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg">
              <Link href="/forecast">
                Mulai Prediksi
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/map">Lihat Peta Cuaca</Link>
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}
 