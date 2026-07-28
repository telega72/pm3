"use client";

import { useMemo, useState } from "react";
import { getAttributesForSlug } from "@/lib/ad-attributes";

type Root = { id: number; name: string; slug: string; children: { id: number; name: string; slug: string }[] };

export function CategoryAttributesSelector({
  roots,
  defaultRootSlug,
  defaultSubId,
  defaultAttributes,
}: {
  roots: Root[];
  defaultRootSlug?: string;
  defaultSubId?: number;
  defaultAttributes?: Record<string, string>;
}) {
  const [rootSlug, setRootSlug] = useState<string>(defaultRootSlug ?? "");
  const [subId, setSubId] = useState<number | "">(defaultSubId ?? "");
  const [attributes, setAttributes] = useState<Record<string, string>>(defaultAttributes ?? {});

  const root = roots.find((r) => r.slug === rootSlug);
  const sub = root?.children.find((c) => c.id === Number(subId));
  const fields = useMemo(() => getAttributesForSlug(sub?.slug), [sub?.slug]);

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <select value={rootSlug} onChange={(e) => { setRootSlug(e.target.value); setSubId(""); setAttributes({}); }} className="rounded-xl border border-slate-300 px-3 py-2">
          <option value="">Выберите категорию</option>
          {roots.map((r) => <option key={r.id} value={r.slug}>{r.name}</option>)}
        </select>

        <select
          name="categoryId"
          required
          value={subId}
          onChange={(e) => { setSubId(Number(e.target.value)); setAttributes({}); }}
          disabled={!root}
          className="rounded-xl border border-slate-300 px-3 py-2 disabled:bg-slate-100"
        >
          <option value="">Выберите подкатегорию</option>
          {(root?.children ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {sub ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map((field) => (
            <label key={field.key} className="grid gap-1 text-sm text-slate-600">
              <span>{field.label}</span>
              {field.type === "select" ? (
                <select
                  value={attributes[field.key] ?? ""}
                  onChange={(e) => setAttributes((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  className="rounded-xl border border-slate-300 px-3 py-2"
                >
                  <option value="">Не выбрано</option>
                  {(field.options ?? []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input
                  type={field.type === "number" ? "number" : "text"}
                  value={attributes[field.key] ?? ""}
                  onChange={(e) => setAttributes((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
              )}
            </label>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500">Сначала выберите конечную подкатегорию — после этого появятся атрибуты.</p>
      )}

      <input type="hidden" name="attributesJson" value={JSON.stringify(attributes)} />
    </div>
  );
}
