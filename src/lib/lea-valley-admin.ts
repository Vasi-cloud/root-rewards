import { loadAllSellers, saveAllSellers } from "@/lib/seller-storage";
import type { SellerProduct, SellerProfile } from "@/types";

export const LEA_VALLEY_SHOP_NAME = "lea valley cycle hire";

const HUB_HIRES: {
  id: string;
  name: string;
  price: number;
  hirePeriod: string;
}[] = [
  {
    id: "lv-hub-half-day",
    name: "Hybrid bike half-day hire",
    price: 18,
    hirePeriod: "half day",
  },
  {
    id: "lv-hub-full-day",
    name: "Hybrid bike full-day hire",
    price: 28,
    hirePeriod: "full day",
  },
  {
    id: "lv-hub-weekend",
    name: "Gravel bike weekend hire",
    price: 45,
    hirePeriod: "weekend",
  },
];

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

/** Lea Valley shops only — does not read other shops' listings. */
function findLeaValleyShop(
  all: Record<string, SellerProfile>
): SellerProfile | null {
  const matches: SellerProfile[] = [];
  for (const shop of Object.values(all)) {
    if (isLeaValleyCycleHireName(shop)) matches.push(shop);
  }
  if (matches.length === 0) return null;
  const withDemoHires = matches.find((shop) =>
    (shop.products ?? []).some((product) =>
      /city bike|e-bike/i.test(product.name)
    )
  );
  return (
    withDemoHires ??
    matches.find((shop) => shop.uid === "demo-lea-valley-cycle-hire") ??
    matches[0]
  );
}

function demoteAutoApprovedHires(shop: SellerProfile): {
  shop: SellerProfile;
  changed: boolean;
} {
  let changed = false;
  const products = (shop.products ?? []).map((product) => {
    if (
      product.listingType === "rental" &&
      product.autoApproved &&
      product.status === "approved"
    ) {
      changed = true;
      return {
        ...product,
        status: "pending" as const,
        autoApproved: false,
      };
    }
    return product;
  });
  return { shop: changed ? { ...shop, products } : shop, changed };
}

function upsertHubHires(shop: SellerProfile): {
  shop: SellerProfile;
  changed: boolean;
} {
  const products = [...(shop.products ?? [])];
  let changed = false;
  const now = new Date().toISOString();
  for (const hire of HUB_HIRES) {
    const key = hireNameKey(hire.name);
    if (products.some((product) => hireNameKey(product.name) === key)) continue;
    const row: SellerProduct = {
      id: hire.id,
      listingType: "rental",
      name: hire.name,
      subtitle: hire.hirePeriod,
      description: `${hire.name} from Lea Valley Cycle Hire.`,
      category: "Cycling",
      tags: ["hire", "cycling"],
      price: hire.price,
      ecoScore: 90,
      stock: 1,
      hirePeriod: hire.hirePeriod,
      priceNote: hire.hirePeriod,
      status: "pending",
      views: 0,
      sales: 0,
      createdAt: now,
    };
    products.push(row);
    changed = true;
  }
  return { shop: changed ? { ...shop, products } : shop, changed };
}

export type LeaValleyAdminRow = {
  ownerUid: string;
  product: SellerProduct;
};

function isPendingHire(product: SellerProduct): boolean {
  return (
    product.listingType === "rental" &&
    (product.status ?? "pending") === "pending"
  );
}

/** Pending hires first so a new hire stays inside the 20-row cap. */
function rowsForShop(shop: SellerProfile): LeaValleyAdminRow[] {
  const pending: LeaValleyAdminRow[] = [];
  const rest: LeaValleyAdminRow[] = [];
  for (const product of shop.products ?? []) {
    const row = { ownerUid: shop.uid, product };
    if (isPendingHire(product)) pending.push(row);
    else rest.push(row);
  }
  return [...pending, ...rest].slice(0, 20);
}

export function readLeaValleyShopForAdmin(): {
  uid: string | null;
  pendingHires: number;
  products: SellerProduct[];
  rows: LeaValleyAdminRow[];
  error: string | null;
} {
  try {
    const all = loadAllSellers();
    const matches = Object.values(all).filter((shop) =>
      isLeaValleyCycleHireName(shop)
    );
    const found = findLeaValleyShop(all);
    if (!found && matches.length === 0) {
      return {
        uid: null,
        pendingHires: 0,
        products: [],
        rows: [],
        error: null,
      };
    }

    const primary = found ?? matches[0];
    let changed = false;
    for (const shop of matches.length > 0 ? matches : [primary]) {
      const demoted = demoteAutoApprovedHires(shop);
      const next =
        demoted.shop.uid === primary.uid
          ? upsertHubHires(demoted.shop)
          : { shop: demoted.shop, changed: false };
      if (demoted.changed || next.changed) {
        all[next.shop.uid] = next.shop;
        changed = true;
      }
    }
    if (changed) saveAllSellers(all);

    const shops = Object.values(all).filter((shop) =>
      isLeaValleyCycleHireName(shop)
    );
    const rows = shops.flatMap((shop) => rowsForShop(shop));
    const pendingRows = shops.flatMap((shop) =>
      (shop.products ?? [])
        .filter(isPendingHire)
        .map((product) => ({ ownerUid: shop.uid, product }))
    );
    const hubNames = new Set(HUB_HIRES.map((hire) => hireNameKey(hire.name)));
    const namedHire = pendingRows.find(
      (row) => hireNameKey(row.product.name) === "test hire terms"
    );
    const sellerAdded = pendingRows.find(
      (row) => !hubNames.has(hireNameKey(row.product.name))
    );
    const uid = namedHire?.ownerUid ?? sellerAdded?.ownerUid ?? primary.uid;
    const products = rows
      .filter((row) => row.ownerUid === uid)
      .map((row) => row.product);
    return {
      uid,
      pendingHires: pendingRows.length,
      products,
      rows,
      error: null,
    };
  } catch (err) {
    console.warn("[admin] Lea Valley shop read failed", err);
    return {
      uid: null,
      pendingHires: 0,
      products: [],
      rows: [],
      error: "Could not load Lea Valley Cycle Hire.",
    };
  }
}
