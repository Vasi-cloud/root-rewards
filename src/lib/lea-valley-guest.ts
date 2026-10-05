import type { Product, SellerProduct, SellerProfile } from "@/types";

export const LEA_VALLEY_SLUG = "lea-valley-cycle-hire";
export const LEA_VALLEY_SHOP_NAME = "Lea Valley Cycle Hire";
export const LEA_VALLEY_UID = "demo-lea-valley-cycle-hire";
export const LEA_VALLEY_HIRE_EMAIL = "hire@leavalleycycles.demo";
/** Pickup notes for Confirm email and Paid receipt — not a tree claim. */
export const LEA_VALLEY_HIRE_PICKUP_LINES = [
  "Collect at the Lea Valley lock at 10:00",
  "Return by 18:00 the same day",
  "Bring ID",
  "Helmet and lock included",
  "Unpaid is not a pickup",
  "£50 deposit held against damage or loss and returned if the bike comes back as issued",
] as const;
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
    imageUrl: "/hires/lea-valley-city-day.jpg",
    gallery: ["/hires/lea-valley-city-day.jpg"],
  },
  {
    id: "demo-lv-pending-2",
    name: "E-Bike Weekend Hire",
    subtitle: "Fri–Mon · battery + charger",
    description:
      "Weekend hire of a step-through e-bike. Collect at the lock Friday, return Monday evening.",
    price: 68,
    hirePeriod: "Fri–Mon weekend",
    imageUrl: "/hires/lea-valley-ebike-weekend.jpg",
    gallery: ["/hires/lea-valley-ebike-weekend.jpg"],
  },
  {
    id: "lv-hub-half-day",
    name: "Hybrid bike half-day hire",
    subtitle: "Half day · pickup at the lock",
    description:
      "Half-day hybrid hire along the Lea Valley. Collect and return at the lock.",
    price: 18,
    hirePeriod: "half day",
    imageUrl: "/hires/lea-valley-hybrid-half.jpg",
    gallery: ["/hires/lea-valley-hybrid-half.jpg"],
  },
  {
    id: "lv-hub-full-day",
    name: "Hybrid bike full-day hire",
    subtitle: "Full day · pickup at the lock",
    description:
      "Full-day hybrid hire. Collect at the lock in the morning, return the same evening.",
    price: 28,
    hirePeriod: "full day",
    imageUrl: "/hires/lea-valley-full-day.jpg",
    gallery: ["/hires/lea-valley-full-day.jpg"],
  },
  {
    id: "lv-hub-weekend",
    name: "Gravel bike weekend hire",
    subtitle: "Weekend · pickup at the lock",
    description:
      "Weekend gravel bike hire for longer Lea Valley loops. Collect at the lock.",
    price: 45,
    hirePeriod: "weekend",
    imageUrl: "/hires/lea-valley-gravel-weekend.jpg",
    gallery: ["/hires/lea-valley-gravel-weekend.jpg"],
  },
] as const;

function titleKey(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[—–]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ");
}

function isLeaValleyHire(item: { name?: string; providerName?: string }) {
  const shop = (item.providerName ?? "").toLowerCase();
  if (shop && !shop.includes("lea valley cycle hire")) return false;
  return HIRE_IMAGE_BY_TITLE.has(titleKey(item.name ?? ""));
}

const HIRE_IMAGE_BY_TITLE = new Map(
  HIRE_ROWS.map((row) => [titleKey(row.name), row.imageUrl])
);

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
    gallery: [...row.gallery],
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

/** Public /shop/lea-valley-cycle-hire hires — not a marketplace walk. */
export function leaValleyPublicShopHasLiveHires(): boolean {
  return leaValleyApprovedHireProducts().some(
    (product) => product.status === "approved"
  );
}

export function getLeaValleyGuestShop(): SellerProfile {
  const products = leaValleyApprovedHireProducts();
  return {
    uid: LEA_VALLEY_UID,
    email: LEA_VALLEY_HIRE_EMAIL,
    shopName: LEA_VALLEY_SHOP_NAME,
    slug: LEA_VALLEY_SLUG,
    sellerType: "individual",
    tradingName: LEA_VALLEY_SHOP_NAME,
    bio: "Day and weekend bike hire along the Lea Valley — collect at the lock.",
    location: "Lea Valley, East London",
    coverImageUrl: "/shop/cover-grove.svg",
    story:
      "We lend serviced hybrids and gravel bikes from the towpath lock.\n\nCollect at the lock, ride the valley, and bring the bike back the same day or Monday after a weekend hire.",
    impactStory:
      "Each hire can fund partner tree programmes — illustrative impact, not a GPS pin.",
    impact: [
      {
        causeId: "trees",
        unitsSupported: 0,
        label: "Trees funded via confirmed sales",
      },
    ],
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

/** Set imageUrl on the five Lea Valley public hire rows. Do not read Seller Hub. */
export function mergeLeaValleyHires(catalog: Product[]): Product[] {
  const patched = catalog.map((item) => {
    if (!isLeaValleyHire(item)) return item;
    const imageUrl = HIRE_IMAGE_BY_TITLE.get(titleKey(item.name));
    if (!imageUrl || item.imageUrl === imageUrl) return item;
    return { ...item, imageUrl };
  });
  const extras = listLeaValleyApprovedHires();
  const seenIds = new Set(patched.map((p) => p.id));
  const seenNames = new Set(patched.map((p) => titleKey(p.name)));
  const add: Product[] = [];
  for (const hire of extras) {
    if (add.length >= HIRE_CAP) break;
    const key = titleKey(hire.name);
    if (seenIds.has(hire.id) || seenNames.has(key)) continue;
    seenIds.add(hire.id);
    seenNames.add(key);
    add.push(hire);
  }
  return add.length === 0 ? patched : [...patched, ...add];
}

export function applyLeaValleyGuestShop(): SellerProfile {
  return getLeaValleyGuestShop();
}

export function isLeaValleyShopSlug(slug?: string | null): boolean {
  return (slug ?? "").toLowerCase() === LEA_VALLEY_SLUG;
}

export function isLeaValleySeller(seller: {
  uid?: string;
  slug?: string;
  shopName?: string;
  tradingName?: string;
}): boolean {
  if (seller.uid === LEA_VALLEY_UID || isLeaValleyShopSlug(seller.slug)) {
    return true;
  }
  const name = `${seller.shopName ?? ""} ${seller.tradingName ?? ""}`.toLowerCase();
  return name.includes("lea valley cycle hire");
}

/** Known Lea Valley hire rows — id or title. No catalogue walk. */
export function isLeaValleyHireListing(item: {
  id?: string;
  name?: string;
  listingType?: string;
  providerName?: string;
  sellerUid?: string;
  sellerId?: string;
}): boolean {
  if (HIRE_ROWS.some((row) => row.id === item.id)) return true;
  return HIRE_IMAGE_BY_TITLE.has(titleKey(item.name ?? ""));
}

export function leaValleyHireTitle(id?: string, name?: string): string {
  const trimmed = name?.trim() ?? "";
  if (trimmed) return trimmed;
  return HIRE_ROWS.find((row) => row.id === id)?.name ?? "";
}

/** Listing price in pounds — day hire is £22. No client-supplied amount. */
export function leaValleyHirePricePounds(item: {
  id?: string;
  name?: string;
}): number | null {
  const byId = HIRE_ROWS.find((row) => row.id === item.id);
  if (byId) return byId.price;
  const byName = HIRE_ROWS.find(
    (row) => titleKey(row.name) === titleKey(item.name ?? "")
  );
  return byName?.price ?? null;
}

/** Checkout may append " — Hire" when the listing title does not already say hire. */
export function hireOrderLineMatchesListing(
  lineName: string,
  listing: { id?: string; name?: string }
): boolean {
  const listingName = leaValleyHireTitle(listing.id, listing.name);
  const want = titleKey(listingName);
  if (!want) return false;
  const line = titleKey(lineName);
  if (line === want) return true;
  const strippedLine = titleKey(lineName.replace(/\s*[—–-]\s*hire\s*$/i, ""));
  const strippedWant = titleKey(listingName.replace(/\s*[—–-]\s*hire\s*$/i, ""));
  if (strippedLine && strippedLine === strippedWant) return true;
  return Boolean(listing.id && lineName.includes(listing.id));
}
