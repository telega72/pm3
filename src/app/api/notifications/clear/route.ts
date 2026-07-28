import { clearAllNotifications } from "@/lib/notifications";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const current = await getCurrentUser();
  if (!current) return Response.json({ ok: false }, { status: 401 });

  await clearAllNotifications(current.id);
  return Response.json({ ok: true });
}
