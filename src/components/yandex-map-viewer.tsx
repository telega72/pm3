"use client";

import { MapPinned } from "lucide-react";
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

export function YandexMapViewer({ city, address }: { city: string; address?: string }) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!open) return;
    let mounted = true;

    (async () => {
      await loadYmapsScript();
      if (!mounted || !window.ymaps || !mapRef.current) return;

      const ymaps = window.ymaps;
      const query = address?.trim() ? `${city}, ${address}` : city;

      const result = await ymaps.geocode(query, { results: 1 });
      const first = result.geoObjects.get(0);
      const coords = first?.geometry.getCoordinates() ?? [55.751244, 37.618423];

      const map = new ymaps.Map(mapRef.current, {
        center: coords,
        zoom: 14,
        controls: ["zoomControl"],
      });

      const placemark = new ymaps.Placemark(coords, { balloonContent: query }, { preset: "islands#violetDotIcon" });
      map.geoObjects.add(placemark);
      mapInstanceRef.current = map;
      setReady(true);
    })();

    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
      setReady(false);
    };
  }, [open, city, address]);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
      >
        <MapPinned size={16} /> Посмотреть на карте
      </button>

      {open ? (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div ref={mapRef} className="h-64 w-full overflow-hidden rounded-xl border border-slate-200 bg-white" />
          {!ready ? <p className="mt-2 text-xs text-slate-500">Загружаем карту...</p> : null}
          <p className="mt-2 text-xs text-slate-500">{address?.trim() ? `${city}, ${address}` : city}</p>
        </div>
      ) : null}
    </div>
  );
}
