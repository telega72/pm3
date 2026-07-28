import { db } from "@/db";
import {
  ads,
  chatMessages,
  conversations,
  supportTickets,
  userNotificationReads,
  userNotificationStates,
} from "@/db/schema";
import { and, desc, eq, ne, or, sql } from "drizzle-orm";

export type HeaderNotification = {
  key: string;
  title: string;
  subtitle: string;
  href: string;
  kind: "message" | "ad-status" | "ticket" | "moderation";
  createdAt: Date;
};

async function getLastClearedAt(userId: number) {
  const [row] = await db.select().from(userNotificationStates).where(eq(userNotificationStates.userId, userId)).limit(1);
  if (!row) {
    const [created] = await db
      .insert(userNotificationStates)
      .values({ userId, lastClearedAt: new Date(0) })
      .returning();
    return created.lastClearedAt;
  }
  return row.lastClearedAt;
}

export async function markNotificationRead(userId: number, notificationKey: string) {
  await db.insert(userNotificationReads).values({ userId, notificationKey }).onConflictDoNothing();
}

export async function clearAllNotifications(userId: number) {
  const now = new Date();
  const [existing] = await db.select().from(userNotificationStates).where(eq(userNotificationStates.userId, userId)).limit(1);

  if (existing) {
    await db
      .update(userNotificationStates)
      .set({ lastClearedAt: now })
      .where(eq(userNotificationStates.userId, userId));
  } else {
    await db.insert(userNotificationStates).values({ userId, lastClearedAt: now });
  }
}

export async function getHeaderNotifications(user: {
  id: number;
  groupSlugs: string[];
}): Promise<{ unreadCount: number; items: HeaderNotification[] }> {
  const items: HeaderNotification[] = [];

  const convRows = await db
    .select({
      id: conversations.id,
      buyerId: conversations.buyerId,
      sellerId: conversations.sellerId,
      adId: conversations.adId,
      createdAt: conversations.createdAt,
    })
    .from(conversations)
    .where(or(eq(conversations.buyerId, user.id), eq(conversations.sellerId, user.id)))
    .orderBy(desc(conversations.createdAt))
    .limit(12);

  for (const conv of convRows) {
    const [last] = await db
      .select({ body: chatMessages.body, createdAt: chatMessages.createdAt, senderId: chatMessages.senderId })
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conv.id))
      .orderBy(desc(chatMessages.createdAt))
      .limit(1);

    if (last && last.senderId !== user.id) {
      items.push({
        key: `msg-${conv.id}-${last.createdAt.toISOString()}`,
        title: "Новое сообщение в чате",
        subtitle: last.body,
        href: `/chat/${conv.id}`,
        kind: "message",
        createdAt: last.createdAt,
      });
    }
  }

  const myAds = await db
    .select({
      id: ads.id,
      title: ads.title,
      moderationStatus: ads.moderationStatus,
      moderationReason: ads.moderationReason,
      createdAt: ads.createdAt,
    })
    .from(ads)
    .where(and(eq(ads.sellerId, user.id), ne(ads.moderationStatus, "pending")))
    .orderBy(desc(ads.createdAt))
    .limit(10);

  for (const ad of myAds) {
    items.push({
      key: `ad-${ad.id}-${ad.moderationStatus}`,
      title: `Статус объявления: ${ad.moderationStatus}`,
      subtitle: `${ad.title}${ad.moderationReason ? ` — ${ad.moderationReason}` : ""}`,
      href: `/ad/${ad.id}`,
      kind: "ad-status",
      createdAt: ad.createdAt,
    });
  }

  const isStaff = user.groupSlugs.includes("admin") || user.groupSlugs.includes("moderator");
  if (isStaff) {
    const [openTicketsRow, pendingAdsRow] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(supportTickets).where(eq(supportTickets.status, "open")),
      db.select({ count: sql<number>`count(*)` }).from(ads).where(eq(ads.moderationStatus, "pending")),
    ]);

    const openTickets = Number(openTicketsRow[0]?.count ?? 0);
    const pendingAds = Number(pendingAdsRow[0]?.count ?? 0);

    if (openTickets > 0) {
      items.push({
        key: `tickets-${openTickets}`,
        title: `Новые тикеты: ${openTickets}`,
        subtitle: "Пользователи ждут ответа",
        href: "/admin/assistant",
        kind: "ticket",
        createdAt: new Date(),
      });
    }

    if (pendingAds > 0) {
      items.push({
        key: `moderation-${pendingAds}`,
        title: `Новые объявления на модерации: ${pendingAds}`,
        subtitle: "Требуется проверка",
        href: "/admin/ads",
        kind: "moderation",
        createdAt: new Date(),
      });
    }
  }

  const [reads, lastClearedAt] = await Promise.all([
    db.select({ key: userNotificationReads.notificationKey }).from(userNotificationReads).where(eq(userNotificationReads.userId, user.id)),
    getLastClearedAt(user.id),
  ]);

  const readSet = new Set(reads.map((r) => r.key));

  const filtered = items
    .filter((item) => item.createdAt > lastClearedAt)
    .filter((item) => !readSet.has(item.key))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 20);

  return {
    unreadCount: filtered.length,
    items: filtered,
  };
}
