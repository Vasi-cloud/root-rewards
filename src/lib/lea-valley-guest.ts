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

function titleKey(name: string) {
  return name.trim().toLowerCase().replace(/[—–]/g, " ").replace(/-/g, " ").replace(/\s+/g, " ");
}

function isLeaValleyShopName(shop: {
  shopName?: string;
  tradingName?: string;
  providerName?: string;
}) {
  const name = `${shop.shopName ?? ""} ${shop.tradingName ?? ""} ${shop.providerName ?? ""}`.toLowerCase();
  return name.includes("lea valley cycle hire");
}

function isUploadedHirePhoto(url: string | undefined): url is string {
  const s = url?.trim() ?? "";
  if (!s) return false;
  if (s.startsWith("data:image/")) return true;
  if (GENERIC_HIRE_ICONS.has(s)) return false;
  if (s.startsWith("https://")) return true;
  if (s.startsWith("/") && !s.startsWith("//") && !s.endsWith(".svg")) return true;
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
    const all = loadAllSellers();
    let shop: SellerProfile | null = null;
    let named: SellerProfile | null = all[LEA_VALLEY_UID] ?? null;
    for (const row of Object.values(all)) {
      if (!isLeaValleyShopName(row)) continue;
      if (!named) named = row;
      if ((row.products ?? []).some((product) => firstHirePhoto(product))) {
        shop = row;
        break;
      }
    }
    shop = shop ?? named;
    if (!shop) return items;

    const photos = new Map<string, string>();
    for (const product of (shop.products ?? []).slice(0, 20)) {
      const photo = firstHirePhoto(product);
      if (!photo) continue;
      photos.set(titleKey(product.name), photo);
      if (photos.size >= HIRE_CAP) break;
    }
    if (photos.size === 0) return items;

    let used = 0;
    return items.map((item) => {
      if (used >= HIRE_CAP) return item;
      const tagged = Boolean(item.providerName || item.sellerUid);
      if (
        tagged &&
        item.sellerUid !== shop.uid &&
        item.sellerUid !== LEA_VALLEY_UID &&
        !isLeaValleyShopName({ providerName: item.providerName })
      ) {
        return item;
      }
      const photo = photos.get(titleKey(item.name));
      if (!photo) return item;
      used += 1;
      return {
        ...item,
        imageUrl: photo,
        gallery: [photo],
      };
    });
  } catch (err) {
    console.warn("[marketplace] Lea Valley hire photos failed", err);
    return items;
  }
}

export function isLeaValleyShopSlug(slug?: string | null): boolean {
  return (slug ?? "").toLowerCase() === LEA_VALLEY_SLUG;
}
