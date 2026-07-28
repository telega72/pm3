import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdImagesUploader } from "@/components/ad-images-uploader";
import { CategoryAttributesSelector } from "@/components/category-attributes-selector";
import { CityInput } from "@/components/city-input";
import { getCurrentUser } from "@/lib/auth";
import { ensureMarketplaceSeed, getAdForEdit, getCatalogTree, updateAdByUser } from "@/lib/marketplace";
import { getSiteConfig } from "@/lib/site-config";

async function updateAdAction(formData: FormData) {
  "use server";
  const current = await getCurrentUser();
  if (!current) redirect("/auth/login");

  const adId = Number(formData.get("adId") ?? 0);
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const condition = String(formData.get("condition") ?? "used").trim();
  const categoryId = Number(formData.get("categoryId") ?? 0);
  const priceRub = Number(formData.get("priceRub") ?? 0);

  const imageUrls = (() => {
    try {
      const parsed = JSON.parse(String(formData.get("imageUrlsJson") ?? "[]")) as unknown;
      return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
    } catch {
      return [] as string[];
    }
  })();

  const attributes = (() => {
    try {
      const parsed = JSON.parse(String(formData.get("attributesJson") ?? "{}")) as unknown;
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (Object.fromEntries(
            Object.entries(parsed as Record<string, unknown>).map(([k, v]) => [k, String(v ?? "")]),
          ) as Record<string, string>)
        : {};
    } catch {
      return {} as Record<string, string>;
    }
  })();

  if (!adId || !title || !description || !city || !categoryId || !priceRub) redirect(`/ad/${adId}/edit?error=1`);

  await updateAdByUser({
    adId,
    userId: current.id,
    title,
    description,
    city,
    condition: condition === "new" ? "new" : "used",
    categoryId,
    priceRub: Math.round(priceRub),
    attributes,
    imageUrls,
  });

  revalidatePath(`/ad/${adId}`);
  redirect(`/ad/${adId}`);
}

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };

export default async function EditAdPage({ params, searchParams }: Props) {
  await ensureMarketplaceSeed();
  const current = await getCurrentUser();
  if (!current) redirect("/auth/login");

  const { id } = await params;
  const adId = Number(id);
  if (!Number.isFinite(adId)) notFound();

  const data = await getAdForEdit(adId, current.id);
  if (!data) notFound();

  const cfg = getSiteConfig();
  const catalog = await getCatalogTree();
  const roots = catalog.map((root) => ({
    id: root.id,
    name: root.name,
    slug: root.slug,
    children: root.children.map((sub) => ({ id: sub.id, name: sub.name, slug: sub.slug })),
  }));

  const attrs = (() => {
    try {
      return JSON.parse(data.ad.attributesJson ?? "{}") as Record<string, string>;
    } catch {
      return {} as Record<string, string>;
    }
  })();

  const rootSlug = catalog.find((r) => r.children.some((s) => s.id === data.ad.categoryId))?.slug;
  const sp = await searchParams;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-4 text-sm text-slate-500"><Link href={`/ad/${adId}`}>← К объявлению</Link></div>
      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-extrabold">Редактировать объявление</h1>
        {sp.error ? <p className="mt-2 text-sm text-rose-600">Проверьте заполнение формы</p> : null}

        <form action={updateAdAction} className="mt-4 grid gap-4">
          <input type="hidden" name="adId" value={String(adId)} />
          <input name="title" defaultValue={data.ad.title} maxLength={cfg.ads.maxTitleLength} className="rounded-xl border border-slate-300 px-3 py-2" />
          <textarea name="description" defaultValue={data.ad.description} maxLength={cfg.ads.maxDescriptionLength} rows={5} className="rounded-xl border border-slate-300 px-3 py-2" />
          <div className="grid gap-3 sm:grid-cols-2">
            <input type="number" min={1} name="priceRub" defaultValue={String(data.ad.priceRub)} className="rounded-xl border border-slate-300 px-3 py-2" />
            <CityInput name="city" defaultValue={data.ad.city} required />
          </div>

          <CategoryAttributesSelector
            roots={roots}
            defaultRootSlug={rootSlug}
            defaultSubId={data.ad.categoryId}
            defaultAttributes={attrs}
          />

          <select name="condition" defaultValue={data.ad.condition} className="rounded-xl border border-slate-300 px-3 py-2">
            <option value="used">Б/у</option>
            <option value="new">Новое</option>
          </select>

          <AdImagesUploader maxCount={cfg.ads.maxImagesCount} maxSizeKb={cfg.ads.maxImageSizeKb} />
          <button className="rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white">Сохранить</button>
        </form>
      </section>
    </main>
  );
}
