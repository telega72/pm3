"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, House, PlusSquare, UserRound } from "lucide-react";
import type { CatalogNode } from "@/lib/marketplace";
import { CategoryIcon } from "@/components/category-icon";

export function AppSidebar({ catalog }: { catalog: CatalogNode[] }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Главная", icon: House },
    { href: "/create", label: "Подать объявление", icon: PlusSquare },
    { href: "/account", label: "Профиль", icon: UserRound },
    { href: "/support", label: "Поддержка", icon: CircleHelp },
  ];

  return (
    <aside className="w-full space-y-4 md:sticky md:top-24 md:w-72 md:self-start">
      <section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
        <nav className="grid gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
        <h3 className="px-2 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">Категории</h3>
        <div className="mt-2 grid gap-1">
          {catalog.map((root) => {
            const active = pathname.startsWith(`/catalog/${root.slug}`);

            return (
              <Link
                key={root.id}
                href={`/catalog/${root.slug}`}
                className={`flex items-center gap-2 rounded-xl px-2 py-2 text-sm transition ${
                  active ? "bg-brand-50" : "hover:bg-slate-100"
                }`}
              >
                <CategoryIcon icon={root.icon} className="h-8 w-8 rounded-xl" innerClassName="h-4 w-4" />
                <span className={`font-medium ${active ? "text-brand-700" : "text-slate-700"}`}>{root.name}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </aside>
  );
}
