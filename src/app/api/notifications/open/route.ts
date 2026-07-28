import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { markNotificationRead } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.redirect(new URL("/auth/login", request.url));

  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key")?.trim();
  const href = searchParams.get("href")?.trim() || "/";

  if (key) {
    await markNotificationRead(current.id, key);
  }

  const target = href.startsWith("/") ? href : "/";
  return NextResponse.redirect(new URL(target, request.url));
}
