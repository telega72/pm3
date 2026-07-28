import Link from "next/link";
import { notFound } from "next/navigation";
import { AdCard } from "@/components/ad-card";
import { CategoryIcon } from "@/components/category-icon";
import { ensureMarketplaceSeed, getCatalogTree, getCategoryByPath, listAds } from "@/lib/marketplace";

export const dynamic = "force-dynamic";

type CategoryPageProps = {
  params: Promise<{ categorySlug: string }>;
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  await ensureMarketplaceSeed();

  const { categorySlug } = await params;
  const category = await getCategoryByPath(categorySlug);

  if (!category) {
    notFound();
  }

  const [catalog, ads] = await Promise.all([getCatalogTree(), listAds({ categorySlug })]);

  const currentRoot = catalog.find((item) => item.slug === categorySlug);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <Link href="/" className="hover:text-blue-700 hover:underline">
          Главная
        </Link>
        <span>→</span>
        <span className="font-medium text-slate-900">{category.name}</span>
      </div>

      <h1 className="flex items-center gap-3 text-3xl font-extrabold text-slate-900">
        <CategoryIcon icon={currentRoot?.icon ?? category.icon} className="h-11 w-11" innerClassName="h-5 w-5" />
        {category.name}
      </h1>

      {currentRoot?.children.length ? (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Подкатегории</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {currentRoot.children.map((sub) => (
              <Link
                key={sub.id}
                href={`/catalog/${categorySlug}/${sub.slug}`}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:border-blue-500 hover:text-blue-700"
              >
                <CategoryIcon icon={sub.icon ?? sub.slug} className="h-8 w-8 rounded-xl" innerClassName="h-4 w-4" />
                {sub.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-7">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Объявления в разделе</h2>

        {ads.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
            В этом разделе пока нет активных объявлений.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ads.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
