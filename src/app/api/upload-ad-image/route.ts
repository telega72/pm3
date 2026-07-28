import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { getCurrentUser } from "@/lib/auth";
import { getSiteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const current = await getCurrentUser();
  if (!current) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") {
    return Response.json({ ok: false, error: "no_file" }, { status: 400 });
  }

  const cfg = getSiteConfig();
  const blob = file as File;
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  if (!allowed.includes(blob.type)) {
    return Response.json({ ok: false, error: "invalid_format" }, { status: 400 });
  }

  if (blob.size > cfg.ads.maxImageSizeKb * 1024) {
    return Response.json({ ok: false, error: "file_too_large" }, { status: 400 });
  }

  const sourceBuffer = Buffer.from(await blob.arrayBuffer());
  const dir = join(process.cwd(), "storage", "ads", "temp");
  mkdirSync(dir, { recursive: true });

  const id = `${current.id}-${Date.now()}-${Math.round(Math.random() * 1e6)}`;

  if (blob.type === "image/gif") {
    const fileName = `${id}.gif`;
    writeFileSync(join(dir, fileName), sourceBuffer);
    return Response.json({ ok: true, url: `/api/upload-ad-image/${fileName}` });
  }

  const image = sharp(sourceBuffer).rotate();
  const meta = await image.metadata();
  const widthLimit = 2200;

  let pipeline = image;
  if ((meta.width ?? 0) > widthLimit) {
    pipeline = pipeline.resize({ width: widthLimit, withoutEnlargement: true });
  }

  const fileName = `${id}.webp`;
  const compressed = await pipeline.webp({ quality: cfg.ads.imageCompressionQuality }).toBuffer();
  writeFileSync(join(dir, fileName), compressed);

  return Response.json({
    ok: true,
    url: `/api/upload-ad-image/${fileName}`,
    width: meta.width ?? null,
    height: meta.height ?? null,
  });
}
