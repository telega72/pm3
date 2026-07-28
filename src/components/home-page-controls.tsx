"use client";

import { ChevronLeft, Search, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, type ReactNode, useEffect, useMemo, useState, useTransition } from "react";
import { CategoryIcon } from "@/components/category-icon";
import { getAttributesForSlug, type AttributeField } from "@/lib/ad-attributes";
import type { CatalogNode } from "@/lib/marketplace";

type Props = {
  catalog: CatalogNode[];
  initialOpenRootSlug?: string;
  initialSubSlug?: string;
  initialSort: "new" | "cheap" | "expensive" | "popular";
  initialQ?: string;
  initialMinPrice?: string;
  initialMaxPrice?: string;
  initialAttrValues: Record<string, string>;
  children: ReactNode;
};

function dedupeCatalog(catalog: CatalogNode[]) {
  const roots = new Map<string, CatalogNode>();

  for (const root of catalog) {
    const existing = roots.get(root.slug);

    if (!existing) {
      const childrenMap = new Map<string, CatalogNode>();
      for (const child of root.children) {
        if (!childrenMap.has(child.slug)) childrenMap.set(child.slug, child);
      }
      roots.set(root.slug, { ...root, children: [...childrenMap.values()] });
      continue;
    }

    const childrenMap = new Map(existing.children.map((child) => [child.slug, child]));
    for (const child of root.children) {
      if (!childrenMap.has(child.slug)) childrenMap.set(child.slug, child);
    }
    roots.set(root.slug, { ...existing, children: [...childrenMap.values()] });
  }

  return [...roots.values()];
}

function findRootBySub(catalog: CatalogNode[], subSlug: string | undefined) {
  if (!subSlug) return undefined;
  return catalog.find((root) => root.children.some((sub) => sub.slug === subSlug));
}

export function HomePageControls({
  catalog,
  initialOpenRootSlug,
  initialSubSlug,
  initialSort,
  initialQ,
  initialMinPrice,
  initialMaxPrice,
  initialAttrValues,
  children,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const normalizedCatalog = useMemo(() => dedupeCatalog(catalog), [catalog]);
  const initialRootBySub = useMemo(() => findRootBySub(normalizedCatalog, initialSubSlug), [normalizedCatalog, initialSubSlug]);

  const [expandedRootSlug, setExpandedRootSlug] = useState<string>(initialRootBySub?.slug ?? initialOpenRootSlug ?? "");
  const [topRootSlug, setTopRootSlug] = useState<string>(initialRootBySub?.slug ?? initialOpenRootSlug ?? normalizedCatalog[0]?.slug ?? "");
  const [selectedSubSlug, setSelectedSubSlug] = useState(initialSubSlug ?? "");
  const [topMode, setTopMode] = useState<"roots" | "subs">(
    initialSubSlug || initialOpenRootSlug ? "subs" : "roots",
  );
  const [showFilters, setShowFilters] = useState(false);

  const [query, setQuery] = useState(initialQ ?? "");
  const [sort, setSort] = useState<Props["initialSort"]>(initialSort);
  const [minPrice, setMinPrice] = useState(initialMinPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice ?? "");
  const [attrValues, setAttrValues] = useState<Record<string, string>>(initialAttrValues);

  const selectedRoot = useMemo(
    () => normalizedCatalog.find((item) => item.slug === topRootSlug) ?? normalizedCatalog[0],
    [normalizedCatalog, topRootSlug],
  );

  const selectedAttrFields: AttributeField[] = useMemo(() => {
    if (!selectedSubSlug) return [];
    return getAttributesForSlug(selectedSubSlug);
  }, [selectedSubSlug]);

  useEffect(() => {
    const rootFromSub = findRootBySub(normalizedCatalog, initialSubSlug);
    const nextRoot = rootFromSub?.slug ?? initialOpenRootSlug ?? "";

    setExpandedRootSlug(nextRoot);
    setTopRootSlug(rootFromSub?.slug ?? initialOpenRootSlug ?? normalizedCatalog[0]?.slug ?? "");
    setSelectedSubSlug(initialSubSlug ?? "");
    setTopMode(initialSubSlug || initialOpenRootSlug ? "subs" : "roots");
    setQuery(initialQ ?? "");
    setSort(initialSort);
    setMinPrice(initialMinPrice ?? "");
    setMaxPrice(initialMaxPrice ?? "");
    setAttrValues(initialAttrValues);
  }, [initialOpenRootSlug, initialSubSlug, initialQ, initialSort, initialMinPrice, initialMaxPrice, initialAttrValues, normalizedCatalog]);

  function updateUrl(next: {
    q?: string;
    sort?: Props["initialSort"];
    openRoot?: string;
    subCategory?: string;
    minPrice?: string;
    maxPrice?: string;
    attrs?: Record<string, string>;
  }) {
    const params = new URLSearchParams(searchParams.toString());

    const setOrDelete = (key: string, value: string | undefined) => {
      const normalized = (value ?? "").trim();
      if (normalized) params.set(key, normalized);
      else params.delete(key);
    };

    setOrDelete("q", next.q);
    if (next.sort && next.sort !== "new") params.set("sort", next.sort);
    else if (next.sort) params.delete("sort");

    setOrDelete("openRoot", next.openRoot);
    setOrDelete("subCategory", next.subCategory);
    setOrDelete("minPrice", next.minPrice);
    setOrDelete("maxPrice", next.maxPrice);

    Array.from(params.keys())
      .filter((key) => key.startsWith("attr_"))
      .forEach((key) => params.delete(key));

    Object.entries(next.attrs ?? {}).forEach(([key, value]) => {
      const val = value.trim();
      if (val) params.set(`attr_${key}`, val);
    });

    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function onRootToggle(slug: string) {
    const next = expandedRootSlug === slug ? "" : slug;
    const root = normalizedCatalog.find((item) => item.slug === slug);
    const hasCurrentSub = root?.children.some((child) => child.slug === selectedSubSlug) ?? false;

    const nextSub = hasCurrentSub ? selectedSubSlug : "";
    const nextAttrs = hasCurrentSub ? attrValues : {};

    setExpandedRootSlug(next);
    setTopRootSlug(slug);
    setTopMode("subs");
    setSelectedSubSlug(nextSub);
    setAttrValues(nextAttrs);

    updateUrl({ q: query, sort, openRoot: next, subCategory: nextSub, minPrice, maxPrice, attrs: nextAttrs });
  }

  function onSubSelect(rootSlug: string, subSlug: string) {
    setExpandedRootSlug(rootSlug);
    setTopRootSlug(rootSlug);
    setTopMode("subs");
    setSelectedSubSlug(subSlug);

    const resetAttrs: Record<string, string> = {};
    setAttrValues(resetAttrs);

    updateUrl({
      q: query,
      sort,
      openRoot: rootSlug,
      subCategory: subSlug,
      minPrice,
      maxPrice,
      attrs: resetAttrs,
    });
  }

  function applyFilters(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    updateUrl({
      q: query,
      sort,
      openRoot: expandedRootSlug,
      subCategory: selectedSubSlug,
      minPrice,
      maxPrice,
      attrs: attrValues,
    });
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <aside className="w-full rounded-2xl border border-slate-200 bg-white p-3 lg:w-[230px] lg:shrink-0">
        <nav className="space-y-1">
          {normalizedCatalog.map((root) => {
            const expanded = expandedRootSlug === root.slug;

            return (
              <div key={root.slug} className="space-y-1">
                <button
                  type="button"
                  onClick={() => onRootToggle(root.slug)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition ${
                    expanded ? "bg-brand-50 font-semibold text-brand-700" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <CategoryIcon icon={root.icon ?? root.slug} className="h-7 w-7 rounded-lg" innerClassName="h-3.5 w-3.5" />
                  <span className="truncate">{root.name}</span>
                </button>

                <div
                  className={`ml-3 grid transition-all duration-300 ease-out ${
                    expanded ? "grid-rows-[1fr] opacity-100 translate-x-0" : "grid-rows-[0fr] opacity-0 -translate-x-1"
                  }`}
                >
                  <div className="overflow-hidden border-l border-slate-200 pl-3">
                    <div className="space-y-1 py-1">
                      {root.children.map((sub) => (
                        <button
                          key={sub.slug}
                          type="button"
                          onClick={() => onSubSelect(root.slug, sub.slug)}
                          className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition ${
                            selectedSubSlug === sub.slug
                              ? "bg-slate-100 font-semibold text-slate-900"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <CategoryIcon icon={sub.icon ?? sub.slug} className="h-6 w-6 rounded-md" innerClassName="h-3 w-3" />
                          <span className="truncate">{sub.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className={`grid gap-3 transition-all duration-300 ${topMode === "roots" ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}`}>
            {topMode === "roots" ? (
              normalizedCatalog.map((root) => (
                <button
                  key={root.slug}
                  type="button"
                  onClick={() => {
                    const hasCurrentSub = root.children.some((child) => child.slug === selectedSubSlug);
                    const nextSub = hasCurrentSub ? selectedSubSlug : "";
                    const nextAttrs = hasCurrentSub ? attrValues : {};

                    setTopMode("subs");
                    setTopRootSlug(root.slug);
                    setExpandedRootSlug(root.slug);
                    setSelectedSubSlug(nextSub);
                    setAttrValues(nextAttrs);

                    updateUrl({ q: query, sort, openRoot: root.slug, subCategory: nextSub, minPrice, maxPrice, attrs: nextAttrs });
                  }}
                  className="animate-fade-up rounded-xl border border-slate-100 bg-slate-50 px-3 py-4 text-center transition hover:border-brand-200 hover:bg-brand-50"
                >
                  <div className="mx-auto mb-2 w-fit">
                    <CategoryIcon icon={root.icon ?? root.slug} className="h-10 w-10" innerClassName="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{root.name}</p>
                </button>
              ))
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setTopMode("roots")}
                  className="animate-fade-up inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <ChevronLeft size={16} /> Все категории
                </button>

                {(selectedRoot?.children ?? []).map((sub) => (
                  <button
                    key={sub.slug}
                    type="button"
                    onClick={() => onSubSelect(selectedRoot.slug, sub.slug)}
                    className={`animate-fade-up inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition ${
                      selectedSubSlug === sub.slug
                        ? "border-brand-300 bg-brand-50 text-brand-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:text-brand-700"
                    }`}
                  >
                    <CategoryIcon icon={sub.icon ?? sub.slug} className="h-7 w-7 rounded-lg" innerClassName="h-3.5 w-3.5" />
                    <span className="truncate">{sub.name}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <form className="space-y-3" onSubmit={applyFilters}>
            <div className="flex flex-wrap gap-2">
              <div className="relative min-w-[240px] flex-1">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск объявлений..."
                  className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-400"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowFilters((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                <SlidersHorizontal size={16} /> Фильтр
              </button>

              <select
                value={sort}
                onChange={(e) => {
                  const nextSort = (e.target.value as Props["initialSort"]) ?? "new";
                  setSort(nextSort);
                  updateUrl({ q: query, sort: nextSort, openRoot: expandedRootSlug, subCategory: selectedSubSlug, minPrice, maxPrice, attrs: attrValues });
                }}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none"
              >
                <option value="new">Сначала новые</option>
                <option value="cheap">Сначала дешёвые</option>
                <option value="expensive">Сначала дорогие</option>
                <option value="popular">Сначала популярные</option>
              </select>
            </div>

            <div className={`grid transition-all duration-300 ${showFilters ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden">
                <div className="grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-2 lg:grid-cols-4">
                  <input
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Цена от"
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Цена до"
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />

                  <div className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600">
                    Категория: {selectedRoot?.name ?? "—"}
                  </div>
                  <div className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600">
                    Подкатегория: {selectedRoot?.children.find((sub) => sub.slug === selectedSubSlug)?.name ?? "Все"}
                  </div>

                  {selectedAttrFields.map((field) => {
                    const value = attrValues[field.key] ?? "";

                    if (field.type === "select") {
                      return (
                        <select
                          key={field.key}
                          value={value}
                          onChange={(e) => setAttrValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
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
                        onChange={(e) => setAttrValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.label}
                        type={field.type === "number" ? "number" : "text"}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      />
                    );
                  })}

                  <button type="submit" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white lg:col-span-1">
                    {isPending ? "Применяем..." : "Применить"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </section>

        {children}
      </div>
    </div>
  );
}
