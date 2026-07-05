"use client";

/**
 * LocationCombobox.tsx
 * Komponen combobox searchable untuk memilih lokasi cuaca.
 * - Fetch lokasi dari Zustand store (satu kali saat app load)
 * - Group by kabupaten
 * - Search by nama kecamatan atau kabupaten
 * - Keyboard navigable (shadcn/ui Command primitive)
 *
 * Usage:
 *   import LocationCombobox from "@/components/ui/LocationCombobox";
 *   <LocationCombobox />
 *
 * Komponen ini baca & tulis ke useWeatherStore (selectedKey).
 */

import * as React from "react";
import { Check, ChevronsUpDown, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useWeatherStore, Location } from "@/store/useWeatherStore";

// ─── Group lokasi by kabupaten ──────────────────────────────────
function groupByKabupaten(locations: Location[]): Record<string, Location[]> {
  return locations.reduce<Record<string, Location[]>>((acc, loc) => {
    const kab = loc.kabupaten ?? "Lainnya";
    if (!acc[kab]) acc[kab] = [];
    acc[kab].push(loc);
    return acc;
  }, {});
}

// Urutan tampil kabupaten (dari yang paling relevan ke Danau Toba)
const KAB_ORDER = [
  "Toba",
  "Samosir",
  "Simalungun",
  "Tapanuli Utara",
  "Humbang Hasundutan",
  "Dairi",
  "Karo",
  "Lainnya",
];

function sortedKabupaten(groups: Record<string, Location[]>): string[] {
  const keys = Object.keys(groups);
  return [
    ...KAB_ORDER.filter((k) => keys.includes(k)),
    ...keys.filter((k) => !KAB_ORDER.includes(k)).sort(),
  ];
}

// ─── Komponen utama ─────────────────────────────────────────────
interface LocationComboboxProps {
  /** Ukuran tombol trigger */
  className?: string;
  /** Placeholder saat belum pilih */
  placeholder?: string;
}

export default function LocationCombobox({
  className,
  placeholder = "Pilih lokasi...",
}: LocationComboboxProps) {
  const { locations, locationsLoading, locationsError, fetchLocations, selectedKey, setSelectedKey } =
    useWeatherStore();

  const [open, setOpen] = React.useState(false);

  // Fetch saat mount (idempotent — tidak refetch jika sudah ada)
  React.useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const selectedLocation = locations.find((l) => l.key === selectedKey);
  const groups = groupByKabupaten(locations);
  const kabOrder = sortedKabupaten(groups);

  // ─── Loading state ────────────────────────────────────────────
  if (locationsLoading) {
    return (
      <Button variant="outline" disabled className={cn("w-[280px] justify-start", className)}>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Memuat lokasi...
      </Button>
    );
  }

  // ─── Error state ──────────────────────────────────────────────
  if (locationsError) {
    return (
      <Button
        variant="outline"
        className={cn("w-[280px] justify-start text-destructive", className)}
        onClick={() => fetchLocations()}
      >
        <MapPin className="mr-2 h-4 w-4" />
        Gagal memuat — klik untuk retry
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[280px] justify-between font-normal", className)}
        >
          <span className="flex items-center gap-2 truncate">
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {selectedLocation ? selectedLocation.label : placeholder}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[320px] p-0" align="start">
        <Command
          filter={(value, search) => {
            // value = loc.key; cari di label dan kabupaten
            const loc = locations.find((l) => l.key === value);
            if (!loc) return 0;
            const q = search.toLowerCase();
            if (
              loc.label.toLowerCase().includes(q) ||
              (loc.kabupaten ?? "").toLowerCase().includes(q)
            )
              return 1;
            return 0;
          }}
        >
          <CommandInput placeholder="Cari kecamatan atau kabupaten..." />
          <CommandList className="max-h-[320px]">
            <CommandEmpty>Lokasi tidak ditemukan.</CommandEmpty>

            {kabOrder.map((kab) => (
              <CommandGroup key={kab} heading={kab}>
                {groups[kab].map((loc) => (
                  <CommandItem
                    key={loc.key}
                    value={loc.key}
                    onSelect={(val) => {
                      setSelectedKey(val);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedKey === loc.key ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="flex-1 truncate">{loc.label}</span>
                    {loc.is_lakeside && (
                      <span className="ml-2 rounded-sm bg-blue-100 px-1 py-0.5 text-[10px] text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        tepi danau
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
