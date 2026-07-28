import { db } from "@/db";
import { ads, aiActionLogs, supportTickets, users } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { getSiteConfig } from "@/lib/site-config";

export async function getAdminDashboardData() {
  const [adsCountRow, activeAdsRow, pendingAdsRow, usersCountRow, aiActionsRow] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(ads),
    db.select({ count: sql<number>`count(*)` }).from(ads).where(eq(ads.isActive, true)),
    db.select({ count: sql<number>`count(*)` }).from(ads).where(eq(ads.moderationStatus, "pending")),
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ count: sql<number>`count(*)` }).from(aiActionLogs),
  ]);

  const cfg = getSiteConfig();
  const paidAdPrice = cfg.pricing.paidAdPriceRub;
  const activeCount = Number(activeAdsRow[0]?.count ?? 0);

  const moderationQueue = await db
    .select({
      id: ads.id,
      title: ads.title,
      moderationReason: ads.moderationReason,
      createdAt: ads.createdAt,
      sellerId: ads.sellerId,
    })
    .from(ads)
    .where(eq(ads.moderationStatus, "pending"))
    .orderBy(desc(ads.createdAt))
    .limit(8);

  const openTickets = await db
    .select({ count: sql<number>`count(*)` })
    .from(supportTickets)
    .where(eq(supportTickets.status, "open"));

  return {
    cards: {
      totalAds: Number(adsCountRow[0]?.count ?? 0),
      activeAds: activeCount,
      pendingAds: Number(pendingAdsRow[0]?.count ?? 0),
      users: Number(usersCountRow[0]?.count ?? 0),
      revenueRub: activeCount * paidAdPrice,
      aiActions: Number(aiActionsRow[0]?.count ?? 0),
      openTickets: Number(openTickets[0]?.count ?? 0),
    },
    moderationQueue,
  };
}
