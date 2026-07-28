"use client";

import { MapPin, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    ymaps?: any;
  }
}

function loadYmapsScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.ymaps) {
      window.ymaps.ready(() => resolve());
      return;
    }

    const existing = document.querySelector('script[data-ymaps="true"]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => window.ymaps?.ready(() => resolve()));
      existing.addEventListener("error", () => reject(new Error("Failed to load Yandex Maps script")));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://api-maps.yandex.ru/2.1/?lang=ru_RU";
    script.async = true;
    script.dataset.ymaps = "true";
    script.onload = () => window.ymaps?.ready(() => resolve());
    script.onerror = () => reject(new Error("Failed to load Yandex Maps script"));
    document.head.appendChild(script);
  });
}

export function YandexAddressPicker({
  defaultCity,
  defaultAddress,
}: {
  defaultCity: string;
  defaultAddress?: string;
}) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const placemarkRef = useRef<any>(null);

  const [address, setAddress] = useState(defaultAddress ?? "");
  const [coords, setCoords] = useState("");
  const [query, setQuery] = useState(defaultAddress ?? defaultCity);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      await loadYmapsScript();
      if (!mounted || !mapRef.current || !window.ymaps) return;

      const ymaps = window.ymaps;

      const centerFromCity = await ymaps.geocode(defaultCity, { results: 1 });
      const first = centerFromCity.geoObjects.get(0);
      const center = first ? first.geometry.getCoordinates() : [55.751244, 37.618423];

      const map = new ymaps.Map(mapRef.current, {
        center,
        zoom: 11,
        controls: ["zoomControl", "geolocationControl"],
      });

      map.events.add("click", async (e: any) => {
        const clickCoords = e.get("coords");
        setCoords(`${clickCoords[0]},${clickCoords[1]}`);

        const result = await ymaps.geocode(clickCoords, { results: 1 });
        const obj = result.geoObjects.get(0);
        const line = obj?.getAddressLine?.() || "";
        if (line) {
          setAddress(line);
          setQuery(line);
        }

        if (!placemarkRef.current) {
          placemarkRef.current = new ymaps.Placemark(clickCoords, {}, { preset: "islands#violetDotIcon" });
          map.geoObjects.add(placemarkRef.current);
        } else {
          placemarkRef.current.geometry.setCoordinates(clickCoords);
        }
      });

      mapInstanceRef.current = map;
      setIsReady(true);
    })();

    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
      }
    };
  }, [defaultCity]);

  async function searchAddress() {
    if (!window.ymaps || !mapInstanceRef.current || !query.trim()) return;
    const ymaps = window.ymaps;

    const result = await ymaps.geocode(query, { results: 1 });
    const obj = result.geoObjects.get(0);
    if (!obj) return;

    const foundCoords = obj.geometry.getCoordinates();
    const line = obj.getAddressLine?.() || query;

    mapInstanceRef.current.setCenter(foundCoords, 15, { duration: 200 });

    if (!placemarkRef.current) {
      placemarkRef.current = new ymaps.Placemark(foundCoords, {}, { preset: "islands#violetDotIcon" });
      mapInstanceRef.current.geoObjects.add(placemarkRef.current);
    } else {
      placemarkRef.current.geometry.setCoordinates(foundCoords);
    }

    setAddress(line);
    setCoords(`${foundCoords[0]},${foundCoords[1]}`);
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm font-semibold text-slate-800">Адрес на карте</p>
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[240px] flex-1">
          <MapPin size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Введите адрес"
            className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-brand-400"
          />
        </div>
        <button
          type="button"
          onClick={searchAddress}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
        >
          <Search size={14} /> Найти
        </button>
      </div>

      <div ref={mapRef} className="h-72 w-full overflow-hidden rounded-xl border border-slate-200 bg-white" />
      {!isReady ? <p className="text-xs text-slate-500">Загружаем карту...</p> : null}

      <input type="hidden" name="mapAddress" value={address} />
      <input type="hidden" name="mapCoords" value={coords} />

      <p className="text-xs text-slate-500">Кликните на карте или введите адрес вручную — координаты сохранятся в объявлении.</p>
    </div>
  );
}
