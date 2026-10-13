import { isLeaValleySeller } from "@/lib/lea-valley-guest";
import {
  STUDIO_TEE_ECO,
  isStudioTeeName,
  studioProductFromApplication,
} from "@/lib/studio-listing";
import type { SellerProduct, SellerProfile } from "@/types";

/** Shop applications Admin → Sellers already lists. Not the marketplace catalog. */
export type AdminShopApplication = {
  id: string;
  shopName: string;
  sellerType: "business" | "individual";
  companyName: string;
  servicesOffered: string;
  email: string;
  status: "pending" | "approved";
  appliedAt: string;
  listings?: {
    id: string;
    name: string;
    price: number;
    category: string;
    listingType: "product" | "service" | "rental";
    status: "pending" | "approved" | "rejected";
    stock: number;
  }[];
};

const DEMO_LEA_VALLEY_UID = "demo-lea-valley-cycle-hire";

export function shopNameKey(name?: string) {
  return (name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function listingIdentity(product: { id: string; name: string }) {
  const name = shopNameKey(product.name);
  if (name === "forest buddies organic tee") return `name:${name}`;
  return `id:${product.id}`;
}

export function isForestBuddiesStudio(shop: {
  uid?: string;
  slug?: string;
  shopName?: string;
  companyName?: string;
}) {
  if ((shop.uid ?? "").startsWith("demo-")) return false;
  return (
    shopNameKey(shop.shopName) === "forest buddies studio" ||
    shopNameKey(shop.companyName) === "forest buddies studio" ||
    shop.uid === "forest-buddies-studio" ||
    shop.slug === "forest-buddies-studio"
  );
}

export function isAdminListingRow(product: {
  status?: string;
  listingType?: string;
}) {
  if (product.status === "pending" && product.listingType === "rental") {
    return false;
  }
  return true;
}

export function isDemoLeaValleyShop(shop: {
  uid: string;
  email?: string;
  products?: { id: string }[];
}) {
  if (shop.uid === DEMO_LEA_VALLEY_UID) return true;
  if (shop.email?.toLowerCase() === "hire@leavalleycycles.demo") return true;
  const products = shop.products ?? [];
  return (
    products.length > 0 &&
    products.every((product) => product.id.startsWith("demo-lv-pending"))
  );
}

export function isLeaValleyCycleHireShop(shop: {
  uid?: string;
  slug?: string;
  shopName?: string;
  tradingName?: string;
}) {
  if (isLeaValleySeller(shop)) return true;
  const label =
    `${shop.shopName ?? ""} ${shop.tradingName ?? ""} ${shop.slug ?? ""}`.toLowerCase();
  return label.includes("lea valley");
}

function isLeaValleyApplication(shop: {
  uid: string;
  email?: string;
  shopName?: string;
  tradingName?: string;
  slug?: string;
  products?: { id: string }[];
}) {
  return isLeaValleyCycleHireShop(shop) && !isDemoLeaValleyShop(shop);
}

export function visibleAdminSellers(allSellers: SellerProfile[]) {
  const hasApplication = allSellers.some((shop) => isLeaValleyApplication(shop));
  return allSellers.filter((shop) => {
    if (!isDemoLeaValleyShop(shop)) return true;
    return !hasApplication;
  });
}

function applicationShopsFrom(
  shopApplications: AdminShopApplication[],
  visibleSellers: SellerProfile[],
  studioFallback: boolean
): SellerProfile[] {
  const names = new Set(
    visibleSellers.map((shop) => shop.shopName.trim().toLowerCase())
  );
  const shopRows = shopApplications.filter(
    (application) => !application.id.startsWith("studio-product-")
  );
  const submitted =
    !studioFallback ||
    shopRows.some(
      (application) =>
        application.shopName.trim().toLowerCase() === "forest buddies studio"
    )
      ? shopRows
      : [
          ...shopRows,
          {
            id: "forest-buddies-studio",
            shopName: "Forest Buddies Studio",
            sellerType: "business" as const,
            companyName: "Forest Buddies Studio",
            servicesOffered: "Products / goods",
            email: "",
            status: "pending" as const,
            appliedAt: "2026-10-10T00:00:00.000Z",
          },
        ];
  return submitted
    .filter(
      (application) =>
        (application.status === "pending" || application.status === "approved") &&
        application.shopName.trim() &&
        !names.has(application.shopName.trim().toLowerCase())
    )
    .map(
      (application): SellerProfile => ({
        uid: application.id,
        email: application.email,
        shopName: application.shopName,
        slug: application.id,
        sellerType: application.sellerType,
        bio: "",
        companyName: application.companyName,
        servicesOffered: application.servicesOffered,
        status: application.status,
        appliedAt: application.appliedAt,
        products: (application.listings ?? []).map((listing) => ({
          id: listing.id,
          name: listing.name,
          subtitle: "",
          description: "",
          category: listing.category,
          tags: [],
          price: listing.price,
          ecoScore: isStudioTeeName(listing.name) ? STUDIO_TEE_ECO : 0,
          stock: listing.stock,
          listingType: listing.listingType,
          status: listing.status,
          views: 0,
          sales: 0,
          createdAt: application.appliedAt,
        })),
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
      })
    );
}

/** Same shop list Admin → Sellers already shows. Does not write storage. */
export function buildShopsForAdmin(
  allSellers: SellerProfile[],
  shopApplications: AdminShopApplication[],
  options?: { studioFallback?: boolean }
): { shops: SellerProfile[]; applicationShops: SellerProfile[] } {
  const visibleSellers = visibleAdminSellers(allSellers);
  const applicationShops = applicationShopsFrom(
    shopApplications,
    visibleSellers,
    options?.studioFallback !== false
  );
  const combined = [...visibleSellers, ...applicationShops];
  const studioRows = combined.filter((shop) => isForestBuddiesStudio(shop));
  if (studioRows.length === 0) {
    return { shops: combined, applicationShops };
  }
  const seen = new Set<string>();
  const products: SellerProduct[] = [];
  let owner: SellerProfile | undefined;
  const addProductRow = (
    product: SellerProduct,
    shop?: SellerProfile,
    shared = false
  ) => {
    const key = listingIdentity(product);
    if (seen.has(key)) {
      if (!shared) return;
      const index = products.findIndex((row) => listingIdentity(row) === key);
      if (index >= 0) {
        const prev = products[index];
        const imageUrl = product.imageUrl?.trim() || prev.imageUrl;
        const ecoScore = product.ecoScore > 0 ? product.ecoScore : prev.ecoScore;
        products[index] = { ...prev, ...product, imageUrl, ecoScore };
      }
      return;
    }
    seen.add(key);
    products.push(product);
    if (!owner && shop && isForestBuddiesStudio(shop)) owner = shop;
  };
  for (const shop of studioRows) {
    for (const product of shop.products ?? []) addProductRow(product, shop);
  }
  for (const shop of allSellers) {
    if (shop.uid.startsWith("demo-")) continue;
    const studioShop = isForestBuddiesStudio(shop);
    const taken = studioShop
      ? shop.products
      : shop.products.filter(
          (product) => shopNameKey(product.name) === "forest buddies organic tee"
        );
    if (taken.length === 0) continue;
    if (!owner) owner = shop;
    for (const product of taken) addProductRow(product, shop);
  }
  for (const application of shopApplications) {
    const product = studioProductFromApplication(application);
    if (product) addProductRow(product, undefined, true);
  }
  const keeper =
    studioRows.find((shop) => shop.appliedAt?.startsWith("2026-10-10")) ??
    studioRows.find((shop) => shop.uid === "forest-buddies-studio") ??
    studioRows[0];
  const studioShop: SellerProfile = {
    ...keeper,
    uid: owner && isForestBuddiesStudio(owner) ? owner.uid : keeper.uid,
    products,
  };
  return {
    shops: [
      ...combined.filter((shop) => !isForestBuddiesStudio(shop)),
      studioShop,
    ],
    applicationShops,
  };
}

export type AdminPendingProduct = {
  seller: SellerProfile;
  product: SellerProduct;
};

/** Pending shops and pending products already on that shop list. */
export function pendingOnAdminShops(shops: SellerProfile[]): {
  shops: SellerProfile[];
  products: AdminPendingProduct[];
} {
  return {
    shops: shops.filter((shop) => shop.status === "pending"),
    products: shops.flatMap((seller) =>
      (seller.products ?? [])
        .filter(
          (product) =>
            (product.status ?? "pending") === "pending" &&
            isAdminListingRow(product)
        )
        .map((product) => ({ seller, product }))
    ),
  };
}

/** The approved Studio shop Admin already lists. Does not read the marketplace catalog. */
export async function loadApprovedStudioShop(): Promise<SellerProfile | null> {
  let applications: AdminShopApplication[] = [];
  try {
    const res = await fetch("/api/shop-applications", { cache: "no-store" });
    if (!res.ok) return null;
    const body = (await res.json()) as { applications?: AdminShopApplication[] };
    applications = body.applications ?? [];
  } catch {
    return null;
  }
  const { shops } = buildShopsForAdmin([], applications, {
    studioFallback: false,
  });
  const studio = shops.find((shop) => isForestBuddiesStudio(shop));
  if (!studio || studio.status !== "approved") return null;
  return { ...studio, slug: "forest-buddies-studio", status: "approved" };
}

/** Re-read the same shop applications while Admin is open. Does not write sellers. */
export function watchShopApplications(
  onRows: (rows: AdminShopApplication[]) => void
): () => void {
  let cancelled = false;
  let last = "";
  let seen = false;
  const load = () => {
    fetch("/api/shop-applications", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { applications: [] }))
      .then((body: { applications?: AdminShopApplication[] }) => {
        if (cancelled) return;
        const rows = body.applications ?? [];
        const next = JSON.stringify(rows);
        if (seen && next === last) return;
        seen = true;
        last = next;
        onRows(rows);
      })
      .catch(() => {
        if (cancelled || seen) return;
        seen = true;
        onRows([]);
      });
  };
  load();
  const timer = window.setInterval(() => {
    if (document.visibilityState === "visible") load();
  }, 5000);
  const onVisible = () => {
    if (document.visibilityState === "visible") load();
  };
  window.addEventListener("focus", load);
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    cancelled = true;
    window.clearInterval(timer);
    window.removeEventListener("focus", load);
    document.removeEventListener("visibilitychange", onVisible);
  };
}
