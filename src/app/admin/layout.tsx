import { Brain, FileText, LayoutDashboard, Settings, ShieldCheck, Users, UsersRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentUser, PERMISSIONS } from "@/lib/auth";

const items = [
  { href: "/admin", label: "Дашборд", icon: LayoutDashboard },
  { href: "/admin/users", label: "Пользователи", icon: Users },
  { href: "/admin/groups", label: "Группы", icon: UsersRound },
  { href: "/admin/permissions", label: "Права", icon: ShieldCheck },
  { href: "/admin/settings", label: "Настройки", icon: Settings },
  { href: "/admin/ads", label: "Объявления", icon: FileText },
  { href: "/admin/assistant", label: "ИИ Ассистент", icon: Brain },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const current = await getCurrentUser();
  const isStaff =
    current?.permissions.includes(PERMISSIONS.ADMIN_ACCESS) ||
    current?.groupSlugs.includes("moderator") ||
    false;

  if (!current || !isStaff) redirect("/");

  return (
    <main className="grid min-h-[calc(100vh-70px)] grid-cols-1 lg:grid-cols-[240px_1fr]">
      <aside className="border-r border-slate-200 bg-white p-4">
        <p className="mb-4 text-lg font-extrabold text-slate-900">Админ-панель</p>
        <nav className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-brand-50 hover:text-brand-700"
              >
                <Icon size={17} /> {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <section className="bg-[#f7f7fb] p-4 sm:p-6 lg:p-8">{children}</section>
    </main>
  );
}
