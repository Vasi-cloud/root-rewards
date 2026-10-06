import {
  isLeaValleyHireListing,
  isLeaValleyLiveBike,
  isLeaValleySeller,
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

    const rows: LeaValleyAdminRow[] = [];
    const pendingRows: LeaValleyAdminRow[] = [];
    for (const { key, shop } of shops) {
      for (const product of shop.products ?? []) {
        const row = { ownerUid: key, product };
        rows.push(row);
        if (isPendingHire(product)) pendingRows.push(row);
      }
    }

    const named = pendingRows.find(
      (row) => hireNameKey(row.product.name) === "test hire terms"
    );
    const withLiveBikes =
      shops.find((entry) =>
        (entry.shop.products ?? []).some((product) =>
          isLeaValleyLiveBike(product)
        )
      ) ??
      shops.find((entry) => entry.shop.uid === "demo-lea-valley-cycle-hire") ??
      shops[0];
    const namedShop = named
      ? shops.find((entry) => entry.key === named.ownerUid)
      : undefined;
    const uid =
      namedShop?.shop.uid ||
      named?.ownerUid ||
      withLiveBikes.shop.uid ||
      withLiveBikes.key;
    const products = rows
      .filter((row) => row.ownerUid === uid)
      .map((row) => row.product);

    return {
      uid,
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

/** The Seller Hub row "Test hire terms", still pending. Not one of the five bikes. */
export function findPendingTestHire(): LeaValleyAdminRow | null {
  for (const { key, shop } of leaValleyShops(loadAllSellers())) {
    for (const product of shop.products ?? []) {
      if (hireNameKey(product.name) !== "test hire terms") continue;
      if (isLiveBike(product) || !isHubPending(product)) continue;
      return {
        ownerUid: key,
        product: { ...product, status: "pending", autoApproved: false },
      };
    }
  }
  return null;
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
