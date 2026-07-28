"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import type { CatalogNode } from "@/lib/marketplace";
import { CategoryIcon } from "@/components/category-icon";

export function TopCategoriesNav({ catalog }: { catalog: CatalogNode[] }) {
  const [activeRoot, setActiveRoot] = useState<string | null>(null);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-slate-700">Каталог категорий</h2>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {catalog.map((root) => {
          const isOpen = activeRoot === root.slug;

          return (
            <button
              key={root.id}
              type="button"
              onClick={() => setActiveRoot((prev) => (prev === root.slug ? null : root.slug))}
              className={`group inline-flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                isOpen
                  ? "border-brand-300 bg-brand-50 text-brand-700"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <CategoryIcon icon={root.icon} className="h-8 w-8 rounded-xl" innerClassName="h-4 w-4" />
              {root.name}
            </button>
          );
        })}
      </div>

      {activeRoot ? (
        <div className="mt-3 animate-fade-up rounded-2xl border border-slate-200 bg-slate-50 p-3">
          {catalog
            .filter((root) => root.slug === activeRoot)
            .map((root) => (
              <div key={root.id}>
                <div className="mb-2 flex items-center justify-between">
                  <Link
                    href={`/catalog/${root.slug}`}
                    className="text-sm font-semibold text-brand-700 transition hover:text-brand-800"
                  >
                    Смотреть раздел «{root.name}»
                  </Link>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {root.children.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/catalog/${root.slug}/${sub.slug}`}
                      className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                    >
                      <span className="inline-flex items-center gap-2">
                        <CategoryIcon icon={sub.icon} className="h-7 w-7 rounded-lg" innerClassName="h-3.5 w-3.5" />
                        {sub.name}
                      </span>
                      <ChevronRight size={14} className="text-slate-400 transition group-hover:text-brand-600" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
        </div>
      ) : null}
    </section>
  );
}
