import { db } from "@/db";
import { adImages, ads, categories, favorites, users } from "@/db/schema";
import { and, desc, eq, ilike, isNull, ne, or, sql } from "drizzle-orm";
import { runModerationForAd } from "@/lib/ai-assistant";
import { ensureAuthSeed } from "@/lib/auth";
import { consumeFreeAdQuota, getOrRefreshMonthlyQuota } from "@/lib/quota";
import { hashPassword, normalizePhone } from "@/lib/security";
import { getSiteConfig } from "@/lib/site-config";

export type CatalogNode = {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  children: CatalogNode[];
};

export type AdListItem = {
  id: number;
  title: string;
  priceRub: number;
  city: string;
  condition: string;
  createdAt: Date;
  categoryName: string;
  categorySlug: string;
  sellerName: string;
};

export type SearchFilters = {
  q?: string;
  city?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "new" | "cheap" | "expensive" | "popular";
  attributes?: Record<string, string | undefined>;
};

const ROOT_CATEGORIES = [
  { name: "Транспорт", slug: "transport", icon: "🚗", sortOrder: 1 },
  { name: "Недвижимость", slug: "real-estate", icon: "🏠", sortOrder: 2 },
  { name: "Работа", slug: "jobs", icon: "💼", sortOrder: 3 },
  { name: "Электроника", slug: "electronics", icon: "📱", sortOrder: 4 },
  { name: "Услуги", slug: "services", icon: "🛠️", sortOrder: 5 },
  { name: "Для дома", slug: "home", icon: "🛋️", sortOrder: 6 },
];

const SUBCATEGORIES: Record<string, Array<{ name: string; slug: string }>> = {
  transport: [
    { name: "Автомобили", slug: "cars" },
    { name: "Мотоциклы", slug: "motorcycles" },
    { name: "Запчасти", slug: "parts" },
  ],
  "real-estate": [
    { name: "Квартиры", slug: "apartments" },
    { name: "Дома", slug: "houses" },
    { name: "Коммерческая", slug: "commercial" },
  ],
  jobs: [
    { name: "IT и интернет", slug: "it" },
    { name: "Продажи", slug: "sales" },
    { name: "Логистика", slug: "logistics" },
  ],
  electronics: [
    { name: "Смартфоны", slug: "smartphones" },
    { name: "Ноутбуки", slug: "laptops" },
    { name: "ТВ и аудио", slug: "tv-audio" },
  ],
  services: [
    { name: "Ремонт", slug: "repair" },
    { name: "Обучение", slug: "education" },
    { name: "Перевозки", slug: "moving" },
  ],
  home: [
    { name: "Мебель", slug: "furniture" },
    { name: "Бытовая техника", slug: "appliances" },
    { name: "Интерьер", slug: "interior" },
  ],
};

const SAMPLE_ADS = [
  {
    title: "Kia Rio 2019, один владелец",
    description:
      "Отличное состояние, обслуживалась у дилера. Комплект зимней резины в подарок.",
    priceRub: 1190000,
    city: "Москва",
    condition: "used",
    categorySlug: "cars",
  },
  {
    title: "2-к квартира, 58 м², рядом с метро",
    description:
      "Свежий ремонт, кухня с техникой, закрытый двор. Подходит под ипотеку.",
    priceRub: 14500000,
    city: "Санкт-Петербург",
    condition: "used",
    categorySlug: "apartments",
  },
  {
    title: "iPhone 15 Pro 256GB",
    description: "Телефон в идеальном состоянии, полный комплект, чек, гарантия.",
    priceRub: 89000,
    city: "Казань",
    condition: "used",
    categorySlug: "smartphones",
  },
];

let seeded = false;

export async function ensureMarketplaceSeed() {
  if (seeded) return;
  await ensureAuthSeed();

  const existing = await db.select({ count: sql<number>`count(*)` }).from(categories);
  if (Number(existing[0]?.count ?? 0) > 0) {
    seeded = true;
    return;
  }

  const createdRoots = await db
    .insert(categories)
    .values(ROOT_CATEGORIES.map((item) => ({ ...item, parentId: null })))
    .returning();

  const rootBySlug = new Map(createdRoots.map((root) => [root.slug, root]));

  const subcategoryPayload = Object.entries(SUBCATEGORIES).flatMap(([rootSlug, subs], rootIdx) => {
    const root = rootBySlug.get(rootSlug);
    if (!root) return [];

    return subs.map((sub, subIdx) => ({
      name: sub.name,
      slug: sub.slug,
      icon: null,
      parentId: root.id,
      sortOrder: rootIdx * 10 + subIdx,
    }));
  });

  const createdSubs = await db.insert(categories).values(subcategoryPayload).returning();
  const subBySlug = new Map(createdSubs.map((sub) => [sub.slug, sub]));

  const sellerSeed = [
    { name: "Анна", phone: "+79991112233", city: "Москва", email: "anna@example.local" },
    { name: "Игорь", phone: "+79992223344", city: "Казань", email: "igor@example.local" },
    { name: "Сервис+", phone: "+79993334455", city: "Екатеринбург", email: "service@example.local" },
  ];

  const sellerIds: number[] = [];
  for (const seller of sellerSeed) {
    const normalized = normalizePhone(seller.phone);
    const [existingUser] = await db.select().from(users).where(eq(users.phone, normalized)).limit(1);

    if (existingUser) {
      sellerIds.push(existingUser.id);
      continue;
    }

    const [created] = await db
      .insert(users)
      .values({
        name: seller.name,
        phone: normalized,
        city: seller.city,
        email: seller.email,
        passwordHash: hashPassword("Password@123"),
      })
      .returning({ id: users.id });

    sellerIds.push(created.id);
  }

  await db.insert(ads).values(
    SAMPLE_ADS.map((ad, idx) => ({
      title: ad.title,
      description: ad.description,
      priceRub: ad.priceRub,
      city: ad.city,
      condition: ad.condition,
      isPromoted: false,
      isActive: true,
      moderationStatus: "approved",
      moderationReason: "Сидовые данные",
      sellerId: sellerIds[idx % sellerIds.length]!,
      categoryId: subBySlug.get(ad.categorySlug)?.id ?? createdSubs[0]!.id,
    })),
  );

  seeded = true;
}

export async function getCatalogTree(): Promise<CatalogNode[]> {
  const rows = await db.select().from(categories).orderBy(categories.sortOrder, categories.name);
  const roots = rows.filter((row) => row.parentId === null);

  return roots.map((root) => ({
    id: root.id,
    name: root.name,
    slug: root.slug,
    icon: root.icon,
    children: rows
      .filter((child) => child.parentId === root.id)
      .map((child) => ({ id: child.id, name: child.name, slug: child.slug, icon: child.icon, children: [] })),
  }));
}

export async function getCategoryByPath(categorySlug: string, subSlug?: string) {
  if (!subSlug) {
    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.slug, categorySlug), isNull(categories.parentId)));
    return category ?? null;
  }

  const [root] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.slug, categorySlug), isNull(categories.parentId)));

  if (!root) return null;

  const [sub] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.slug, subSlug), eq(categories.parentId, root.id)));

  return sub ?? null;
}

export async function listAds(filters: SearchFilters = {}): Promise<AdListItem[]> {
  const { q, city, categorySlug, minPrice, maxPrice, sort = "new", attributes } = filters;

  const resolvedCategory = categorySlug
    ? await db.select().from(categories).where(eq(categories.slug, categorySlug)).limit(1)
    : [];

  const selectedCategory = resolvedCategory[0];

  const rows = await db
    .select({
      id: ads.id,
      title: ads.title,
      priceRub: ads.priceRub,
      city: ads.city,
      condition: ads.condition,
      createdAt: ads.createdAt,
      categoryName: categories.name,
      categorySlug: categories.slug,
      sellerName: users.name,
      attributesJson: ads.attributesJson,
    })
    .from(ads)
    .innerJoin(categories, eq(ads.categoryId, categories.id))
    .innerJoin(users, eq(ads.sellerId, users.id))
    .where(
      and(
        eq(ads.isActive, true),
        eq(ads.moderationStatus, "approved"),
        q ? or(ilike(ads.title, `%${q}%`), ilike(ads.description, `%${q}%`)) : undefined,
        city ? ilike(ads.city, `%${city}%`) : undefined,
        minPrice !== undefined ? sql`${ads.priceRub} >= ${minPrice}` : undefined,
        maxPrice !== undefined ? sql`${ads.priceRub} <= ${maxPrice}` : undefined,
        selectedCategory
          ? or(eq(ads.categoryId, selectedCategory.id), eq(categories.parentId, selectedCategory.id))
          : undefined,
      ),
    )
    .orderBy(desc(ads.createdAt))
    .limit(60);

  const attrFilters = Object.entries(attributes ?? {}).filter(([, value]) => value && value.trim().length > 0);

  let filtered = rows.filter((row) => {
    if (attrFilters.length === 0) return true;

    let parsed: Record<string, string> = {};
    try {
      parsed = JSON.parse(row.attributesJson ?? "{}") as Record<string, string>;
    } catch {
      parsed = {};
    }

    return attrFilters.every(([key, value]) => {
      const actual = String(parsed[key] ?? "").toLowerCase();
      const expected = String(value).toLowerCase();
      return actual.includes(expected);
    });
  });

  if (sort === "cheap") {
    filtered = filtered.sort((a, b) => a.priceRub - b.priceRub);
  } else if (sort === "expensive") {
    filtered = filtered.sort((a, b) => b.priceRub - a.priceRub);
  } else if (sort === "popular") {
    const favRows = await db
      .select({ adId: favorites.adId, cnt: sql<number>`count(*)` })
      .from(favorites)
      .groupBy(favorites.adId);
    const map = new Map(favRows.map((f) => [f.adId, Number(f.cnt ?? 0)]));
    filtered = filtered.sort((a, b) => (map.get(b.id) ?? 0) - (map.get(a.id) ?? 0));
  }

  return filtered.map((row) => ({
    id: row.id,
    title: row.title,
    priceRub: row.priceRub,
    city: row.city,
    condition: row.condition,
    createdAt: row.createdAt,
    categoryName: row.categoryName,
    categorySlug: row.categorySlug,
    sellerName: row.sellerName,
  }));
}

export async function getAdById(id: number) {
  const [row] = await db
    .select({
      id: ads.id,
      title: ads.title,
      description: ads.description,
      priceRub: ads.priceRub,
      city: ads.city,
      condition: ads.condition,
      moderationStatus: ads.moderationStatus,
      moderationReason: ads.moderationReason,
      attributesJson: ads.attributesJson,
      createdAt: ads.createdAt,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryId: categories.id,
      sellerName: users.name,
      sellerPhone: users.phone,
      sellerCity: users.city,
      sellerId: users.id,
    })
    .from(ads)
    .innerJoin(categories, eq(ads.categoryId, categories.id))
    .innerJoin(users, eq(ads.sellerId, users.id))
    .where(and(eq(ads.id, id), eq(ads.isActive, true)));

  if (!row) return null;

  const related = await db
    .select({ id: ads.id, title: ads.title, priceRub: ads.priceRub, city: ads.city })
    .from(ads)
    .where(
      and(
        eq(ads.sellerId, row.sellerId),
        ne(ads.id, row.id),
        eq(ads.isActive, true),
        eq(ads.moderationStatus, "approved"),
      ),
    )
    .orderBy(desc(ads.createdAt))
    .limit(6);

  const images = await db
    .select({ url: adImages.url, sortOrder: adImages.sortOrder })
    .from(adImages)
    .where(eq(adImages.adId, row.id))
    .orderBy(adImages.sortOrder);

  return { ...row, related, images };
}

export async function createAdByUser(input: {
  userId: number;
  title: string;
  description: string;
  priceRub: number;
  city: string;
  condition: string;
  categoryId: number;
  imageUrls: string[];
  attributes: Record<string, string>;
}) {
  const cfg = getSiteConfig();
  const title = input.title.slice(0, cfg.ads.maxTitleLength);
  const description = input.description.slice(0, cfg.ads.maxDescriptionLength);

  const quotaConsume = await consumeFreeAdQuota(input.userId);
  if (!quotaConsume.ok) {
    throw new Error("FREE_QUOTA_EXCEEDED");
  }

  const [ad] = await db
    .insert(ads)
    .values({
      title,
      description,
      priceRub: input.priceRub,
      city: input.city,
      condition: input.condition,
      categoryId: input.categoryId,
      sellerId: input.userId,
      isPromoted: false,
      isActive: true,
      moderationStatus: "pending",
      moderationReason: "Ожидает авто-модерацию",
      attributesJson: JSON.stringify(input.attributes),
    })
    .returning({ id: ads.id });

  const urls = input.imageUrls.slice(0, cfg.ads.maxImagesCount);
  if (urls.length > 0) {
    await db.insert(adImages).values(
      urls.map((url, idx) => ({
        adId: ad.id,
        url,
        sortOrder: idx,
      })),
    );
  }

  await runModerationForAd(ad.id);
  return ad;
}

export async function listAdsByUser(userId: number) {
  return db
    .select({
      id: ads.id,
      title: ads.title,
      priceRub: ads.priceRub,
      city: ads.city,
      isActive: ads.isActive,
      moderationStatus: ads.moderationStatus,
      moderationReason: ads.moderationReason,
      createdAt: ads.createdAt,
    })
    .from(ads)
    .where(eq(ads.sellerId, userId))
    .orderBy(desc(ads.createdAt));
}

export async function listSimilarAdsByCategory(input: { categoryId: number; excludeAdId: number; limit?: number }) {
  return db
    .select({
      id: ads.id,
      title: ads.title,
      priceRub: ads.priceRub,
      city: ads.city,
      createdAt: ads.createdAt,
    })
    .from(ads)
    .where(
      and(
        eq(ads.categoryId, input.categoryId),
        ne(ads.id, input.excludeAdId),
        eq(ads.isActive, true),
        eq(ads.moderationStatus, "approved"),
      ),
    )
    .orderBy(desc(ads.createdAt))
    .limit(input.limit ?? 6);
}

export async function getAdForEdit(adId: number, userId: number) {
  const [ad] = await db.select().from(ads).where(and(eq(ads.id, adId), eq(ads.sellerId, userId))).limit(1);
  if (!ad) return null;
  const images = await db.select().from(adImages).where(eq(adImages.adId, ad.id)).orderBy(adImages.sortOrder);
  return { ad, images };
}

export async function updateAdByUser(input: {
  adId: number;
  userId: number;
  title: string;
  description: string;
  priceRub: number;
  city: string;
  condition: string;
  categoryId: number;
  attributes: Record<string, string>;
  imageUrls: string[];
}) {
  const cfg = getSiteConfig();

  await db
    .update(ads)
    .set({
      title: input.title.slice(0, cfg.ads.maxTitleLength),
      description: input.description.slice(0, cfg.ads.maxDescriptionLength),
      priceRub: input.priceRub,
      city: input.city,
      condition: input.condition,
      categoryId: input.categoryId,
      attributesJson: JSON.stringify(input.attributes),
      moderationStatus: "pending",
      moderationReason: "Обновлено пользователем: повторная модерация",
      isActive: true,
    })
    .where(and(eq(ads.id, input.adId), eq(ads.sellerId, input.userId)));

  await db.delete(adImages).where(eq(adImages.adId, input.adId));
  const urls = input.imageUrls.slice(0, cfg.ads.maxImagesCount);
  if (urls.length > 0) {
    await db.insert(adImages).values(urls.map((url, idx) => ({ adId: input.adId, url, sortOrder: idx })));
  }

  await runModerationForAd(input.adId);
}

export async function listModerationAds() {
  return db
    .select({
      id: ads.id,
      title: ads.title,
      priceRub: ads.priceRub,
      city: ads.city,
      moderationStatus: ads.moderationStatus,
      moderationReason: ads.moderationReason,
      createdAt: ads.createdAt,
      sellerName: users.name,
    })
    .from(ads)
    .innerJoin(users, eq(ads.sellerId, users.id))
    .orderBy(desc(ads.createdAt));
}

export async function getUserQuotaStatus(userId: number) {
  return getOrRefreshMonthlyQuota(userId);
}

export function toRub(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}
