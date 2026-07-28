"use client";

import { MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import cities from "@/data/kladr-cities.json";

type CityItem = { id: string; name: string; region: string; label: string };

export function CityInput({ name, defaultValue, required = false }: { name: string; defaultValue?: string; required?: boolean }) {
  const [query, setQuery] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (cities as CityItem[]).filter((c) => !q || c.label.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
    return list.slice(0, 12);
  }, [query]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2">
        <MapPin size={14} className="text-brand-500" />
        <input
          required={required}
          name={name}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onBlur={() => {
            setTimeout(() => setOpen(false), 120);
          }}
          placeholder="Город"
          className="w-full border-0 bg-transparent p-0 text-sm outline-none"
        />
      </div>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+6px)] z-20 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {options.map((city) => (
            <button
              key={city.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setQuery(city.name);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between border-b border-slate-100 px-3 py-2 text-left text-sm text-slate-700 last:border-b-0 hover:bg-slate-50"
            >
              <span>{city.name}</span>
              <span className="text-xs text-slate-400">{city.region}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
