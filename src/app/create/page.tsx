import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdImagesUploader } from "@/components/ad-images-uploader";
import { CategoryAttributesSelector } from "@/components/category-attributes-selector";
import { CityInput } from "@/components/city-input";
import { YandexAddressPicker } from "@/components/yandex-address-picker";
import { getCurrentUser } from "@/lib/auth";
import { createAdByUser, ensureMarketplaceSeed, getCatalogTree } from "@/lib/marketplace";
import { getSiteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

async function createAdAction(formData: FormData) {
  "use server";

  const current = await getCurrentUser();
  if (!current) redirect("/auth/login");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const condition = String(formData.get("condition") ?? "used").trim();
  const categoryId = Number(formData.get("categoryId") ?? 0);
  const priceRub = Number(formData.get("priceRub") ?? 0);
  const imageUrlsJson = String(formData.get("imageUrlsJson") ?? "[]");
  const imageUrls = (() => {
    try {
      const parsed = JSON.parse(imageUrlsJson) as unknown;
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
    } catch {
      return [];
    }
  })();

  const attributesJson = String(formData.get("attributesJson") ?? "{}");
  const attributes = (() => {
    try {
      const parsed = JSON.parse(attributesJson) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {} as Record<string, string>;
      return Object.fromEntries(
        Object.entries(parsed as Record<string, unknown>).map(([k, v]) => [k, String(v ?? "")]),
      ) as Record<string, string>;
    } catch {
      return {} as Record<string, string>;
    }
  })();

  const mapAddress = String(formData.get("mapAddress") ?? "").trim();
  const mapCoords = String(formData.get("mapCoords") ?? "").trim();

  if (mapAddress) {
    attributes.mapAddress = mapAddress;
  }
  if (mapCoords) {
    attributes.mapCoords = mapCoords;
  }

  if (!title || !description || !city || !Number.isFinite(categoryId) || categoryId <= 0 || !Number.isFinite(priceRub) || priceRub <= 0) {
    redirect("/create?error=invalid");
  }

  try {
    const ad = await createAdByUser({
      userId: current.id,
      title,
      description,
      city,
      condition: condition === "new" ? "new" : "used",
      categoryId,
      priceRub: Math.round(priceRub),
      imageUrls,
      attributes,
    });

    revalidatePath("/");
    redirect(`/ad/${ad.id}`);
  } catch {
    redirect("/create?error=quota");
  }
}

type CreatePageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function CreatePage({ searchParams }: CreatePageProps) {
  await ensureMarketplaceSeed();

  const current = await getCurrentUser();
  if (!current) {
    redirect("/auth/login");
  }

  const params = await searchParams;
  const catalog = await getCatalogTree();
  const cfg = getSiteConfig();

  const roots = catalog.map((root) => ({
    id: root.id,
    name: root.name,
    slug: root.slug,
    children: root.children.map((sub) => ({ id: sub.id, name: sub.name, slug: sub.slug })),
  }));

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <Link href="/" className="hover:text-blue-700 hover:underline">
          Главная
        </Link>
        <span>→</span>
        <span className="font-medium text-slate-900">Новое объявление</span>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Разместить объявление</h1>
        <p className="mt-2 text-slate-600">Продавец: {current.name} ({current.phone})</p>
        <p className="mt-1 text-xs text-slate-500">После публикации объявление проверяется ИИ-модератором.</p>

        {params.error ? (
          <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {params.error === "quota"
              ? "Лимит бесплатных объявлений на этот месяц исчерпан для вашей группы."
              : "Проверьте заполнение формы: все поля обязательны."}
          </p>
        ) : null}

        <form action={createAdAction} className="mt-6 grid gap-4">
          <input
            required
            name="title"
            maxLength={cfg.ads.maxTitleLength}
            placeholder="Название объявления"
            className="rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-300 focus:ring"
          />

          <textarea
            required
            name="description"
            rows={5}
            maxLength={cfg.ads.maxDescriptionLength}
            placeholder="Подробное описание"
            className="rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-300 focus:ring"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              required
              type="number"
              min={1}
              name="priceRub"
              placeholder="Цена, ₽"
              className="rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-300 focus:ring"
            />
            <CityInput name="city" defaultValue={current.city} required />
          </div>

           <div className="grid gap-4">
             <CategoryAttributesSelector roots={roots} />

             <select
               name="condition"
               defaultValue="used"
               className="rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-300 focus:ring"
             >
               <option value="used">Б/у</option>
               <option value="new">Новое</option>
             </select>

             <YandexAddressPicker defaultCity={current.city} />
           </div>

          <AdImagesUploader maxCount={cfg.ads.maxImagesCount} maxSizeKb={cfg.ads.maxImageSizeKb} />

          <button
            type="submit"
            className="mt-2 rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800"
          >
            Опубликовать
          </button>
        </form>
      </section>
    </main>
  );
}
