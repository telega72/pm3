import { db } from "@/db";
import { ads, categories, chatMessages, conversations, favorites, supportTickets, users } from "@/db/schema";
import { and, asc, desc, eq, ne, or, sql } from "drizzle-orm";

export async function toggleFavorite(userId: number, adId: number) {
  const [existing] = await db
    .select()
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.adId, adId)))
    .limit(1);

  if (existing) {
    await db.delete(favorites).where(eq(favorites.id, existing.id));
    return false;
  }

  await db.insert(favorites).values({ userId, adId });
  return true;
}

export async function getFavoriteAdIds(userId: number): Promise<number[]> {
  const rows = await db
    .select({ adId: favorites.adId })
    .from(favorites)
    .where(eq(favorites.userId, userId));
  return rows.map((row) => row.adId);
}

export async function listFavoriteAds(userId: number) {
  return db
    .select({
      id: ads.id,
      title: ads.title,
      priceRub: ads.priceRub,
      city: ads.city,
      isActive: ads.isActive,
      categoryName: categories.name,
      createdAt: ads.createdAt,
    })
    .from(favorites)
    .innerJoin(ads, eq(favorites.adId, ads.id))
    .innerJoin(categories, eq(ads.categoryId, categories.id))
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));
}

export async function getOrCreateConversation(adId: number, buyerId: number) {
  const [ad] = await db
    .select({ id: ads.id, sellerId: ads.sellerId })
    .from(ads)
    .where(eq(ads.id, adId))
    .limit(1);

  if (!ad || ad.sellerId === buyerId) return null;

  let [conversation] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.adId, adId), eq(conversations.buyerId, buyerId)))
    .limit(1);

  if (!conversation) {
    [conversation] = await db
      .insert(conversations)
      .values({ adId, buyerId, sellerId: ad.sellerId })
      .returning();
  }

  return conversation;
}

export type ConversationListItem = {
  id: number;
  adId: number;
  adTitle: string;
  counterpartName: string;
  lastBody: string | null;
  lastAt: Date | null;
  unread: number;
};

export async function listConversations(userId: number): Promise<ConversationListItem[]> {
  const rows = await db
    .select()
    .from(conversations)
    .where(or(eq(conversations.buyerId, userId), eq(conversations.sellerId, userId)))
    .orderBy(desc(conversations.createdAt));

  const result: ConversationListItem[] = [];

  for (const conv of rows) {
    const [ad] = await db.select({ title: ads.title }).from(ads).where(eq(ads.id, conv.adId)).limit(1);
    const counterpartId = conv.buyerId === userId ? conv.sellerId : conv.buyerId;
    const [counterpart] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, counterpartId))
      .limit(1);

    const [last] = await db
      .select({ body: chatMessages.body, createdAt: chatMessages.createdAt })
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conv.id))
      .orderBy(desc(chatMessages.createdAt))
      .limit(1);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.conversationId, conv.id),
          ne(chatMessages.senderId, userId),
          eq(chatMessages.isRead, false),
        ),
      );

    result.push({
      id: conv.id,
      adId: conv.adId,
      adTitle: ad?.title ?? "Объявление",
      counterpartName: counterpart?.name ?? "Пользователь",
      lastBody: last?.body ?? null,
      lastAt: last?.createdAt ?? conv.createdAt,
      unread: Number(count ?? 0),
    });
  }

  return result;
}

export async function getConversationForUser(conversationId: number, userId: number) {
  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!conv || (conv.buyerId !== userId && conv.sellerId !== userId)) return null;

  const [ad] = await db.select({ id: ads.id, title: ads.title }).from(ads).where(eq(ads.id, conv.adId)).limit(1);

  const counterpartId = conv.buyerId === userId ? conv.sellerId : conv.buyerId;
  const [counterpart] = await db
    .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, counterpartId))
    .limit(1);

  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conv.id))
    .orderBy(asc(chatMessages.createdAt));

  await db
    .update(chatMessages)
    .set({ isRead: true })
    .where(and(eq(chatMessages.conversationId, conv.id), ne(chatMessages.senderId, userId)));

  return { conversation: conv, ad, counterpart, messages };
}

export async function sendMessage(conversationId: number, senderId: number, body: string) {
  await db.insert(chatMessages).values({ conversationId, senderId, body });
}

export async function countUnreadMessages(userId: number): Promise<number> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(chatMessages)
    .innerJoin(conversations, eq(chatMessages.conversationId, conversations.id))
    .where(
      and(
        or(eq(conversations.buyerId, userId), eq(conversations.sellerId, userId)),
        ne(chatMessages.senderId, userId),
        eq(chatMessages.isRead, false),
      ),
    );

  return Number(count ?? 0);
}

export type HeaderNotification = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  kind: "message" | "ad-status" | "ticket" | "moderation";
};

export async function getHeaderNotifications(user: {
  id: number;
  groupSlugs: string[];
}): Promise<{ unreadCount: number; items: HeaderNotification[] }> {
  const items: HeaderNotification[] = [];

  const conversationsData = await listConversations(user.id);
  const unreadConversations = conversationsData.filter((c) => c.unread > 0).slice(0, 4);

  for (const c of unreadConversations) {
    items.push({
      id: `msg-${c.id}`,
      title: `Новое сообщение от ${c.counterpartName}`,
      subtitle: c.lastBody ?? "Откройте диалог",
      href: `/chat/${c.id}`,
      kind: "message",
    });
  }

  const myAds = await db
    .select({ id: ads.id, title: ads.title, moderationStatus: ads.moderationStatus, moderationReason: ads.moderationReason })
    .from(ads)
    .where(and(eq(ads.sellerId, user.id), ne(ads.moderationStatus, "pending")))
    .orderBy(desc(ads.createdAt))
    .limit(4);

  for (const ad of myAds) {
    items.push({
      id: `ad-${ad.id}`,
      title: `Статус объявления: ${ad.moderationStatus}`,
      subtitle: `${ad.title}${ad.moderationReason ? ` — ${ad.moderationReason}` : ""}`,
      href: `/ad/${ad.id}`,
      kind: "ad-status",
    });
  }

  const isStaff = user.groupSlugs.includes("admin") || user.groupSlugs.includes("moderator");
  let staffExtraCount = 0;

  if (isStaff) {
    const [openTicketsRow, pendingAdsRow] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(supportTickets).where(eq(supportTickets.status, "open")),
      db.select({ count: sql<number>`count(*)` }).from(ads).where(eq(ads.moderationStatus, "pending")),
    ]);

    const openTickets = Number(openTicketsRow[0]?.count ?? 0);
    const pendingAds = Number(pendingAdsRow[0]?.count ?? 0);
    staffExtraCount = openTickets + pendingAds;

    if (openTickets > 0) {
      items.push({
        id: "staff-tickets",
        title: `Новые тикеты: ${openTickets}`,
        subtitle: "Пользователи ждут ответа",
        href: "/admin/assistant",
        kind: "ticket",
      });
    }

    if (pendingAds > 0) {
      items.push({
        id: "staff-moderation",
        title: `Новые объявления на модерации: ${pendingAds}`,
        subtitle: "Требуется проверка",
        href: "/admin/ads",
        kind: "moderation",
      });
    }
  }

  const unreadCount = unreadConversations.reduce((sum, c) => sum + c.unread, 0) + staffExtraCount;

  return {
    unreadCount,
    items: items.slice(0, 12),
  };
}
