"use client";

import { useMemo, useState } from "react";
import { getAttributesForSlug, type AttributeField } from "@/lib/ad-attributes";

type CategoryOption = { id: number; label: string; subSlug: string };

export function AdAttributesFields({
  categories,
  defaultCategoryId,
  defaultAttributes,
}: {
  categories: CategoryOption[];
  defaultCategoryId?: number;
  defaultAttributes?: Record<string, string>;
}) {
  const [categoryId, setCategoryId] = useState<number | undefined>(defaultCategoryId ?? categories[0]?.id);
  const [attributes, setAttributes] = useState<Record<string, string>>(defaultAttributes ?? {});

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const fields = useMemo<AttributeField[]>(() => getAttributesForSlug(selectedCategory?.subSlug), [selectedCategory?.subSlug]);

  const serialized = JSON.stringify(attributes);

  return (
    <>
      <select
        required
        name="categoryId"
        value={categoryId ?? ""}
        onChange={(e) => setCategoryId(Number(e.target.value))}
        className="rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-300 focus:ring"
      >
        <option value="" disabled>
          Выберите подкатегорию
        </option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.label}
          </option>
        ))}
      </select>

      <input type="hidden" name="attributesJson" value={serialized} />

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
                {(field.options ?? []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
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
    </>
  );
}
