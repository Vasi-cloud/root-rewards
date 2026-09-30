import type { Product, SellerProduct, SellerProfile } from "@/types";

const GENERIC_HIRE_ICONS = new Set([
  "/shop/tote.svg",
  "/shop/bottle.svg",
  "/shop/pouch.svg",
  "/shop/cover-grove.svg",
  "/shop/linen.svg",
]);

export const LEA_VALLEY_SLUG = "lea-valley-cycle-hire";
export const LEA_VALLEY_SHOP_NAME = "Lea Valley Cycle Hire";
const LEA_VALLEY_UID = "demo-lea-valley-cycle-hire";
const HIRE_CAP = 5;

const HIRE_ROWS = [
  {
    id: "demo-lv-pending-1",
    name: "Hybrid City Bike — day hire",
    subtitle: "Lock, helmet & lights included",
    description:
      "Comfortable hybrid for towpath and city legs. Collect at the lock — helmet and D-lock included.",
    price: 22,
    hirePeriod: "1 day",
    imageUrl: "/shop/tote.svg",
  },
  {
    id: "demo-lv-pending-2",
    name: "E-Bike Weekend Hire",
    subtitle: "Fri–Mon · battery + charger",
    description:
      "Weekend hire of a step-through e-bike. Collect at the lock Friday, return Monday evening.",
    price: 68,
    hirePeriod: "Fri–Mon weekend",
    imageUrl: "/shop/bottle.svg",
  },
  {
    id: "lv-hub-half-day",
    name: "Hybrid bike half-day hire",
    subtitle: "Half day · pickup at the lock",
    description:
      "Half-day hybrid hire along the Lea Valley. Collect and return at the lock.",
    price: 18,
    hirePeriod: "half day",
    imageUrl: "/shop/tote.svg",
  },
  {
    id: "lv-hub-full-day",
    name: "Hybrid bike full-day hire",
    subtitle: "Full day · pickup at the lock",
    description:
      "Full-day hybrid hire. Collect at the lock in the morning, return the same evening.",
    price: 28,
    hirePeriod: "full day",
    imageUrl: "/shop/tote.svg",
  },
  {
    id: "lv-hub-weekend",
    name: "Gravel bike weekend hire",
    subtitle: "Weekend · pickup at the lock",
    description:
      "Weekend gravel bike hire for longer Lea Valley loops. Collect at the lock.",
    price: 45,
    hirePeriod: "weekend",
    imageUrl: "/shop/pouch.svg",
  },
] as const;

function toSellerProduct(row: (typeof HIRE_ROWS)[number]): SellerProduct {
  return {
    id: row.id,
    listingType: "rental",
    name: row.name,
    subtitle: row.subtitle,
    description: row.description,
    category: "Cycling",
    tags: ["hire", "cycling", "lea valley"],
    price: row.price,
    ecoScore: 90,
    stock: 2,
    imageUrl: row.imageUrl,
    hirePeriod: row.hirePeriod,
    priceNote: row.hirePeriod,
    bookingNote: "Pickup at the lock — partner confirms dates.",
    availabilityNote: "Collect at the lock",
    madeIn: "Lea Valley, East London",
    status: "approved",
    views: 0,
    sales: 0,
    createdAt: "2026-06-10T00:00:00.000Z",
  };
}

export function leaValleyApprovedHireProducts(): SellerProduct[] {
  return HIRE_ROWS.map(toSellerProduct).slice(0, HIRE_CAP);
}

export function getLeaValleyGuestShop(): SellerProfile {
  const products = leaValleyApprovedHireProducts();
  return {
    uid: LEA_VALLEY_UID,
    email: "hire@leavalleycycles.demo",
    shopName: LEA_VALLEY_SHOP_NAME,
    slug: LEA_VALLEY_SLUG,
    sellerType: "individual",
    tradingName: LEA_VALLEY_SHOP_NAME,
    bio: "Day and weekend bike hire along the Lea Valley — collect at the lock.",
    location: "Lea Valley, East London",
    coverImageUrl: "/shop/cover-grove.svg",
    story:
      "We lend serviced hybrids and gravel bikes from the towpath lock.\n\nCollect at the lock, ride the valley, and bring the bike back the same day or Monday after a weekend hire.",
    impactStory: "Each hire helps fund verified tree planting through Forest Buddies.",
    status: "approved",
    approvedAt: "2026-06-10T00:00:00.000Z",
    products,
    earnings: {
      total: 0,
      pending: 0,
      available: 0,
      thisMonth: 0,
      orders: 0,
    },
    analytics: {
      views: 0,
      viewsThisMonth: 0,
      sales: 0,
      salesThisMonth: 0,
      conversionRate: 0,
    },
    payouts: [],
    trustTier: "new",
  };
}

/** Guest marketplace rows for this shop only — never walks other shops. Cap 5. */
export function listLeaValleyApprovedHires(): Product[] {
  const shop = getLeaValleyGuestShop();
  return shop.products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description || product.subtitle || shop.shopName,
    price: product.price,
    imageUrl: product.imageUrl || "/shop/tote.svg",
    category: product.category,
    sustainabilityScore: product.ecoScore,
    affiliateCommissionPercent: 10,
    sellerUid: shop.uid,
    sellerId: shop.uid,
    commerceType: "first_party" as const,
    listingType: "rental" as const,
    stock: product.stock,
    hirePeriod: product.hirePeriod,
    priceNote: product.priceNote,
    bookingNote: product.bookingNote,
    availabilityNote: product.availabilityNote,
    providerType: "self_employed" as const,
    providerName: shop.tradingName,
    areaServed: shop.location,
  }));
}

const FULL_DAY_ID = "lv-hub-full-day";
const FULL_DAY_TITLE_KEY = "hybrid bike full day hire";
const FULL_DAY_PHOTO_KEY = "forest-buddies-lv-full-day-photo";
const LIVE_PRODUCTS_KEY = "forest-buddies-live-products";

function titleKey(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[—–]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ");
}

function isLeaValleyShopName(shop: {
  shopName?: string;
  tradingName?: string;
  providerName?: string;
}) {
  const name =
    `${shop.shopName ?? ""} ${shop.tradingName ?? ""} ${shop.providerName ?? ""}`.toLowerCase();
  return name.includes("lea valley cycle hire");
}

function isFullDayHire(
  item: { name?: string; providerName?: string; shopName?: string }
) {
  if (titleKey(item.name ?? "") !== FULL_DAY_TITLE_KEY) return false;
  if (
    item.providerName &&
    !isLeaValleyShopName({ providerName: item.providerName })
  ) {
    return false;
  }
  if (item.shopName && !isLeaValleyShopName({ shopName: item.shopName })) {
    return false;
  }
  return true;
}

function isUploadedHirePhoto(url: string | undefined): url is string {
  const s = url?.trim() ?? "";
  if (!s) return false;
  if (s.startsWith("data:image/")) return true;
  if (GENERIC_HIRE_ICONS.has(s)) return false;
  if (s.startsWith("https://")) return true;
  if (s.startsWith("/") && !s.startsWith("//") && !s.endsWith(".svg")) {
    return true;
  }
  return false;
}

function firstHirePhoto(product: {
  imageUrl?: string;
  gallery?: string[];
}): string | null {
  const urls = [
    ...(Array.isArray(product.gallery) ? product.gallery : []),
    product.imageUrl ?? "",
  ];
  return urls.find((url) => isUploadedHirePhoto(url)) ?? null;
}

function cacheFullDayPhoto(photo: string) {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(FULL_DAY_PHOTO_KEY) === photo) return;
    localStorage.setItem(FULL_DAY_PHOTO_KEY, photo);
  } catch {
    // ignore quota
  }
}

function readCachedFullDayPhoto(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FULL_DAY_PHOTO_KEY);
    return isUploadedHirePhoto(raw ?? undefined) ? raw : null;
  } catch {
    return null;
  }
}

function readLiveLocalFullDayPhoto(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LIVE_PRODUCTS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;
    if (!Array.isArray(parsed)) return null;
    const row = parsed.find((item) => {
      if (item?.id === FULL_DAY_ID) return true;
      return isFullDayHire({
        name: String(item?.name ?? ""),
        providerName:
          typeof item?.providerName === "string" ? item.providerName : undefined,
      });
    });
    const photo = firstHirePhoto({
      imageUrl: typeof row?.imageUrl === "string" ? row.imageUrl : undefined,
    });
    return photo;
  } catch {
    return null;
  }
}

function publishFullDayPhoto(photo: string) {
  cacheFullDayPhoto(photo);
  void import("@/lib/admin-catalog-products")
    .then((mod) => mod.copyLeaValleyFullDayPhoto(photo))
    .catch((err) => {
      console.warn("[marketplace] Full-day hire photo copy failed", err);
    });
}

function readFullDayPhotoSync(
  items?: Array<{
    name: string;
    imageUrl?: string;
    gallery?: string[];
    providerName?: string;
  }>
): string | null {
  const fromItems = items?.find(
    (item) => isFullDayHire(item) && isUploadedHirePhoto(item.imageUrl)
  );
  if (fromItems?.imageUrl && isUploadedHirePhoto(fromItems.imageUrl)) {
    return fromItems.imageUrl;
  }
  return readCachedFullDayPhoto() ?? readLiveLocalFullDayPhoto();
}

function applyFullDayPhoto<
  T extends {
    name: string;
    imageUrl?: string;
    gallery?: string[];
    providerName?: string;
  },
>(items: T[], photo: string | null): T[] {
  if (!photo) return items;
  return items.map((item) => {
    if (!isFullDayHire(item)) return item;
    if (item.imageUrl === photo && item.gallery?.[0] === photo) return item;
    return {
      ...item,
      imageUrl: photo,
      gallery: [photo],
    };
  });
}

export function mergeLeaValleyHires(catalog: Product[]): Product[] {
  const extras = listLeaValleyApprovedHires();
  const seenIds = new Set(catalog.map((p) => p.id));
  const seenNames = new Set(catalog.map((p) => titleKey(p.name)));
  const add: Product[] = [];
  for (const hire of extras) {
    if (add.length >= HIRE_CAP) break;
    const key = titleKey(hire.name);
    if (seenIds.has(hire.id) || seenNames.has(key)) continue;
    seenIds.add(hire.id);
    seenNames.add(key);
    add.push(hire);
  }
  const merged = add.length === 0 ? catalog : [...catalog, ...add];
  return overlayLeaValleyHirePhotos(merged);
}

/** Guest shop — only the full-day row may receive the Seller Hub photo. */
export function applyLeaValleyGuestShop(photo?: string | null): SellerProfile {
  const guest = getLeaValleyGuestShop();
  const resolved = photo ?? readFullDayPhotoSync(guest.products);
  return {
    ...guest,
    products: applyFullDayPhoto(guest.products, resolved),
  };
}

export function fetchLeaValleyFullDayPhoto(): Promise<string | null> {
  const sync = readFullDayPhotoSync();
  return Promise.race([
    (async () => {
      if (sync) return sync;
      try {
        const { readLeaValleyFullDayCatalogPhoto } = await import(
          "@/lib/admin-catalog-products"
        );
        const live = await readLeaValleyFullDayCatalogPhoto();
        if (live) cacheFullDayPhoto(live);
        return live;
      } catch (err) {
        console.warn("[marketplace] Full-day hire live photo failed", err);
        return sync;
      }
    })(),
    new Promise<string | null>((resolve) => {
      window.setTimeout(() => resolve(sync), 3000);
    }),
  ]);
}

/**
 * One listing only: Hybrid bike full-day hire at Lea Valley Cycle Hire.
 * Pending Seller Hub photos are used. Other hires are left unchanged.
 */
export function overlayLeaValleyHirePhotos<
  T extends {
    name: string;
    imageUrl?: string;
    gallery?: string[];
    providerName?: string;
  },
>(items: T[]): T[] {
  try {
    const nextPhoto = readFullDayPhotoSync(items);
    if (nextPhoto && readCachedFullDayPhoto() !== nextPhoto) {
      publishFullDayPhoto(nextPhoto);
    }
    return applyFullDayPhoto(items, nextPhoto);
  } catch (err) {
    console.warn("[marketplace] Lea Valley full-day photo failed", err);
    return items;
  }
}

export function isLeaValleyShopSlug(slug?: string | null): boolean {
  return (slug ?? "").toLowerCase() === LEA_VALLEY_SLUG;
}
