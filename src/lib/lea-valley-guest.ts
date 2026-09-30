import { loadAllSellers } from "@/lib/seller-storage";
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

const HIRE_THUMBS_KEY = "forest-buddies-lea-valley-hire-thumbs";

function titleKey(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[—–]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ");
}

const KNOWN_HIRE_TITLES = new Set(HIRE_ROWS.map((row) => titleKey(row.name)));

function isLeaValleyShopName(shop: {
  shopName?: string;
  tradingName?: string;
  providerName?: string;
}) {
  const name =
    `${shop.shopName ?? ""} ${shop.tradingName ?? ""} ${shop.providerName ?? ""}`.toLowerCase();
  return name.includes("lea valley cycle hire");
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

function photosFromShop(shop: SellerProfile): Map<string, string> {
  const photos = new Map<string, string>();
  for (const product of (shop.products ?? []).slice(0, 20)) {
    const photo = firstHirePhoto(product);
    if (!photo) continue;
    photos.set(titleKey(product.name), photo);
    if (photos.size >= HIRE_CAP) break;
  }
  return photos;
}

function photosFromItems(
  items: Array<{
    name: string;
    imageUrl?: string;
    gallery?: string[];
    providerName?: string;
  }>
): Map<string, string> {
  const photos = new Map<string, string>();
  for (const item of items) {
    if (photos.size >= HIRE_CAP) break;
    if (
      item.providerName &&
      !isLeaValleyShopName({ providerName: item.providerName })
    ) {
      continue;
    }
    const key = titleKey(item.name);
    if (!KNOWN_HIRE_TITLES.has(key) && photos.size >= HIRE_CAP) continue;
    const photo = firstHirePhoto(item);
    if (!photo) continue;
    if (!photos.has(key)) photos.set(key, photo);
  }
  return photos;
}

/** Name match only — never walks other shops' listings. */
function findLeaValleyShop(
  all: Record<string, SellerProfile>
): SellerProfile | null {
  let named: SellerProfile | null = all[LEA_VALLEY_UID] ?? null;
  for (const row of Object.values(all)) {
    if (!isLeaValleyShopName(row)) continue;
    if (!named) named = row;
    if ((row.products ?? []).slice(0, 20).some((product) => firstHirePhoto(product))) {
      return row;
    }
  }
  return named;
}

function readCachedThumbs(): Map<string, string> {
  if (typeof window === "undefined") return new Map();
  try {
    const raw = localStorage.getItem(HIRE_THUMBS_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const photos = new Map<string, string>();
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value !== "string" || !isUploadedHirePhoto(value)) continue;
      photos.set(titleKey(key), value);
      if (photos.size >= HIRE_CAP) break;
    }
    return photos;
  } catch {
    return new Map();
  }
}

function writeCachedThumbs(photos: Map<string, string>) {
  if (typeof window === "undefined" || photos.size === 0) return;
  try {
    const payload: Record<string, string> = {};
    let used = 0;
    for (const [key, value] of photos) {
      if (used >= HIRE_CAP) break;
      payload[key] = value;
      used += 1;
    }
    localStorage.setItem(HIRE_THUMBS_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota
  }
}

function mergePhotoMaps(
  ...maps: Array<Map<string, string>>
): Map<string, string> {
  const photos = new Map<string, string>();
  for (const map of maps) {
    for (const [key, value] of map) {
      if (!photos.has(key)) photos.set(key, value);
      if (photos.size >= HIRE_CAP) return photos;
    }
  }
  return photos;
}

/** Cache this shop's first hire photos (cap 5). Safe to call from seller save. */
export function rememberLeaValleyHireThumbs(
  all?: Record<string, SellerProfile>
): void {
  try {
    const shops = all ?? loadAllSellers();
    const shop = findLeaValleyShop(shops);
    if (!shop) return;
    const photos = photosFromShop(shop);
    if (photos.size === 0) return;
    writeCachedThumbs(mergePhotoMaps(photos, readCachedThumbs()));
  } catch (err) {
    console.warn("[marketplace] Lea Valley hire thumbs failed", err);
  }
}

export function getLeaValleyStoredShop(): SellerProfile | null {
  try {
    return findLeaValleyShop(loadAllSellers());
  } catch {
    return null;
  }
}

function applyHirePhotos<
  T extends { name: string; imageUrl?: string; gallery?: string[] },
>(items: T[], photos: Map<string, string>): T[] {
  if (photos.size === 0) return items;
  let used = 0;
  return items.map((item) => {
    if (used >= HIRE_CAP) return item;
    const photo = photos.get(titleKey(item.name));
    if (!photo || item.imageUrl === photo) {
      if (photo && item.imageUrl === photo) used += 1;
      return item;
    }
    used += 1;
    return {
      ...item,
      imageUrl: photo,
      gallery: [photo],
    };
  });
}

function collectHirePhotos(
  items: Array<{
    name: string;
    imageUrl?: string;
    gallery?: string[];
    providerName?: string;
  }>,
  allowSellerRead: boolean
): Map<string, string> {
  const photos = mergePhotoMaps(readCachedThumbs(), photosFromItems(items));
  if (photos.size > 0) writeCachedThumbs(photos);
  const missing = items.some((item) => {
    const key = titleKey(item.name);
    if (!KNOWN_HIRE_TITLES.has(key)) return false;
    return !isUploadedHirePhoto(item.imageUrl) && !photos.has(key);
  });
  if (!allowSellerRead || !missing) return photos;
  try {
    const shop = findLeaValleyShop(loadAllSellers());
    if (!shop) return photos;
    const fromShop = photosFromShop(shop);
    const merged = mergePhotoMaps(fromShop, photos);
    if (fromShop.size > 0) writeCachedThumbs(merged);
    return merged;
  } catch (err) {
    console.warn("[marketplace] Lea Valley hire photos failed", err);
    return photos;
  }
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
  const overlaid = overlayLeaValleyHirePhotos(merged);
  scheduleHirePhotoCatalogSync(overlaid);
  return overlaid;
}

function scheduleHirePhotoCatalogSync(
  items: Array<{
    id: string;
    name: string;
    description?: string;
    category?: string;
    price: number;
    sustainabilityScore?: number;
    ecoScore?: number;
    stock?: number | null;
    imageUrl?: string;
    gallery?: string[];
    listingType?: string;
    hirePeriod?: string;
    bookingNote?: string;
    providerName?: string;
    sellerUid?: string;
    sellerId?: string;
  }>
) {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem("fb-lv-hire-photo-sync") === "1") return;
  } catch {
    // continue
  }
  const rows = items.filter((item) => {
    if (item.listingType !== "rental") return false;
    if (!KNOWN_HIRE_TITLES.has(titleKey(item.name))) return false;
    return isUploadedHirePhoto(item.imageUrl);
  }).slice(0, HIRE_CAP);
  if (rows.length === 0) return;
  void import("@/lib/admin-catalog-products")
    .then(async ({ saveSellerFirstPartyListing }) => {
      let saved = false;
      for (const item of rows) {
        const result = await saveSellerFirstPartyListing(
          item.sellerUid || item.sellerId || LEA_VALLEY_UID,
          {
            id: item.id,
            name: item.name,
            description: item.description,
            category: item.category || "Cycling",
            price: item.price,
            ecoScore: item.sustainabilityScore ?? item.ecoScore ?? 90,
            stock: item.stock ?? 0,
            imageUrl: item.imageUrl,
            gallery: item.gallery,
            listingType: "rental",
            hirePeriod: item.hirePeriod,
            bookingNote: item.bookingNote,
            providerName: item.providerName || LEA_VALLEY_SHOP_NAME,
          }
        );
        if (result) saved = true;
      }
      if (!saved) return;
      try {
        sessionStorage.setItem("fb-lv-hire-photo-sync", "1");
      } catch {
        // ignore
      }
    })
    .catch((err) => {
      console.warn("[marketplace] Lea Valley hire photo sync failed", err);
    });
}

/**
 * Guest shop rows + this shop's stored hires, matched by title.
 * First Seller Hub photo becomes the card thumbnail. Cap 5 overlays.
 */
export function applyLeaValleyGuestShop(
  stored: SellerProfile | null
): SellerProfile {
  const guest = getLeaValleyGuestShop();
  const byTitle = new Map(
    guest.products.map((product) => [titleKey(product.name), { ...product }])
  );
  const extras: SellerProduct[] = [];
  for (const product of stored?.products ?? []) {
    const key = titleKey(product.name);
    const photo = firstHirePhoto(product);
    const guestRow = byTitle.get(key);
    if (guestRow) {
      byTitle.set(key, {
        ...guestRow,
        subtitle: product.subtitle || guestRow.subtitle,
        description: product.description || guestRow.description,
        price: product.price || guestRow.price,
        hirePeriod: product.hirePeriod || guestRow.hirePeriod,
        priceNote: product.priceNote || guestRow.priceNote,
        imageUrl: photo ?? guestRow.imageUrl,
        gallery: photo ? [photo] : guestRow.gallery,
        status: "approved",
      });
    } else if (product.status === "approved") {
      extras.push(
        photo
          ? { ...product, imageUrl: photo, gallery: [photo] }
          : product
      );
    }
  }
  if (stored) {
    rememberLeaValleyHireThumbs({ [stored.uid]: stored });
  }
  const products = overlayLeaValleyHirePhotos(
    [...byTitle.values(), ...extras].slice(0, 20)
  );
  scheduleHirePhotoCatalogSync(
    products.map((product) => ({
      ...product,
      listingType: product.listingType ?? "rental",
      providerName: stored?.tradingName || stored?.shopName || LEA_VALLEY_SHOP_NAME,
      sellerUid: stored?.uid || LEA_VALLEY_UID,
    }))
  );
  if (stored?.status === "approved") {
    return {
      ...stored,
      ...guest,
      products,
      uid: stored.uid || guest.uid,
      slug: guest.slug,
    };
  }
  return { ...guest, products };
}

/** This shop only — match hire title to the first Seller Hub photo. Cap 5. */
export function overlayLeaValleyHirePhotos<
  T extends {
    name: string;
    imageUrl?: string;
    gallery?: string[];
    providerName?: string;
    sellerUid?: string;
  },
>(items: T[]): T[] {
  try {
    const photos = collectHirePhotos(items, true);
    return applyHirePhotos(items, photos);
  } catch (err) {
    console.warn("[marketplace] Lea Valley hire photos failed", err);
    return items;
  }
}

export function isLeaValleyShopSlug(slug?: string | null): boolean {
  return (slug ?? "").toLowerCase() === LEA_VALLEY_SLUG;
}
