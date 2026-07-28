import Link from "next/link";
import { notFound } from "next/navigation";
import { AdCard } from "@/components/ad-card";
import { CategoryIcon } from "@/components/category-icon";
import { ensureMarketplaceSeed, getCategoryByPath, listAds } from "@/lib/marketplace";

export const dynamic = "force-dynamic";

type SubCategoryPageProps = {
  params: Promise<{ categorySlug: string; subSlug: string }>;
};

export default async function SubCategoryPage({ params }: SubCategoryPageProps) {
  await ensureMarketplaceSeed();

  const { categorySlug, subSlug } = await params;
  const category = await getCategoryByPath(categorySlug, subSlug);

  if (!category) {
    notFound();
  }

  const ads = await listAds({ categorySlug: subSlug });

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <Link href="/" className="hover:text-blue-700 hover:underline">
          Главная
        </Link>
        <span>→</span>
        <Link href={`/catalog/${categorySlug}`} className="hover:text-blue-700 hover:underline">
          {categorySlug}
        </Link>
        <span>→</span>
        <span className="font-medium text-slate-900">{category.name}</span>
      </div>

      <h1 className="flex items-center gap-3 text-3xl font-extrabold text-slate-900">
        <CategoryIcon icon={category.icon ?? subSlug} className="h-11 w-11" innerClassName="h-5 w-5" />
        {category.name}
      </h1>
      <p className="mt-2 text-slate-600">Точные объявления внутри выбранной подкатегории.</p>

      <section className="mt-7">
        {ads.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
            В этой подкатегории пока нет объявлений.
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
