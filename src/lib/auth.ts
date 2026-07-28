import { cookies, headers } from "next/headers";
import { db } from "@/db";
import {
  groupPermissions,
  passwordResetTokens,
  permissions,
  sessions,
  userGroupMemberships,
  userGroups,
  users,
} from "@/db/schema";
import { and, eq, gt, inArray, isNull } from "drizzle-orm";
import { getSiteConfig } from "@/lib/site-config";
import { generateToken, hashPassword, hashToken, normalizePhone, verifyPassword } from "@/lib/security";

const SESSION_COOKIE = "session_token";

export const PERMISSIONS = {
  ADMIN_ACCESS: "admin.access",
  USERS_MANAGE: "users.manage",
  GROUPS_MANAGE: "groups.manage",
  ADS_MANAGE: "ads.manage",
} as const;

export async function ensureAuthSeed() {
  const existingPermissions = await db.select().from(permissions);
  if (existingPermissions.length === 0) {
    await db.insert(permissions).values([
      { key: PERMISSIONS.ADMIN_ACCESS, label: "Доступ в админ-панель" },
      { key: PERMISSIONS.USERS_MANAGE, label: "Управление пользователями" },
      { key: PERMISSIONS.GROUPS_MANAGE, label: "Управление группами" },
      { key: PERMISSIONS.ADS_MANAGE, label: "Управление объявлениями" },
    ]);
  }

  const groups = await db.select().from(userGroups);
  let adminGroup = groups.find((g) => g.slug === "admin");
  let userGroup = groups.find((g) => g.slug === "user");

  if (!adminGroup) {
    [adminGroup] = await db
      .insert(userGroups)
      .values({ name: "Администраторы", slug: "admin", description: "Полный доступ" })
      .returning();
  }

  if (!userGroup) {
    [userGroup] = await db
      .insert(userGroups)
      .values({ name: "Пользователи", slug: "user", description: "Базовые пользователи" })
      .returning();
  }

  let moderatorGroup = groups.find((g) => g.slug === "moderator");
  if (!moderatorGroup) {
    [moderatorGroup] = await db
      .insert(userGroups)
      .values({ name: "Модераторы", slug: "moderator", description: "Модерация объявлений" })
      .returning();
  }

  const allPermissions = await db.select().from(permissions);
  const adminPermissionIds = allPermissions.map((p) => p.id);

  const existingAdminLinks = await db
    .select()
    .from(groupPermissions)
    .where(eq(groupPermissions.groupId, adminGroup.id));

  const existsSet = new Set(existingAdminLinks.map((x) => x.permissionId));
  const missing = adminPermissionIds.filter((id) => !existsSet.has(id));

  if (missing.length > 0) {
    await db.insert(groupPermissions).values(missing.map((permissionId) => ({ groupId: adminGroup.id, permissionId })));
  }

  const adsPermission = allPermissions.find((p) => p.key === PERMISSIONS.ADS_MANAGE);
  if (adsPermission && moderatorGroup) {
    const existingMod = await db
      .select()
      .from(groupPermissions)
      .where(
        and(eq(groupPermissions.groupId, moderatorGroup.id), eq(groupPermissions.permissionId, adsPermission.id)),
      );
    if (existingMod.length === 0) {
      await db
        .insert(groupPermissions)
        .values({ groupId: moderatorGroup.id, permissionId: adsPermission.id });
    }
  }

  const cfg = getSiteConfig();
  const adminPhone = normalizePhone(cfg.defaultAdmin.phone);

  let [admin] = await db.select().from(users).where(eq(users.phone, adminPhone)).limit(1);

  if (!admin) {
    [admin] = await db
      .insert(users)
      .values({
        name: cfg.defaultAdmin.name,
        phone: adminPhone,
        city: cfg.defaultAdmin.city,
        email: cfg.defaultAdmin.email,
        passwordHash: hashPassword(cfg.defaultAdmin.password),
      })
      .returning();
  }

  const memberRows = await db
    .select()
    .from(userGroupMemberships)
    .where(and(eq(userGroupMemberships.userId, admin.id), eq(userGroupMemberships.groupId, adminGroup.id)));

  if (memberRows.length === 0) {
    await db.insert(userGroupMemberships).values({ userId: admin.id, groupId: adminGroup.id });
  }

  if (userGroup) {
    const userMember = await db
      .select()
      .from(userGroupMemberships)
      .where(and(eq(userGroupMemberships.userId, admin.id), eq(userGroupMemberships.groupId, userGroup.id)));

    if (userMember.length === 0) {
      await db.insert(userGroupMemberships).values({ userId: admin.id, groupId: userGroup.id });
    }
  }
}

export async function registerUser(input: {
  name: string;
  phone: string;
  city: string;
  email?: string;
  password: string;
}) {
  const phone = normalizePhone(input.phone);
  const email = input.email?.trim() ? input.email.trim() : null;

  const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.phone, phone)).limit(1);
  if (exists) {
    return { ok: false as const, error: "phone_taken" as const };
  }

  const [user] = await db
    .insert(users)
    .values({
      name: input.name.trim(),
      phone,
      city: input.city.trim(),
      email,
      passwordHash: hashPassword(input.password),
    })
    .returning({ id: users.id });

  const [baseGroup] = await db.select().from(userGroups).where(eq(userGroups.slug, "user")).limit(1);
  if (baseGroup) {
    await db.insert(userGroupMemberships).values({ userId: user.id, groupId: baseGroup.id });
  }

  return { ok: true as const, userId: user.id };
}

async function setSessionCookie(token: string, maxAgeSeconds: number) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function signIn(input: { phone: string; password: string }) {
  const phone = normalizePhone(input.phone);
  const [user] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);

  if (!user || !user.isActive || !verifyPassword(input.password, user.passwordHash)) {
    return { ok: false as const };
  }

  const cfg = getSiteConfig();
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + cfg.sessionDays * 24 * 60 * 60 * 1000);

  const h = await headers();

  await db.insert(sessions).values({
    tokenHash,
    userId: user.id,
    userAgent: h.get("user-agent")?.slice(0, 255) ?? null,
    ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim()?.slice(0, 64) ?? null,
    expiresAt,
  });

  await setSessionCookie(token, cfg.sessionDays * 24 * 60 * 60);
  return { ok: true as const };
}

export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (!session) {
    return null;
  }

  const [user] = await db.select().from(users).where(and(eq(users.id, session.userId), eq(users.isActive, true))).limit(1);
  if (!user) return null;

  try {
    await db.update(sessions).set({ lastSeenAt: new Date() }).where(eq(sessions.id, session.id));
  } catch {
    // не критично: обновление lastSeenAt не должно ломать сессию
  }

  const membership = await db
    .select({ groupId: userGroupMemberships.groupId })
    .from(userGroupMemberships)
    .where(eq(userGroupMemberships.userId, user.id));

  const groupIds = membership.map((m) => m.groupId);
  let permissionKeys: string[] = [];
  let groupSlugs: string[] = [];
  let groupNames: string[] = [];

  if (groupIds.length > 0) {
    const groupRows = await db.select().from(userGroups).where(inArray(userGroups.id, groupIds));
    groupSlugs = groupRows.map((g) => g.slug);
    groupNames = groupRows.map((g) => g.name);
  }

  if (groupIds.length > 0) {
    const links = await db
      .select({ permissionId: groupPermissions.permissionId })
      .from(groupPermissions)
      .where(inArray(groupPermissions.groupId, groupIds));

    const permissionIds = Array.from(new Set(links.map((l) => l.permissionId)));

    if (permissionIds.length > 0) {
      const permissionRows = await db
        .select({ key: permissions.key })
        .from(permissions)
        .where(inArray(permissions.id, permissionIds));

      permissionKeys = permissionRows.map((p) => p.key);
    }
  }

  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    city: user.city,
    avatarUrl: user.avatarUrl,
    permissions: permissionKeys,
    groupSlugs,
    groupNames,
  };
}

export async function signOut() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;

  if (token) {
    await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  }

  jar.delete(SESSION_COOKIE);
}

export async function hasPermission(userId: number, permissionKey: string) {
  const membership = await db
    .select({ groupId: userGroupMemberships.groupId })
    .from(userGroupMemberships)
    .where(eq(userGroupMemberships.userId, userId));

  if (membership.length === 0) return false;

  const groupIds = membership.map((m) => m.groupId);
  const links = await db
    .select({ permissionId: groupPermissions.permissionId })
    .from(groupPermissions)
    .where(inArray(groupPermissions.groupId, groupIds));

  if (links.length === 0) return false;

  const permissionIds = links.map((l) => l.permissionId);
  const [perm] = await db
    .select()
    .from(permissions)
    .where(and(eq(permissions.key, permissionKey), inArray(permissions.id, permissionIds)))
    .limit(1);

  return Boolean(perm);
}

export async function requestPasswordReset(phoneRaw: string) {
  const phone = normalizePhone(phoneRaw);
  const [user] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  if (!user) return { ok: true as const };

  const cfg = getSiteConfig();
  const token = generateToken();
  const tokenHashValue = hashToken(token);

  await db.insert(passwordResetTokens).values({
    tokenHash: tokenHashValue,
    userId: user.id,
    expiresAt: new Date(Date.now() + cfg.passwordResetMinutes * 60 * 1000),
  });

  return { ok: true as const, token };
}

export async function resetPasswordByToken(token: string, newPassword: string) {
  const tokenHashValue = hashToken(token);
  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHashValue),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!row) {
    return { ok: false as const };
  }

  await db
    .update(users)
    .set({ passwordHash: hashPassword(newPassword), updatedAt: new Date() })
    .where(eq(users.id, row.userId));

  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, row.id));

  await db.delete(sessions).where(eq(sessions.userId, row.userId));

  return { ok: true as const };
}
