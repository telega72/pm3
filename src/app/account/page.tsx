import {
  BarChart3,
  CirclePlus,
  Clock3,
  Heart,
  Mail,
  MapPin,
  MessageCircle,
  PencilLine,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AvatarUpload } from "@/components/avatar-upload";
import { CityInput } from "@/components/city-input";
import { updateProfileAction } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth";
import { ensureMarketplaceSeed, getUserQuotaStatus, listAdsByUser, toRub } from "@/lib/marketplace";
import { listConversations, listFavoriteAds } from "@/lib/social";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }).format(value);
}

type AccountPageProps = {
  searchParams: Promise<{ tab?: string; edit?: string; saved?: string; error?: string }>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  await ensureMarketplaceSeed();

  const current = await getCurrentUser();
  if (!current) redirect("/auth/login");

  const params = await searchParams;
  const tab = params.tab === "favorites" ? "favorites" : params.tab === "chats" ? "chats" : "ads";
  const isEditing = params.edit === "1";

  const [myAds, favoriteAds, chats, quota] = await Promise.all([
    listAdsByUser(current.id),
    listFavoriteAds(current.id),
    listConversations(current.id),
    getUserQuotaStatus(current.id),
  ]);

  const promotedCount = myAds.filter((ad) => ad.isActive).length;

  const role = current.groupSlugs.includes("admin")
    ? { label: "Администратор", className: "bg-rose-100 text-rose-700" }
    : current.groupSlugs.includes("moderator")
      ? { label: "Модератор", className: "bg-amber-100 text-amber-700" }
      : { label: "Пользователь", className: "bg-slate-100 text-slate-600" };

  const tabs = [
    { key: "ads", label: `Мои объявления (${myAds.length})`, href: "/account?tab=ads" },
    { key: "favorites", label: `Избранное (${favoriteAds.length})`, href: "/account?tab=favorites" },
    { key: "chats", label: `Чат (${chats.length})`, href: "/account?tab=chats" },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <section className="animate-fade-up rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <AvatarUpload name={current.name} avatarUrl={current.avatarUrl} initial={current.name.charAt(0).toUpperCase()} />

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900">{current.name}</h1>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                  ID: {current.id}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className={`rounded-full px-2.5 py-1 ${role.className}`}>{role.label}</span>
                {current.groupNames.filter((n) => n !== role.label).map((name) => (
                  <span key={name} className="text-slate-500">
                    {name}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-brand-700">
                  <MapPin size={12} /> {current.city}
                </span>
              </div>
            </div>
          </div>

          <Link
            href="/account?edit=1"
            className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700 transition hover:bg-brand-100"
          >
            <PencilLine size={16} /> Редактировать профиль
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InfoCard icon={<Mail size={16} />} label="Email" value={current.email ?? "не указан"} />
          <InfoCard icon={<Phone size={16} />} label="Телефон" value={current.phone} />
          <InfoCard icon={<MapPin size={16} />} label="Город" value={current.city} />
          <InfoCard icon={<Clock3 size={16} />} label="На сайте с" value={formatDate(new Date())} />
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <BarChart3 size={14} /> Объявлений
            </p>
            <p className="mt-2 text-xl font-extrabold text-slate-900">{myAds.length}</p>
          </div>
          <div className="rounded-2xl bg-brand-50 p-4">
            <p className="text-xs font-semibold text-brand-700">Бесплатные объявления</p>
            <p className="mt-2 text-sm font-extrabold text-brand-700">
              Осталось: {Math.max(0, quota.freeLimit - quota.usedCount)} / {quota.freeLimit}
            </p>
          </div>

        </div>

        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-400">
          Наведите на аватар, чтобы загрузить фото. Макс. 2048 КБ, форматы jpg, jpeg, png, webp, gif
        </p>

        {params.saved ? <p className="mt-3 text-sm font-semibold text-emerald-600">Изменения сохранены.</p> : null}
        {params.error === "avatar" ? (
          <p className="mt-3 text-sm font-semibold text-rose-600">Файл не подходит: проверьте формат и размер.</p>
        ) : null}
      </section>

      {isEditing ? (
        <section className="animate-fade-up mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-slate-900">Редактирование профиля</h2>
          <p className="mt-1 text-xs text-slate-500">Номер телефона изменить нельзя.</p>

          <form action={updateProfileAction} className="mt-4 grid gap-3 sm:grid-cols-2">
            <input name="name" defaultValue={current.name} className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
            <CityInput name="city" defaultValue={current.city} required />
            <input
              name="email"
              defaultValue={current.email ?? ""}
              placeholder="Email"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              name="password"
              type="password"
              placeholder="Новый пароль (необязательно)"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="flex gap-2 sm:col-span-2">
              <button className="rounded-full bg-brand-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-700">
                Сохранить
              </button>
              <Link href="/account" className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600">
                Отмена
              </Link>
            </div>
          </form>
        </section>
      ) : null}

      <section className="mt-6">
        <div className="grid grid-cols-3 rounded-2xl bg-slate-200/60 p-1 text-sm font-bold">
          {tabs.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`rounded-xl px-3 py-2.5 text-center transition ${
                tab === item.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {tab === "ads" ? (
            myAds.length === 0 ? (
              <EmptyState text="У вас пока нет объявлений" href="/create" cta="Подать объявление" />
            ) : (
              <ul className="space-y-3">
                {myAds.map((ad) => (
                <li key={ad.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                  <div>
                    <Link href={`/ad/${ad.id}`} className="font-semibold text-slate-900 hover:text-brand-700">
                      {ad.title}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">
                      {toRub(ad.priceRub)} · {ad.city} · {ad.isActive ? "Активно" : "Скрыто"}
                    </p>
                  </div>
                  <Link href={`/ad/${ad.id}/edit`} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    Редактировать
                  </Link>
                </li>
                ))}
              </ul>
            )
          ) : null}

          {tab === "favorites" ? (
            favoriteAds.length === 0 ? (
              <EmptyState text="В избранном пока пусто" href="/" cta="Смотреть каталог" />
            ) : (
              <ul className="space-y-3">
                {favoriteAds.map((ad) => (
                  <li key={ad.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                    <div>
                      <Link href={`/ad/${ad.id}`} className="font-semibold text-slate-900 hover:text-brand-700">
                        {ad.title}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">
                        {toRub(ad.priceRub)} · {ad.city} · {ad.categoryName}
                      </p>
                    </div>
                    <Heart size={16} className="fill-rose-500 text-rose-500" />
                  </li>
                ))}
              </ul>
            )
          ) : null}

          {tab === "chats" ? (
            chats.length === 0 ? (
              <EmptyState text="Сообщений пока нет" href="/" cta="Найти объявление" />
            ) : (
              <ul className="space-y-3">
                {chats.map((chat) => (
                  <li key={chat.id}>
                    <Link
                      href={`/chat/${chat.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-brand-200 hover:bg-brand-50/40"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{chat.counterpartName}</p>
                        <p className="truncate text-xs text-slate-500">
                          {chat.adTitle}: {chat.lastBody ?? "Новый диалог"}
                        </p>
                      </div>
                      {chat.unread > 0 ? (
                        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white">
                          {chat.unread}
                        </span>
                      ) : (
                        <MessageCircle size={16} className="text-slate-300" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </div>
      </section>
    </main>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        {icon} {label}
      </p>
      <p className="mt-2 truncate text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function EmptyState({ text, href, cta }: { text: string; href: string; cta: string }) {
  return (
    <div className="grid place-items-center py-10 text-center">
      <p className="text-slate-500">{text}</p>
      <Link
        href={href}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-700 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-200 transition hover:shadow-lg"
      >
        <CirclePlus size={16} /> {cta}
      </Link>
    </div>
  );
}
