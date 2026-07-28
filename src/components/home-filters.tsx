"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import type { CatalogNode } from "@/lib/marketplace";
import { getAttributesForSlug } from "@/lib/ad-attributes";

type Props = {
  catalog: CatalogNode[];
  rootSlug?: string;
  subSlug?: string;
  sort: "new" | "cheap" | "expensive" | "popular";
  initialAttributes: Record<string, string>;
};

export function HomeFilters({ catalog, rootSlug, subSlug, sort, initialAttributes }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [isOpen, setIsOpen] = useState(true);
  const [selectedRoot, setSelectedRoot] = useState(rootSlug ?? "");
  const [selectedSub, setSelectedSub] = useState(subSlug ?? "");
  const [selectedSort, setSelectedSort] = useState<Props["sort"]>(sort);
  const [attrValues, setAttrValues] = useState<Record<string, string>>(initialAttributes);

  const root = useMemo(() => catalog.find((item) => item.slug === selectedRoot), [catalog, selectedRoot]);
  const sub = useMemo(() => root?.children.find((item) => item.slug === selectedSub), [root, selectedSub]);
  const fields = useMemo(() => getAttributesForSlug(sub?.slug), [sub?.slug]);

  useEffect(() => {
    setSelectedRoot(rootSlug ?? "");
    setSelectedSub(subSlug ?? "");
    setSelectedSort(sort);
    setAttrValues(initialAttributes);
  }, [rootSlug, subSlug, sort, initialAttributes]);

  function apply(next: {
    rootCategory: string;
    subCategory: string;
    sort: Props["sort"];
    attributes: Record<string, string>;
  }) {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("rootCategory");
    params.delete("subCategory");
    params.delete("sort");

    Array.from(params.keys())
      .filter((key) => key.startsWith("attr_"))
      .forEach((key) => params.delete(key));

    if (next.rootCategory) params.set("rootCategory", next.rootCategory);
    if (next.subCategory) params.set("subCategory", next.subCategory);
    if (next.sort !== "new") params.set("sort", next.sort);

    Object.entries(next.attributes).forEach(([key, value]) => {
      const val = value.trim();
      if (val) params.set(`attr_${key}`, val);
    });

    const qs = params.toString();

    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
      setIsOpen(false);
    });
  }

  function autoApply(nextRoot: string, nextSub: string, nextSort: Props["sort"], nextAttrs: Record<string, string>) {
    apply({ rootCategory: nextRoot, subCategory: nextSub, sort: nextSort, attributes: nextAttrs });
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-left"
      >
        <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-800">
          <SlidersHorizontal size={16} />
          Фильтр объявлений
          {isPending ? <span className="text-xs font-semibold text-brand-600">обновление…</span> : null}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <div className={`grid transition-all duration-300 ease-out ${isOpen ? "mt-3 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <div className="grid gap-3 pt-1">
            <div className="grid gap-2 lg:grid-cols-[1fr_1fr_220px]">
              <select
                value={selectedRoot}
                onChange={(e) => {
                  const nextRoot = e.target.value;
                  setSelectedRoot(nextRoot);
                  setSelectedSub("");
                  setAttrValues({});
                  autoApply(nextRoot, "", selectedSort, {});
                }}
                className="no-select-arrow rounded-xl border border-slate-300 px-3 py-2"
              >
                <option value="">Категория</option>
                {catalog.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedSub}
                onChange={(e) => {
                  const nextSub = e.target.value;
                  setSelectedSub(nextSub);
                  setAttrValues({});
                  autoApply(selectedRoot, nextSub, selectedSort, {});
                }}
                disabled={!root}
                className="no-select-arrow rounded-xl border border-slate-300 px-3 py-2 disabled:bg-slate-100"
              >
                <option value="">Подкатегория</option>
                {(root?.children ?? []).map((item) => (
                  <option key={item.id} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedSort}
                onChange={(e) => {
                  const nextSort = (e.target.value as Props["sort"]) || "new";
                  setSelectedSort(nextSort);
                  autoApply(selectedRoot, selectedSub, nextSort, attrValues);
                }}
                className="no-select-arrow rounded-xl border border-slate-300 px-3 py-2"
              >
                <option value="new">Новые</option>
                <option value="cheap">Дешёвые</option>
                <option value="expensive">Дорогие</option>
                <option value="popular">Популярные</option>
              </select>
            </div>

            {sub ? (
              <div className="animate-fade-up grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {fields.map((field) => {
                  const name = field.key;
                  const value = attrValues[name] ?? "";

                  if (field.type === "select") {
                    return (
                      <select
                        key={field.key}
                        value={value}
                        onChange={(e) => {
                          const next = { ...attrValues, [name]: e.target.value };
                          setAttrValues(next);
                          autoApply(selectedRoot, selectedSub, selectedSort, next);
                        }}
                        className="no-select-arrow rounded-xl border border-slate-300 px-3 py-2"
                      >
                        <option value="">{field.label}</option>
                        {(field.options ?? []).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    );
                  }

                  return (
                    <input
                      key={field.key}
                      value={value}
                      onChange={(e) => setAttrValues((prev) => ({ ...prev, [name]: e.target.value }))}
                      placeholder={field.label}
                      type={field.type === "number" ? "number" : "text"}
                      className="rounded-xl border border-slate-300 px-3 py-2"
                    />
                  );
                })}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => apply({ rootCategory: selectedRoot, subCategory: selectedSub, sort: selectedSort, attributes: attrValues })}
                className="rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white"
              >
                Применить
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRoot("");
                  setSelectedSub("");
                  setSelectedSort("new");
                  setAttrValues({});
                  apply({ rootCategory: "", subCategory: "", sort: "new", attributes: {} });
                }}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600"
              >
                Сбросить
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
