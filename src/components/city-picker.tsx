"use client";

import { ChevronDown, MapPin, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setSelectedCityAction } from "@/lib/actions";
import cities from "@/data/kladr-cities.json";

type CityItem = { id: string; name: string; region: string; label: string };

export function CityPicker({ initialCity }: { initialCity: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(initialCity);
  const [selected, setSelected] = useState(initialCity);
  const [isPending, startTransition] = useTransition();

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (cities as CityItem[]).filter((c) => !q || c.label.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
    return list.slice(0, 18);
  }, [query]);

  function applyCity(city: string) {
    const formData = new FormData();
    formData.set("selectedCity", city);

    setSelected(city);
    startTransition(async () => {
      await setSelectedCityAction(formData);
      router.refresh();
      setIsOpen(false);
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200"
      >
        <MapPin size={14} className="text-brand-500" />
        <span>{selected}</span>
        <ChevronDown size={14} className="text-slate-400" />
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-[calc(100%+8px)] z-40 w-[320px] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
            <MapPin size={14} className="text-brand-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Москва"
              className="w-full border-0 bg-transparent p-0 text-base outline-none"
            />
            <button type="button" onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
            <ChevronDown size={14} className="text-slate-400" />
          </div>

          <div className="mt-2 max-h-64 overflow-auto rounded-xl border border-slate-200">
            {options.map((city) => (
              <button
                key={city.id}
                type="button"
                onClick={() => applyCity(city.name)}
                className="flex w-full items-center justify-between border-b border-slate-100 px-3 py-2 text-left text-sm text-slate-700 last:border-b-0 hover:bg-slate-50"
              >
                <span>{city.name}</span>
                <span className="text-xs text-slate-400">{city.region}</span>
              </button>
            ))}
          </div>

          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => applyCity(query.trim() || selected)}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
              disabled={isPending}
            >
              {isPending ? "Сохраняем..." : "Применить"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
