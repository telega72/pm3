"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { ads, supportTickets } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { answerSupportQuestion } from "@/lib/ai-assistant";
import { getCurrentUser, PERMISSIONS } from "@/lib/auth";
import { getSiteConfig, updateSiteConfig } from "@/lib/site-config";

async function requireAdmin() {
  const user = await getCurrentUser();
  const isStaff = user?.permissions.includes(PERMISSIONS.ADMIN_ACCESS) || user?.groupSlugs.includes("moderator");
  if (!user || !isStaff) redirect("/");
  return user;
}

export async function saveSiteSettingsAction(formData: FormData) {
  await requireAdmin();

  const current = getSiteConfig();

  const next = {
    ...current,
    siteName: String(formData.get("siteName") ?? current.siteName).trim() || current.siteName,
    siteDescription:
      String(formData.get("siteDescription") ?? current.siteDescription).trim() || current.siteDescription,
    pricing: {
      paidAdPriceRub: Number(formData.get("paidAdPriceRub") ?? current.pricing.paidAdPriceRub),
    },
    avatar: {
      maxSizeKb: Number(formData.get("avatarMaxSizeKb") ?? current.avatar.maxSizeKb),
      allowedFormats: String(formData.get("avatarFormats") ?? current.avatar.allowedFormats.join(","))
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    },
    ads: {
      maxTitleLength: Number(formData.get("maxTitleLength") ?? current.ads.maxTitleLength),
      maxDescriptionLength: Number(formData.get("maxDescriptionLength") ?? current.ads.maxDescriptionLength),
      maxImageSizeKb: Number(formData.get("maxImageSizeKb") ?? current.ads.maxImageSizeKb),
      maxImagesCount: Number(formData.get("maxImagesCount") ?? current.ads.maxImagesCount),
      imageCompressionQuality: Number(
        formData.get("imageCompressionQuality") ?? current.ads.imageCompressionQuality,
      ),
    },
    aiAssistant: {
      enabled: String(formData.get("aiEnabled") ?? "") === "on",
      autoModeration: String(formData.get("aiAutoModeration") ?? "") === "on",
      supportAutoReply: String(formData.get("aiSupportAutoReply") ?? "") === "on",
      ticketThreshold: Number(formData.get("ticketThreshold") ?? current.aiAssistant.ticketThreshold),
    },
  };

  updateSiteConfig(next);
  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}

export async function moderateAdAction(formData: FormData) {
  await requireAdmin();

  const adId = Number(formData.get("adId") ?? 0);
  const status = String(formData.get("status") ?? "pending");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!Number.isFinite(adId) || adId <= 0) redirect("/admin/ads");

  await db
    .update(ads)
    .set({
      moderationStatus: status === "approved" || status === "rejected" ? status : "pending",
      moderationReason: reason || null,
      isActive: status !== "rejected",
    })
    .where(eq(ads.id, adId));

  redirect("/admin/ads?saved=1");
}

export async function aiSupportAction(formData: FormData) {
  const user = await requireAdmin();

  const question = String(formData.get("question") ?? "").trim();
  if (!question) redirect("/admin/assistant?error=empty");

  const result = await answerSupportQuestion(user.id, question);

  const qp = new URLSearchParams();
  qp.set("reply", result.reply);
  if (result.ticketId) qp.set("ticket", String(result.ticketId));
  redirect(`/admin/assistant?${qp.toString()}`);
}

export async function closeTicketAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("ticketId") ?? 0);
  if (!id) redirect("/admin/assistant");

  await db.update(supportTickets).set({ status: "closed", updatedAt: new Date() }).where(eq(supportTickets.id, id));
  redirect("/admin/assistant?saved=ticket");
}

export async function assignTicketToMeAction(formData: FormData) {
  const user = await requireAdmin();
  const id = Number(formData.get("ticketId") ?? 0);
  if (!id) redirect("/admin/assistant");

  await db
    .update(supportTickets)
    .set({ assignedModeratorId: user.id, updatedAt: new Date() })
    .where(and(eq(supportTickets.id, id), eq(supportTickets.status, "open")));
  redirect("/admin/assistant?saved=assign");
}
