"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { CatalogNode } from "@/lib/marketplace";
import { AppSidebar } from "@/components/app-sidebar";
import { TopCategoriesNav } from "@/components/top-categories-nav";

export function AppShell({ children, catalog }: { children: ReactNode; catalog: CatalogNode[] }) {
  const pathname = usePathname();

  const isAdmin = pathname.startsWith("/admin");
  const isProfile = pathname.startsWith("/account");
  const isCreate = pathname === "/create";
  const isEdit = pathname.includes("/edit");

  const showSidebar = !isAdmin;
  const showTopCatalog = !isAdmin && !isProfile && !isCreate && !isEdit;

  return (
    <div className="mx-auto w-full max-w-[1440px] px-3 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        {showSidebar ? <AppSidebar catalog={catalog} /> : null}

        <div className="min-w-0 flex-1 space-y-4">
          {showTopCatalog ? <TopCategoriesNav catalog={catalog} /> : null}
          {children}
        </div>
      </div>
    </div>
  );
}
