"use server";

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { answerSupportQuestion } from "@/lib/ai-assistant";
import { getCurrentUser, signOut } from "@/lib/auth";
import { hashPassword } from "@/lib/security";
import { getOrCreateConversation, sendMessage, toggleFavorite } from "@/lib/social";

export async function toggleFavoriteAction(formData: FormData) {
  const current = await getCurrentUser();
  if (!current) redirect("/auth/login");

  const adId = Number(formData.get("adId") ?? 0);
  if (Number.isFinite(adId) && adId > 0) {
    await toggleFavorite(current.id, adId);
  }

  revalidatePath("/", "layout");
}

export async function startChatAction(formData: FormData) {
  const current = await getCurrentUser();
  if (!current) redirect("/auth/login");

  const adId = Number(formData.get("adId") ?? 0);
  const conversation = await getOrCreateConversation(adId, current.id);
  if (!conversation) redirect(`/ad/${adId}`);

  redirect(`/chat/${conversation.id}`);
}

export async function sendMessageAction(formData: FormData) {
  const current = await getCurrentUser();
  if (!current) redirect("/auth/login");

  const conversationId = Number(formData.get("conversationId") ?? 0);
  const body = String(formData.get("body") ?? "").trim();

  if (conversationId > 0 && body) {
    await sendMessage(conversationId, current.id, body);
  }

  redirect(`/chat/${conversationId}`);
}

export async function uploadAvatarAction(formData: FormData) {
  const current = await getCurrentUser();
  if (!current) redirect("/auth/login");

  const file = formData.get("avatar");
  if (!file || typeof file === "string") redirect("/account");

  const blob = file as File;
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  if (!allowed.includes(blob.type) || blob.size === 0 || blob.size > 2048 * 1024) {
    redirect("/account?error=avatar");
  }

  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };

  const ext = extMap[blob.type] ?? "jpg";
  const dir = join(process.cwd(), "public", "uploads", "avatars");
  mkdirSync(dir, { recursive: true });

  const fileName = `${current.id}.${ext}`;
  const buffer = Buffer.from(await blob.arrayBuffer());
  writeFileSync(join(dir, fileName), buffer);

  await db
    .update(users)
    .set({ avatarUrl: `/uploads/avatars/${fileName}`, updatedAt: new Date() })
    .where(eq(users.id, current.id));

  revalidatePath("/", "layout");
  redirect("/account");
}

export async function updateProfileAction(formData: FormData) {
  const current = await getCurrentUser();
  if (!current) redirect("/auth/login");

  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name || !city) redirect("/account?error=invalid");

  const payload: Partial<typeof users.$inferInsert> = {
    name,
    city,
    email: email || null,
    updatedAt: new Date(),
  };

  if (password) {
    if (password.length < 6) redirect("/account?error=password");
    payload.passwordHash = hashPassword(password);
  }

  await db.update(users).set(payload).where(eq(users.id, current.id));
  revalidatePath("/", "layout");
  redirect("/account?saved=1");
}

export async function signOutAction() {
  "use server";
  await signOut();
  redirect("/");
}

export async function askSupportAction(formData: FormData) {
  const current = await getCurrentUser();
  if (!current) redirect("/auth/login");

  const question = String(formData.get("question") ?? "").trim();
  if (!question) redirect("/support?error=empty");

  const result = await answerSupportQuestion(current.id, question);
  const qp = new URLSearchParams();
  qp.set("reply", result.reply);
  if (result.ticketId) qp.set("ticket", String(result.ticketId));
  redirect(`/support?${qp.toString()}`);
}

export async function setSelectedCityAction(formData: FormData) {
  const city = String(formData.get("selectedCity") ?? "").trim();
  if (!city) return;

  const jar = await cookies();
  jar.set("selected_city", city, { path: "/", httpOnly: false, sameSite: "lax", maxAge: 60 * 60 * 24 * 180 });
  revalidatePath("/", "layout");
}
