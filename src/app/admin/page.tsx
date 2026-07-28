import { Brain, FileText, Settings, ShieldCheck, TrendingUp, TriangleAlert, UserRound, UsersRound } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { getAdminDashboardData } from "@/lib/admin-dashboard";
import { ensureMarketplaceSeed, toRub } from "@/lib/marketplace";

export default async function AdminPage() {
  await ensureMarketplaceSeed();
  const data = await getAdminDashboardData();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900">Админ-панель</h1>
          <p className="mt-1 text-slate-500">Добро пожаловать в панель управления</p>
        </div>
        <Link href="/admin" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600">
          Обновить
        </Link>
      </div>

      <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Всего объявлений" value={String(data.cards.totalAds)} icon={<FileText size={16} />} />
        <StatCard title="Активных" value={String(data.cards.activeAds)} icon={<TrendingUp size={16} />} />
        <StatCard title="На модерации" value={String(data.cards.pendingAds)} icon={<TriangleAlert size={16} />} />
        <StatCard title="Пользователей" value={String(data.cards.users)} icon={<UserRound size={16} />} />
        <StatCard title="Доход" value={toRub(data.cards.revenueRub)} icon={<span className="text-sm font-black">₽</span>} />
        <StatCard title="Действий ИИ" value={String(data.cards.aiActions)} icon={<Brain size={16} />} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ActionCard href="/admin/users" title="Пользователи сайта" sub="Построчный список и редактирование" icon={<UsersRound size={20} />} />
        <ActionCard href="/admin/groups" title="Группы пользователей" sub="Создание и настройка групп" icon={<UsersRound size={20} />} />
        <ActionCard href="/admin/permissions" title="Права пользователей" sub="Управление правами и ролями" icon={<ShieldCheck size={20} />} />
        <ActionCard href="/admin/settings" title="Настройки сайта" sub="Глобальные параметры, цены, лимиты" icon={<Settings size={20} />} />
        <ActionCard href="/admin/ads" title="Управление объявлениями" sub="Модерация, одобрение, отклонение" icon={<FileText size={20} />} />
        <ActionCard href="/admin/assistant" title="ИИ Ассистент" sub="AI-модератор и поддержка" icon={<Brain size={20} />} />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5">
        <h2 className="text-2xl font-extrabold text-slate-900">Последние объявления на модерации</h2>

        {data.moderationQueue.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Очередь модерации пуста.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {data.moderationQueue.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.moderationReason ?? "Ожидает проверки"}</p>
                </div>
                <Link href={`/admin/ads#ad-${item.id}`} className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700">
                  Проверить
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: ReactNode }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <span className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-700">{icon}</span>
      <p className="text-3xl font-extrabold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{title}</p>
    </article>
  );
}

function ActionCard({ href, title, sub, icon }: { href: string; title: string; sub: string; icon: ReactNode }) {
  return (
    <Link href={href} className="rounded-3xl border border-slate-200 bg-white p-5 transition hover:border-brand-200 hover:bg-brand-50/30">
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
        {icon}
      </span>
      <p className="text-2xl font-extrabold text-slate-900">{title}</p>
      <p className="mt-1 text-slate-500">{sub}</p>
    </Link>
  );
}
