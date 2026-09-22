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

export function readLeaValleyShopForAdmin(): {
  uid: string | null;
  pendingHires: number;
  products: SellerProduct[];
  error: string | null;
} {
  try {
    const all = loadAllSellers();
    const found = findLeaValleyShop(all);
    if (!found) {
      return { uid: null, pendingHires: 0, products: [], error: null };
    }
    const { shop, changed } = upsertHubHires(found);
    if (changed) {
      all[shop.uid] = shop;
      saveAllSellers(all);
    }
    const products = (shop.products ?? []).slice(0, 20);
    const pendingHires = products.filter(
      (product) =>
        product.listingType === "rental" &&
        (product.status ?? "pending") === "pending"
    ).length;
    return { uid: shop.uid, pendingHires, products, error: null };
  } catch (err) {
    console.warn("[admin] Lea Valley shop read failed", err);
    return {
      uid: null,
      pendingHires: 0,
      products: [],
      error: "Could not load Lea Valley Cycle Hire.",
    };
  }
}
