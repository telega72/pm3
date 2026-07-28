import { db } from "@/db";
import { ads, aiActionLogs, supportTickets, userGroupMemberships, userGroups, users } from "@/db/schema";
import { and, asc, eq, isNull } from "drizzle-orm";
import { getSiteConfig } from "@/lib/site-config";

const bannedWords = ["обман", "мошен", "поддел", "без документов", "взлом", "наркот"];

export function moderateAdContent(input: { title: string; description: string; priceRub: number }) {
  const text = `${input.title} ${input.description}`.toLowerCase();
  const matchedWord = bannedWords.find((word) => text.includes(word));

  if (matchedWord) {
    return {
      status: "rejected" as const,
      reason: `ИИ-модерация: найден рискованный маркер «${matchedWord}»`,
      confidence: 0.94,
    };
  }

  if (input.priceRub <= 0) {
    return {
      status: "rejected" as const,
      reason: "ИИ-модерация: некорректная цена",
      confidence: 0.9,
    };
  }

  if (input.title.length < 6 || input.description.length < 20) {
    return {
      status: "pending" as const,
      reason: "ИИ-модерация: мало данных, требуется ручная проверка",
      confidence: 0.56,
    };
  }

  return {
    status: "approved" as const,
    reason: "ИИ-модерация: нарушений не найдено",
    confidence: 0.88,
  };
}

export async function runModerationForAd(adId: number) {
  const [ad] = await db.select().from(ads).where(eq(ads.id, adId)).limit(1);
  if (!ad) return;

  const cfg = getSiteConfig();
  if (!cfg.aiAssistant.enabled || !cfg.aiAssistant.autoModeration) return;

  const result = moderateAdContent({
    title: ad.title,
    description: ad.description,
    priceRub: ad.priceRub,
  });

  await db
    .update(ads)
    .set({ moderationStatus: result.status, moderationReason: result.reason, isActive: result.status !== "rejected" })
    .where(eq(ads.id, ad.id));

  await db.insert(aiActionLogs).values({
    actionType: "ad_moderation",
    targetType: "ad",
    targetId: ad.id,
    summary: `${result.status.toUpperCase()} (${Math.round(result.confidence * 100)}%): ${result.reason}`,
  });
}

function supportReplyTemplate(question: string) {
  const q = question.toLowerCase();

  if (q.includes("войти") || q.includes("пароль")) {
    return { confidence: 0.9, text: "Для входа используйте ваш телефон и пароль. Если пароль забыт — откройте «Восстановление пароля» на странице входа." };
  }

  if (q.includes("объявлен") || q.includes("модерац")) {
    return {
      confidence: 0.82,
      text: "Объявления автоматически проверяются ИИ-модератором. Если объявление на ручной проверке, дождитесь решения модератора в админ-панели.",
    };
  }

  if (q.includes("чат") || q.includes("сообщен")) {
    return {
      confidence: 0.86,
      text: "Чат с продавцом открывается из карточки объявления кнопкой «Написать продавцу». История сообщений доступна в личном кабинете во вкладке «Чат».",
    };
  }

  return {
    confidence: 0.3,
    text: "Я не уверен в корректности ответа по вашему вопросу. Создам тикет для оператора поддержки.",
  };
}

async function pickModeratorId() {
  const [moderatorGroup] = await db.select().from(userGroups).where(eq(userGroups.slug, "moderator")).limit(1);
  if (!moderatorGroup) return null;

  const [member] = await db
    .select()
    .from(userGroupMemberships)
    .where(eq(userGroupMemberships.groupId, moderatorGroup.id))
    .limit(1);

  return member?.userId ?? null;
}

export async function answerSupportQuestion(userId: number, question: string) {
  const cfg = getSiteConfig();
  const result = supportReplyTemplate(question);

  let ticketId: number | null = null;

  if (!cfg.aiAssistant.enabled || !cfg.aiAssistant.supportAutoReply || result.confidence < cfg.aiAssistant.ticketThreshold) {
    const moderatorId = await pickModeratorId();

    const [ticket] = await db
      .insert(supportTickets)
      .values({
        userId,
        assignedModeratorId: moderatorId,
        subject: "Эскалация от ИИ-ассистента",
        question,
        aiReply: result.text,
        status: "open",
      })
      .returning({ id: supportTickets.id });

    ticketId = ticket.id;
  }

  await db.insert(aiActionLogs).values({
    actionType: "support_reply",
    targetType: "user",
    targetId: userId,
    summary: ticketId
      ? `Ответ с эскалацией в тикет #${ticketId}`
      : `Ответ без эскалации (confidence ${result.confidence.toFixed(2)})`,
  });

  return {
    reply: result.text,
    confidence: result.confidence,
    ticketId,
  };
}

export async function listAiLogs(limit = 20) {
  return db.select().from(aiActionLogs).orderBy(asc(aiActionLogs.createdAt)).limit(limit);
}

export async function listOpenTickets() {
  return db
    .select({
      id: supportTickets.id,
      subject: supportTickets.subject,
      question: supportTickets.question,
      status: supportTickets.status,
      createdAt: supportTickets.createdAt,
      userName: users.name,
      assignedModeratorId: supportTickets.assignedModeratorId,
    })
    .from(supportTickets)
    .innerJoin(users, eq(supportTickets.userId, users.id))
    .where(eq(supportTickets.status, "open"));
}
