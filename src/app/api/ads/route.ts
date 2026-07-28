import { getCurrentUser } from "@/lib/auth";
import { createAdByUser, ensureMarketplaceSeed, listAds } from "@/lib/marketplace";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await ensureMarketplaceSeed();

  const { searchParams } = new URL(request.url);

  const q = searchParams.get("q")?.trim() || undefined;
  const city = searchParams.get("city")?.trim() || undefined;
  const categorySlug = searchParams.get("category")?.trim() || undefined;
  const minPriceRaw = searchParams.get("minPrice");
  const maxPriceRaw = searchParams.get("maxPrice");

  const minPrice = minPriceRaw ? Number(minPriceRaw) : undefined;
  const maxPrice = maxPriceRaw ? Number(maxPriceRaw) : undefined;

  const data = await listAds({
    q,
    city,
    categorySlug,
    minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
  });

  return Response.json({ ok: true, count: data.length, data });
}

export async function POST(request: Request) {
  await ensureMarketplaceSeed();

  const current = await getCurrentUser();
  if (!current) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    title?: string;
    description?: string;
    priceRub?: number;
    city?: string;
    condition?: string;
    categoryId?: number;
  };

  const payload = {
    title: body.title?.trim() ?? "",
    description: body.description?.trim() ?? "",
    priceRub: Number(body.priceRub ?? 0),
    city: body.city?.trim() ?? "",
    condition: body.condition === "new" ? "new" : "used",
    categoryId: Number(body.categoryId ?? 0),
  };

  if (
    !payload.title ||
    !payload.description ||
    !payload.city ||
    !Number.isFinite(payload.priceRub) ||
    payload.priceRub <= 0 ||
    !Number.isFinite(payload.categoryId) ||
    payload.categoryId <= 0
  ) {
    return Response.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const ad = await createAdByUser({
    userId: current.id,
    title: payload.title,
    description: payload.description,
    priceRub: Math.round(payload.priceRub),
    city: payload.city,
    condition: payload.condition,
    categoryId: payload.categoryId,
    imageUrls: [],
    attributes: {},
  });

  return Response.json({ ok: true, id: ad.id }, { status: 201 });
}
