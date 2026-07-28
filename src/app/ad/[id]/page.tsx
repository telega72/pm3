import { Heart, MessageCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PhoneReveal } from "@/components/phone-reveal";
import { startChatAction, toggleFavoriteAction } from "@/lib/actions";
import { CategoryIcon } from "@/components/category-icon";
import { YandexMapViewer } from "@/components/yandex-map-viewer";
import { getCurrentUser } from "@/lib/auth";
import { ensureMarketplaceSeed, getAdById, getCatalogTree, listSimilarAdsByCategory, toRub } from "@/lib/marketplace";
import { getFavoriteAdIds } from "@/lib/social";

export const dynamic = "force-dynamic";

type AdPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdPage({ params }: AdPageProps) {
  await ensureMarketplaceSeed();

  const { id } = await params;
  const adId = Number(id);

  if (!Number.isFinite(adId)) {
    notFound();
  }

  const ad = await getAdById(adId);

  if (!ad) {
    notFound();
  }

  const [catalog, similarAds] = await Promise.all([
    getCatalogTree(),
    listSimilarAdsByCategory({ categoryId: ad.categoryId, excludeAdId: ad.id, limit: 6 }),
  ]);

  const current = await getCurrentUser();
  const isOwner = current?.id === ad.sellerId;
  const favoriteIds = current ? await getFavoriteAdIds(current.id) : [];
  const isFavorite = favoriteIds.includes(ad.id);

  const attributes = (() => {
    try {
      return JSON.parse(ad.attributesJson ?? "{}") as Record<string, string>;
    } catch {
      return {} as Record<string, string>;
    }
  })();

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <Link href="/" className="hover:text-blue-700 hover:underline">
          Главная
        </Link>
        <span>→</span>
        <span className="font-medium text-slate-900">{ad.title}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3">
          <nav className="space-y-1">
            {catalog.map((root) => {
              const expanded = root.children.some((sub) => sub.slug === ad.categorySlug);

              return (
                <div key={root.id} className="space-y-1">
                  <Link
                    href={`/?openRoot=${root.slug}`}
                    className={`flex items-center gap-2 rounded-lg px-2 py-2 text-sm ${
                      expanded ? "bg-brand-50 font-semibold text-brand-700" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <CategoryIcon icon={root.icon ?? root.slug} className="h-7 w-7 rounded-lg" innerClassName="h-3.5 w-3.5" />
                    <span className="truncate">{root.name}</span>
                  </Link>

                  {expanded ? (
                    <div className="ml-3 space-y-1 border-l border-slate-200 pl-3">
                      {root.children.map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/?openRoot=${root.slug}&subCategory=${sub.slug}`}
                          className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                            sub.slug === ad.categorySlug
                              ? "bg-slate-100 font-semibold text-slate-900"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <CategoryIcon icon={sub.icon ?? sub.slug} className="h-6 w-6 rounded-md" innerClassName="h-3 w-3" />
                          <span className="truncate">{sub.name}</span>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </aside>

        <div className="space-y-8">
          <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {ad.images.length > 0 ? (
            <div className="mb-5 grid gap-2 sm:grid-cols-2">
              {ad.images.slice(0, 4).map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={`${img.url}-${img.sortOrder}`} src={img.url} alt={ad.title} className="h-52 w-full rounded-2xl object-cover" />
              ))}
            </div>
          ) : null}

          <h1 className="text-3xl font-extrabold text-slate-900">{ad.title}</h1>
          <p className="mt-3 text-4xl font-black text-blue-700">{toRub(ad.priceRub)}</p>

          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
            <span>Город: {ad.city}</span>
            <span>Категория: {ad.categoryName}</span>
            <span>Состояние: {ad.condition === "new" ? "Новое" : "Б/у"}</span>
          </div>

          {Object.keys(attributes).length > 0 ? (
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {Object.entries(attributes)
                .filter(([, value]) => value)
                .map(([key, value]) => (
                  <div key={key} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{key}</p>
                    <p className="mt-1 font-semibold text-slate-800">{value}</p>
                  </div>
                ))}
            </div>
          ) : null}

          <h2 className="mt-8 text-xl font-semibold text-slate-900">Описание</h2>
          <p className="mt-2 whitespace-pre-line text-slate-700">{ad.description}</p>
        </article>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-slate-900">Продавец</h2>
          <p className="mt-3 font-semibold text-slate-800">{ad.sellerName}</p>
          <p className="mt-1 text-sm text-slate-500">{ad.sellerCity}</p>

          <PhoneReveal phone={ad.sellerPhone} canReveal={Boolean(current)} />

          {!isOwner ? (
            <>
              <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                <form action={startChatAction}>
                  <input type="hidden" name="adId" value={String(ad.id)} />
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-700 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-200 transition hover:shadow-lg"
                  >
                    <MessageCircle size={16} /> Написать продавцу
                  </button>
                </form>

                {current ? (
                  <form action={toggleFavoriteAction}>
                    <input type="hidden" name="adId" value={String(ad.id)} />
                    <button
                      type="submit"
                      title="В избранное"
                      className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 transition hover:bg-rose-50"
                    >
                      <Heart size={18} className={isFavorite ? "fill-rose-500 text-rose-500" : "text-slate-400"} />
                    </button>
                  </form>
                ) : null}
              </div>

              <YandexMapViewer city={ad.city} address={attributes.mapAddress} />
            </>
          ) : null}

          <p className="mt-3 text-xs text-slate-400">Безопасная сделка: не переводите предоплату незнакомым людям.</p>
        </aside>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-900">Похожие объявления</h2>
            {similarAds.length === 0 ? (
              <p className="mt-3 text-slate-600">Похожих объявлений пока нет.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {similarAds.map((item) => (
                  <li key={item.id} className="rounded-xl border border-slate-200 p-3">
                    <Link href={`/ad/${item.id}`} className="font-medium text-slate-900 hover:text-blue-700">
                      {item.title}
                    </Link>
                    <p className="mt-1 text-sm text-slate-600">
                      {toRub(item.priceRub)} · {item.city}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-900">Другие объявления продавца</h2>
            {ad.related.length === 0 ? (
              <p className="mt-3 text-slate-600">Пока нет других активных объявлений.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {ad.related.map((item) => (
                  <li key={item.id} className="rounded-xl border border-slate-200 p-3">
                    <Link href={`/ad/${item.id}`} className="font-medium text-slate-900 hover:text-blue-700">
                      {item.title}
                    </Link>
                    <p className="mt-1 text-sm text-slate-600">
                      {toRub(item.priceRub)} · {item.city}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
