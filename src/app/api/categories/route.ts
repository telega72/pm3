import { ensureMarketplaceSeed, getCatalogTree } from "@/lib/marketplace";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureMarketplaceSeed();
  const catalog = await getCatalogTree();

  return Response.json({
    ok: true,
    count: catalog.length,
    data: catalog,
  });
}
