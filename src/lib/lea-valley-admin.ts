import { isLeaValleyLiveBike } from "@/lib/lea-valley-guest";
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

function isPendingHire(product: SellerProduct): boolean {
  if (isLeaValleyLiveBike(product)) return false;
  if ((product.status ?? "pending") !== "pending") return false;
  if (product.listingType === "rental") return true;
  return hireNameKey(product.name) === "test hire terms";
}

type StoredShop = { key: string; shop: SellerProfile };

function leaValleyShops(all: Record<string, SellerProfile>): StoredShop[] {
  const shops: StoredShop[] = [];
  for (const [key, shop] of Object.entries(all)) {
    if (isLeaValleyCycleHireName(shop)) shops.push({ key, shop });
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
    const uid = named?.ownerUid ?? pendingRows[0]?.ownerUid ?? withLiveBikes.key;
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

/**
 * Pending hires stay pending. Clears the trusted-seller flag on those rows
 * only. Approved bikes, including the five live ones, are left as stored.
 * Returns true when storage was written.
 */
export function turnOffPendingHireAutoApprove(): boolean {
  const all = loadAllSellers();
  let changed = false;
  for (const { key, shop } of leaValleyShops(all)) {
    let shopChanged = false;
    const products = (shop.products ?? []).map((product) => {
      if (!isPendingHire(product) || !product.autoApproved) return product;
      shopChanged = true;
      return {
        ...product,
        status: "pending" as const,
        autoApproved: false,
        reviewedAt: undefined,
      };
    });
    if (!shopChanged) continue;
    all[key] = { ...shop, products };
    changed = true;
  }
  if (changed) saveAllSellers(all);
  return changed;
}
