import { cookies } from "next/headers";
import { CirclePlus } from "lucide-react";
import Link from "next/link";
import { CityPicker } from "@/components/city-picker";
import { NotificationsMenu } from "@/components/notifications-menu";
import { UserMenu } from "@/components/user-menu";
import { PERMISSIONS, getCurrentUser } from "@/lib/auth";
import { getHeaderNotifications } from "@/lib/notifications";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const jar = await cookies();
  const selectedCity = jar.get("selected_city")?.value || user?.city || "Москва";
  const notifications = user ? await getHeaderNotifications({ id: user.id, groupSlugs: user.groupSlugs }) : null;
  const isStaff = Boolean(user?.groupSlugs.includes("admin") || user?.groupSlugs.includes("moderator"));

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-base font-extrabold text-white">
              B
            </span>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">Bazaar</span>
          </Link>

          <div className="hidden md:block">
            <CityPicker initialCity={selectedCity} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/create"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 px-4 py-2 text-sm font-bold text-white shadow-md shadow-brand-200"
          >
            <CirclePlus size={16} /> Подать
          </Link>

          {user ? (
            <>
              <NotificationsMenu unreadCount={notifications?.unreadCount ?? 0} items={notifications?.items ?? []} />
              <UserMenu
                name={user.name}
                email={user.email}
                avatarUrl={user.avatarUrl}
                initial={user.name.charAt(0).toUpperCase()}
                isAdmin={isStaff || user.permissions.includes(PERMISSIONS.ADMIN_ACCESS)}
              />
            </>
          ) : (
            <Link href="/auth/login" className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">
              Войти
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
