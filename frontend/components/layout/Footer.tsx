import Link from "next/link";
import { Cloud, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center md:items-start gap-1">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
                <Cloud className="h-3 w-3 text-primary-foreground" />
              </div>
              <span>Langit<span className="text-primary">Toba</span></span>
            </Link>
            <p className="text-xs text-muted-foreground">Membaca Langit Toba dengan Data</p>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/forecast" className="hover:text-foreground transition-colors">Prediksi</Link>
            <Link href="/climate" className="hover:text-foreground transition-colors">Tren Iklim</Link>
            <Link href="/warning" className="hover:text-foreground transition-colors">Peringatan</Link>
            <Link href="/about" className="hover:text-foreground transition-colors">Tentang</Link>
          </div>
          <div className="flex flex-col items-center md:items-end gap-1">
            <a href="https://github.com/Arjunamelix/LangitToba" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ExternalLink className="h-4 w-4" />
              <span>GitHub</span>
            </a>
            <p className="text-xs text-muted-foreground">© 2026 Arjuna Melix · IT Del</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
