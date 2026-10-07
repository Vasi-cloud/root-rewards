import {
  isLeaValleyHireListing,
  isLeaValleyLiveBike,
  isLeaValleySeller,
  leaValleyApprovedHireProducts,
} from "@/lib/lea-valley-guest";
import { loadAllSellers, saveAllSellers } from "@/lib/seller-storage";
import type { SellerProduct, SellerProfile } from "@/types";

export const LEA_VALLEY_SHOP_NAME = "lea valley cycle hire";

export function isLeaValleyCycleHireName(shop: {
  shopName?: string;
  tradingName?: string;
}): boolean {
  const name = `${shop.shopName ?? ""} ${shop.tradingName ?? ""}`.toLowerCase();
  return name.includes(LEA_VALLEY_SHOP_NAME);
}

function hireNameKey(name: string) {
  return name.trim().toLowerCase();
}

export type LeaValleyAdminRow = {
  /** localStorage key for this shop — Approve writes here. */
  ownerUid: string;
  product: SellerProduct;
};

/** Same badge rule as Seller Hub “Pending review”: not approved and not rejected. */
function isHubPending(product: SellerProduct): boolean {
  const status = product.status ?? "pending";
  return status !== "approved" && status !== "rejected";
}

function isLeaValleyRecord(shop: SellerProfile): boolean {
  if (isLeaValleySeller(shop)) return true;
  const label = `${shop.shopName ?? ""} ${shop.tradingName ?? ""} ${shop.slug ?? ""}`.toLowerCase();
  return label.includes("lea valley");
}

function isPendingHire(product: SellerProduct): boolean {
  if (isLeaValleyLiveBike(product) || isLeaValleyHireListing(product)) return false;
  if (!isHubPending(product)) return false;
  if (product.listingType === "rental") return true;
  return hireNameKey(product.name) === "test hire terms";
}

type StoredShop = { key: string; shop: SellerProfile };

function leaValleyShops(all: Record<string, SellerProfile>): StoredShop[] {
  const shops: StoredShop[] = [];
  for (const [key, shop] of Object.entries(all)) {
    if (isLeaValleyRecord(shop)) shops.push({ key, shop });
  }
  return shops;
}

/** Read-only. Does not rewrite listings or the five live bikes. */
export function readLeaValleyShopForAdmin(): {
  uid: string | null;
  pendingHires: number;
  products: SellerProduct[];
  rows: LeaValleyAdminRow[];
  pendingRows: LeaValleyAdminRow[];
  error: string | null;
} {
  try {
    const shops = leaValleyShops(loadAllSellers());
    if (shops.length === 0) {
      return {
        uid: null,
        pendingHires: 0,
        products: [],
        rows: [],
        pendingRows: [],
        error: null,
      };
    }

    const catalog = leaValleyAdminCatalog(shops);
    if (!catalog) {
      return {
        uid: null,
        pendingHires: 0,
        products: [],
        rows: [],
        pendingRows: [],
        error: null,
      };
    }
    const products = catalog.shop.products ?? [];
    const rows = products.map((product) => ({
      ownerUid: catalog.key,
      product,
    }));
    const pendingRows = rows.filter((row) => isPendingHire(row.product));

    return {
      uid: catalog.shop.uid || catalog.key,
      pendingHires: pendingRows.length,
      products,
      rows,
      pendingRows,
      error: null,
    };
  } catch (err) {
    console.warn("[admin] Lea Valley shop read failed", err);
    return {
      uid: null,
      pendingHires: 0,
      products: [],
      rows: [],
      pendingRows: [],
      error: "Could not load Lea Valley Cycle Hire.",
    };
  }
}

function isLiveBike(product: SellerProduct): boolean {
  return isLeaValleyLiveBike(product) || isLeaValleyHireListing(product);
}

function isDemoLeaValleyRecord(shop: SellerProfile, key: string): boolean {
  if (key === "demo-lea-valley-cycle-hire" || shop.uid === "demo-lea-valley-cycle-hire") {
    return true;
  }
  if (shop.email?.toLowerCase() === "hire@leavalleycycles.demo") return true;
  const products = shop.products ?? [];
  return (
    products.length > 0 &&
    products.every((product) => product.id.startsWith("demo-lv-pending"))
  );
}

/** The Lea Valley shop Admin lists — the one that already has the five bikes. */
function leaValleyAdminCatalog(shops: StoredShop[]): StoredShop | undefined {
  const withBikes = shops.filter((entry) =>
    (entry.shop.products ?? []).some((product) => isLeaValleyLiveBike(product))
  );
  const listed =
    withBikes.find((entry) => !isDemoLeaValleyRecord(entry.shop, entry.key)) ??
    withBikes[0];
  if (listed) return listed;
  return (
    shops.find((entry) => !isDemoLeaValleyRecord(entry.shop, entry.key)) ??
    shops.find((entry) => entry.shop.uid === "demo-lea-valley-cycle-hire") ??
    shops[0]
  );
}

/**
 * List hire item puts this pending row on the Lea Valley shop Admin already
 * lists. Does not approve it and does not change the five live bikes.
 * No write when that hire is already on the shop.
 */
export function savePendingHireOnAdminCatalog(hires: SellerProduct[]): boolean {
  const pending = hires.filter(
    (product) =>
      product.listingType === "rental" &&
      !isLiveBike(product) &&
      (product.status ?? "pending") !== "approved" &&
      (product.status ?? "pending") !== "rejected"
  );
  if (pending.length === 0) return false;
  const all = loadAllSellers();
  const catalog = leaValleyAdminCatalog(leaValleyShops(all));
  if (!catalog) return false;

  const products = catalog.shop.products ?? [];
  const additions: SellerProduct[] = [];
  for (const source of pending) {
    const name = hireNameKey(source.name);
    const already = products.some(
      (item) =>
        !isLiveBike(item) &&
        (item.id === source.id ||
          (name.length > 0 && hireNameKey(item.name) === name))
    );
    if (already) continue;
    additions.push({
      ...source,
      listingType: "rental",
      status: "pending",
      autoApproved: false,
      reviewedAt: undefined,
      tags: source.tags ?? [],
    });
  }
  if (additions.length === 0) return false;
  all[catalog.key] = {
    ...catalog.shop,
    products: [...products, ...additions],
  };
  saveAllSellers(all);
  return true;
}

/** Five approved bikes, plus hires Admin has approved. Does not write. */
export function leaValleyShopPageProducts(): SellerProduct[] {
  const base = leaValleyApprovedHireProducts();
  let extras: SellerProduct[] = [];
  try {
    const catalog = leaValleyAdminCatalog(leaValleyShops(loadAllSellers()));
    extras = (catalog?.shop.products ?? []).filter(
      (product) =>
        product.status === "approved" &&
        !product.autoApproved &&
        product.listingType === "rental" &&
        !isLiveBike(product)
    );
  } catch {
    extras = [];
  }
  const seen = new Set(base.map((product) => product.id));
  const names = new Set(base.map((product) => hireNameKey(product.name)));
  const add = extras
    .filter((product) => {
      if (seen.has(product.id)) return false;
      const name = hireNameKey(product.name);
      if (name.length > 0 && names.has(name)) return false;
      return true;
    })
    .map((product) => ({
      ...product,
      tags: product.tags ?? [],
      sales: product.sales ?? 0,
      views: product.views ?? 0,
      status: "approved" as const,
    }));
  return [...base, ...add];
}

/** Storage key that already holds this product. Does not create a listing. */
export function leaValleyStorageKeyFor(productId: string, fallback: string): string {
  const all = loadAllSellers();
  if (all[fallback]?.products?.some((product) => product.id === productId)) {
    return fallback;
  }
  for (const { key, shop } of leaValleyShops(all)) {
    if ((shop.products ?? []).some((product) => product.id === productId)) {
      return key;
    }
  }
  return fallback;
}

/**
 * Hybrid, Gravel, and half-day stay approved. Only a live bike that was
 * stored as pending is set back to approved. Other fields stay as stored.
 * No write when they are already approved.
 */
export function keepLiveBikesApproved(): boolean {
  const all = loadAllSellers();
  let changed = false;
  for (const { key, shop } of leaValleyShops(all)) {
    let shopChanged = false;
    const products = (shop.products ?? []).map((product) => {
      if (!isLiveBike(product)) return product;
      if (product.status === "rejected" || product.status === "approved") {
        return product;
      }
      shopChanged = true;
      return { ...product, status: "approved" as const };
    });
    if (!shopChanged) continue;
    all[key] = { ...shop, products };
    changed = true;
  }
  if (changed) saveAllSellers(all);
  return changed;
}
