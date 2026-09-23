import type { Product, SellerProduct, SellerProfile } from "@/types";

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
  const seenNames = new Set(catalog.map((p) => p.name.trim().toLowerCase()));
  const add: Product[] = [];
  for (const hire of extras) {
    if (add.length >= HIRE_CAP) break;
    const key = hire.name.trim().toLowerCase();
    if (seenIds.has(hire.id) || seenNames.has(key)) continue;
    seenIds.add(hire.id);
    seenNames.add(key);
    add.push(hire);
  }
  return add.length === 0 ? catalog : [...catalog, ...add];
}

export function isLeaValleyShopSlug(slug?: string | null): boolean {
  return (slug ?? "").toLowerCase() === LEA_VALLEY_SLUG;
}
