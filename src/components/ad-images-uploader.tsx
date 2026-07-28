"use client";

import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { useMemo, useState } from "react";

type UploadedItem = {
  url: string;
};

export function AdImagesUploader({ maxCount, maxSizeKb }: { maxCount: number; maxSizeKb: number }) {
  const [items, setItems] = useState<UploadedItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAdd = items.length < maxCount;

  const serialized = useMemo(() => JSON.stringify(items.map((x) => x.url)), [items]);

  async function onSelect(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const allowedFiles = Array.from(files).slice(0, maxCount - items.length);
    setUploading(true);

    try {
      for (const file of allowedFiles) {
        if (file.size > maxSizeKb * 1024) {
          setError(`Файл ${file.name} превышает ${maxSizeKb} КБ`);
          continue;
        }

        const fd = new FormData();
        fd.append("file", file);

        const res = await fetch("/api/upload-ad-image", { method: "POST", body: fd });
        const data = (await res.json()) as { ok: boolean; url?: string; error?: string };

        if (!res.ok || !data.ok || !data.url) {
          setError(`Не удалось загрузить ${file.name}`);
          continue;
        }

        setItems((prev) => [...prev, { url: data.url! }]);
      }
    } finally {
      setUploading(false);
    }
  }

  function removeUrl(url: string) {
    setItems((prev) => prev.filter((x) => x.url !== url));
  }

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-700">Изображения объявления</p>
        <p className="text-xs text-slate-500">{items.length} / {maxCount}</p>
      </div>

      <p className="mt-1 text-xs text-slate-500">
        AJAX загрузка со сжатием. Макс. {maxSizeKb} КБ на файл.
      </p>

      <input type="hidden" name="imageUrlsJson" value={serialized} />

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.url} className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt="Изображение" className="h-28 w-full object-cover" />
            <button
              type="button"
              onClick={() => removeUrl(item.url)}
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-slate-600"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {canAdd ? (
          <label className="grid h-28 cursor-pointer place-items-center rounded-xl border border-dashed border-slate-300 text-slate-500 transition hover:border-brand-300 hover:text-brand-700">
            {uploading ? <LoaderCircle size={18} className="animate-spin" /> : <ImagePlus size={18} />}
            <span className="mt-1 text-xs">Добавить</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(e) => {
                void onSelect(e.target.files);
                e.currentTarget.value = "";
              }}
            />
          </label>
        ) : null}
      </div>

      {error ? <p className="mt-2 text-xs font-semibold text-rose-600">{error}</p> : null}
    </div>
  );
}
