import { moderateAdAction } from "@/lib/admin-actions";
import { listModerationAds, toRub } from "@/lib/marketplace";

type Props = { searchParams: Promise<{ saved?: string }> };

export default async function AdminAdsPage({ searchParams }: Props) {
  const [ads, params] = await Promise.all([listModerationAds(), searchParams]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5">
      <h1 className="text-3xl font-extrabold text-slate-900">Управление объявлениями</h1>
      <p className="mt-1 text-sm text-slate-500">Ручная модерация и контроль статусов объявлений.</p>
      {params.saved ? <p className="mt-2 text-xs text-emerald-600">Статус сохранён</p> : null}

      <ul className="mt-4 space-y-3">
        {ads.map((ad) => (
          <li key={ad.id} id={`ad-${ad.id}`} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold text-slate-900">{ad.title}</p>
                <p className="text-xs text-slate-500">
                  {ad.sellerName} · {ad.city} · {toRub(ad.priceRub)}
                </p>
                <p className="mt-1 text-xs text-slate-500">Причина: {ad.moderationReason ?? "—"}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">{ad.moderationStatus}</span>
            </div>

            <form action={moderateAdAction} className="mt-3 grid gap-2 sm:grid-cols-[180px_1fr_auto]">
              <input type="hidden" name="adId" value={String(ad.id)} />
              <select name="status" defaultValue={ad.moderationStatus} className="rounded-xl border border-slate-300 px-2 py-2 text-sm">
                <option value="approved">approved</option>
                <option value="pending">pending</option>
                <option value="rejected">rejected</option>
              </select>
              <input
                name="reason"
                placeholder="Комментарий модератора"
                defaultValue={ad.moderationReason ?? ""}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <button className="rounded-full bg-brand-600 px-4 py-2 text-xs font-bold text-white">Сохранить</button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
