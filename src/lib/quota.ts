import { db } from "@/db";
import { userGroupMemberships, userGroups, userMonthlyAdQuota } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

function firstDayOfMonth(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0));
}

export async function resolveUserMonthlyLimit(userId: number) {
  const memberships = await db
    .select({ groupId: userGroupMemberships.groupId })
    .from(userGroupMemberships)
    .where(eq(userGroupMemberships.userId, userId));

  const groupIds = memberships.map((m) => m.groupId);
  if (groupIds.length === 0) return 0;

  const groups = await db
    .select({ freeAdsPerMonth: userGroups.freeAdsPerMonth })
    .from(userGroups)
    .where(inArray(userGroups.id, groupIds));

  return groups.reduce((max, g) => Math.max(max, g.freeAdsPerMonth), 0);
}

export async function getOrRefreshMonthlyQuota(userId: number) {
  const period = firstDayOfMonth();
  const limit = await resolveUserMonthlyLimit(userId);

  const [current] = await db
    .select()
    .from(userMonthlyAdQuota)
    .where(and(eq(userMonthlyAdQuota.userId, userId), eq(userMonthlyAdQuota.periodStart, period)))
    .limit(1);

  if (current) {
    if (current.freeLimit !== limit) {
      await db
        .update(userMonthlyAdQuota)
        .set({ freeLimit: limit, updatedAt: new Date() })
        .where(eq(userMonthlyAdQuota.id, current.id));
      return { ...current, freeLimit: limit };
    }

    return current;
  }

  const [created] = await db
    .insert(userMonthlyAdQuota)
    .values({ userId, periodStart: period, usedCount: 0, freeLimit: limit, updatedAt: new Date() })
    .returning();

  return created;
}

export async function consumeFreeAdQuota(userId: number) {
  const quota = await getOrRefreshMonthlyQuota(userId);
  if (quota.usedCount >= quota.freeLimit) {
    return { ok: false as const, quota };
  }

  await db
    .update(userMonthlyAdQuota)
    .set({ usedCount: quota.usedCount + 1, updatedAt: new Date() })
    .where(eq(userMonthlyAdQuota.id, quota.id));

  return {
    ok: true as const,
    quota: { ...quota, usedCount: quota.usedCount + 1 },
  };
}
