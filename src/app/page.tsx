import { cookies } from "next/headers";
import { Heart } from "lucide-react";
import Link from "next/link";
import { HomePageControls } from "@/components/home-page-controls";
import { getAttributesForSlug } from "@/lib/ad-attributes";
import { toggleFavoriteAction } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth";
import { ensureMarketplaceSeed, getCatalogTree, listAds, toRub } from "@/lib/marketplace";
import { getFavoriteAdIds } from "@/lib/social";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  await ensureMarketplaceSeed();

  const params = await searchParams;
  const current = await getCurrentUser();
  const jar = await cookies();

  const q = params.q?.trim();
  const city = jar.get("selected_city")?.value || current?.city || params.city?.trim() || undefined;
  const minPrice = params.minPrice ? Number(params.minPrice) : undefined;
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined;
  const openRootSlug = params.openRoot?.trim();
  const subSlug = params.subCategory?.trim();
  const sortRaw = params.sort?.trim();
  const sort = sortRaw === "cheap" || sortRaw === "expensive" || sortRaw === "popular" ? sortRaw : "new";

  const catalog = await getCatalogTree();
  const selectedRoot = subSlug
    ? catalog.find((root) => root.children.some((child) => child.slug === subSlug))
    : catalog.find((root) => root.slug === openRootSlug);
  const selectedSub = selectedRoot?.children.find((s) => s.slug === subSlug);
  const attrFields = selectedSub ? getAttributesForSlug(selectedSub.slug) : [];

  const initialAttrValues = Object.fromEntries(
    attrFields.map((field) => [field.key, String(params[`attr_${field.key}`] ?? "")]),
  );

  const attrFilters = Object.fromEntries(
    attrFields.map((field) => [field.key, params[`attr_${field.key}`]?.trim() || undefined]),
  );

  const ads = await listAds({
    q,
    city,
    minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
    categorySlug: selectedSub?.slug,
    sort,
    attributes: attrFilters,
  });

  const favoriteIds = current ? await getFavoriteAdIds(current.id) : [];

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-4">
      <HomePageControls
        catalog={catalog}
        initialOpenRootSlug={openRootSlug}
        initialSubSlug={subSlug}
        initialSort={sort}
        initialQ={q}
        initialMinPrice={params.minPrice}
        initialMaxPrice={params.maxPrice}
        initialAttrValues={initialAttrValues}
      >
        {ads.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">Ничего не найдено.</div>
        ) : (
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {ads.map((ad) => {
              const isFavorite = favoriteIds.includes(ad.id);

              return (
                <article key={ad.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="relative h-44 bg-gradient-to-br from-slate-100 to-slate-200">
                    <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-xs font-semibold text-slate-700">
                      Бесплатно
                    </span>

                    {current ? (
                      <form action={toggleFavoriteAction} className="absolute right-2 top-2">
                        <input type="hidden" name="adId" value={String(ad.id)} />
                        <button
                          type="submit"
                          className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-slate-500"
                          title={isFavorite ? "Убрать из избранного" : "В избранное"}
                        >
                          <Heart size={16} className={isFavorite ? "fill-rose-500 text-rose-500" : ""} />
                        </button>
                      </form>
                    ) : null}
                  </div>

                  <div className="p-3">
                    <Link href={`/ad/${ad.id}`} className="line-clamp-1 text-base font-semibold text-slate-900 hover:text-brand-700">
                      {ad.title}
                    </Link>
                    <p className="mt-1 text-lg font-extrabold text-slate-900">{toRub(ad.priceRub)}</p>
                    <p className="mt-1 text-xs text-slate-500">{ad.city} • {ad.categoryName}</p>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </HomePageControls>
    </main>
  );
}
