import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const dynamic = "force-dynamic";

function contentTypeByFile(file: string) {
  if (file.endsWith(".webp")) return "image/webp";
  if (file.endsWith(".png")) return "image/png";
  if (file.endsWith(".gif")) return "image/gif";
  if (file.endsWith(".jpg") || file.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

export async function GET(_: Request, context: { params: Promise<{ file: string }> }) {
  const { file } = await context.params;
  if (!/^[a-zA-Z0-9._-]+$/.test(file)) {
    return new Response("Bad file name", { status: 400 });
  }

  const filePath = join(process.cwd(), "storage", "ads", "temp", file);
  if (!existsSync(filePath)) {
    return new Response("Not found", { status: 404 });
  }

  const buffer = readFileSync(filePath);
  return new Response(buffer, {
    headers: {
      "Content-Type": contentTypeByFile(file),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
