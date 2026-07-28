import { db } from "@/db";
import {
  groupPermissions,
  permissions,
  userGroupMemberships,
  userGroups,
  users,
} from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { hashPassword, normalizePhone } from "@/lib/security";

export async function listUsersAdmin() {
  return db.select().from(users);
}

export async function listGroupsWithPermissions() {
  const groups = await db.select().from(userGroups);
  const allPermissions = await db.select().from(permissions);
  const links = await db.select().from(groupPermissions);

  return groups.map((group) => ({
    ...group,
    permissions: links
      .filter((l) => l.groupId === group.id)
      .map((l) => allPermissions.find((p) => p.id === l.permissionId)?.key)
      .filter(Boolean) as string[],
  }));
}

export async function listAllPermissions() {
  return db.select().from(permissions);
}

export async function createGroup(input: {
  name: string;
  slug: string;
  description?: string;
  permissionIds: number[];
  freeAdsPerMonth: number;
}) {
  const [group] = await db
    .insert(userGroups)
    .values({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      freeAdsPerMonth: input.freeAdsPerMonth,
    })
    .returning();

  if (input.permissionIds.length > 0) {
    await db.insert(groupPermissions).values(input.permissionIds.map((permissionId) => ({ groupId: group.id, permissionId })));
  }

  return group;
}

export async function updateGroupPermissions(groupId: number, permissionIds: number[]) {
  await db.delete(groupPermissions).where(eq(groupPermissions.groupId, groupId));
  if (permissionIds.length > 0) {
    await db.insert(groupPermissions).values(permissionIds.map((permissionId) => ({ groupId, permissionId })));
  }
}

export async function updateGroupFreeLimit(groupId: number, freeAdsPerMonth: number) {
  await db
    .update(userGroups)
    .set({ freeAdsPerMonth: Math.max(0, Math.round(freeAdsPerMonth)) })
    .where(eq(userGroups.id, groupId));
}

export async function assignUserGroups(userId: number, groupIds: number[]) {
  await db.delete(userGroupMemberships).where(eq(userGroupMemberships.userId, userId));
  if (groupIds.length > 0) {
    await db.insert(userGroupMemberships).values(groupIds.map((groupId) => ({ userId, groupId })));
  }
}

export async function getUserWithGroups(userId: number) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  const groups = await db.select().from(userGroups);
  const memberships = await db
    .select()
    .from(userGroupMemberships)
    .where(eq(userGroupMemberships.userId, userId));

  return {
    user,
    groups,
    selectedGroupIds: memberships.map((m) => m.groupId),
  };
}

export async function updateUserByAdmin(input: {
  id: number;
  name: string;
  phone: string;
  city: string;
  email?: string;
  isActive: boolean;
  password?: string;
}) {
  const payload: Partial<typeof users.$inferInsert> = {
    name: input.name,
    phone: normalizePhone(input.phone),
    city: input.city,
    email: input.email?.trim() ? input.email.trim() : null,
    isActive: input.isActive,
    updatedAt: new Date(),
  };

  if (input.password?.trim()) {
    payload.passwordHash = hashPassword(input.password);
  }

  await db.update(users).set(payload).where(eq(users.id, input.id));
}

export async function canUsePhone(phone: string, exceptUserId?: number) {
  const normalized = normalizePhone(phone);
  const rows = await db.select().from(users).where(eq(users.phone, normalized));
  if (!exceptUserId) return rows.length === 0;
  return rows.every((u) => u.id === exceptUserId);
}

export async function getUserGroupIdsMap(userIds: number[]) {
  if (userIds.length === 0) return new Map<number, number[]>();

  const memberships = await db
    .select()
    .from(userGroupMemberships)
    .where(inArray(userGroupMemberships.userId, userIds));

  const map = new Map<number, number[]>();
  for (const m of memberships) {
    const arr = map.get(m.userId) ?? [];
    arr.push(m.groupId);
    map.set(m.userId, arr);
  }
  return map;
}
