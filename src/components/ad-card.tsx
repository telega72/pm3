import { Heart } from "lucide-react";
import Link from "next/link";
import type { AdListItem } from "@/lib/marketplace";
import { toRub } from "@/lib/marketplace";
import { toggleFavoriteAction } from "@/lib/actions";

type AdCardProps = {
  ad: AdListItem;
  isFavorite?: boolean;
  canFavorite?: boolean;
};

export function AdCard({ ad, isFavorite = false, canFavorite = false }: AdCardProps) {
  return (
    <article className="group relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-100/60">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold leading-snug text-slate-900">
          <Link href={`/ad/${ad.id}`} className="transition hover:text-brand-700">
            {ad.title}
          </Link>
        </h3>

        {canFavorite ? (
          <form action={toggleFavoriteAction}>
            <input type="hidden" name="adId" value={String(ad.id)} />
            <button
              type="submit"
              title={isFavorite ? "Убрать из избранного" : "В избранное"}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full transition hover:bg-rose-50"
            >
              <Heart
                size={18}
                className={isFavorite ? "fill-rose-500 text-rose-500" : "text-slate-400 transition group-hover:text-rose-400"}
              />
            </button>
          </form>
        ) : null}
      </div>

      <p className="text-xl font-extrabold tracking-tight text-slate-900">{toRub(ad.priceRub)}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
        <span>{ad.city}</span>
        <span className="text-slate-300">•</span>
        <span>{ad.categoryName}</span>
      </div>

      <p className="mt-3 text-xs font-medium text-slate-400">Продавец: {ad.sellerName}</p>
    </article>
  );
}
