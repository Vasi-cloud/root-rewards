import {
  updateSellerInStore,
  listSellerListings,
} from "@/lib/seller-storage";
import type {
  SellerAnalytics,
  SellerEarningsBreakdown,
  SellerProduct,
  SellerProfile,
} from "@/types";

export type SellerSaleLine = {
  sellerUid?: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  category?: string;
};

const PLATFORM_FEE_RATE = 0.15;
const CAUSE_RATE = 0.03;

function money(n: number) {
  return Number(n.toFixed(2));
}

/** Resolve seller from cart metadata or listing catalog. */
export function resolveSellerUidForProduct(
  productId: string,
  sellerUid?: string
): string | null {
  if (sellerUid) return sellerUid;
  const row = listSellerListings().find((r) => r.product.id === productId);
  return row?.sellerUid ?? null;
}

/** Live analytics blended from stored totals + per-listing metrics. */
export function deriveSellerAnalytics(seller: SellerProfile): SellerAnalytics {
  const productViews = seller.products.reduce((s, p) => s + (p.views || 0), 0);
  const productSales = seller.products.reduce((s, p) => s + (p.sales || 0), 0);
  const views = Math.max(seller.analytics.views, productViews);
  const sales = Math.max(seller.analytics.sales, productSales);
  const conversionRate =
    views > 0 ? Math.round((sales / views) * 1000) / 10 : 0;

  return {
    views,
    viewsThisMonth: seller.analytics.viewsThisMonth,
    sales,
    salesThisMonth: seller.analytics.salesThisMonth,
    conversionRate,
  };
}

export function averageOrderValue(seller: SellerProfile): number {
  const orders = Math.max(1, seller.earnings.orders || 0);
  return money(seller.earnings.total / orders);
}

export function topSellerProducts(
  products: SellerProduct[],
  limit = 5
): SellerProduct[] {
  return [...products]
    .sort((a, b) => b.sales - a.sales || b.views - a.views)
    .slice(0, limit);
}

export function rebuildBreakdown(
  seller: SellerProfile,
  periodGross?: number
): SellerEarningsBreakdown {
  const existing = seller.earnings.breakdown;
  const productSales = money(
    periodGross ??
      existing?.productSales ??
      seller.earnings.thisMonth / (1 - PLATFORM_FEE_RATE - CAUSE_RATE)
  );
  const platformFee = money(productSales * PLATFORM_FEE_RATE);
  const causeContribution = money(productSales * CAUSE_RATE);
  const sellerShare = money(productSales - platformFee - causeContribution);

  const byCategoryMap = new Map<string, number>();
  for (const p of seller.products) {
    if (!p.sales) continue;
    const amount = money(p.sales * p.price);
    byCategoryMap.set(
      p.category,
      money((byCategoryMap.get(p.category) ?? 0) + amount)
    );
  }
  let byCategory = [...byCategoryMap.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  if (byCategory.length === 0 && existing?.byCategory?.length) {
    byCategory = existing.byCategory;
  }

  return {
    productSales,
    platformFee,
    sellerShare,
    causeContribution,
    byCategory,
  };
}

/** Increment shop views once per browser session per seller. */
export function recordShopView(sellerUid: string) {
  if (typeof window === "undefined" || !sellerUid) return;
  const key = `fb-shop-viewed-${sellerUid}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // continue without dedupe
  }
  updateSellerInStore(sellerUid, (seller) => ({
    ...seller,
    analytics: {
      ...seller.analytics,
      views: seller.analytics.views + 1,
      viewsThisMonth: seller.analytics.viewsThisMonth + 1,
    },
  }));
}

/** Credit seller earnings + listing sales after checkout. */
export function recordSellerSales(lines: SellerSaleLine[]): number {
  if (typeof window === "undefined" || lines.length === 0) return 0;

  const grouped = new Map<string, SellerSaleLine[]>();
  for (const line of lines) {
    if (!line.productId || line.quantity < 1 || line.unitPrice < 0) continue;
    const uid = resolveSellerUidForProduct(line.productId, line.sellerUid);
    if (!uid) continue;
    const list = grouped.get(uid) ?? [];
    list.push({ ...line, sellerUid: uid });
    grouped.set(uid, list);
  }

  let credited = 0;
  for (const [uid, sellerLines] of grouped) {
    const updated = updateSellerInStore(uid, (seller) => {
      let gross = 0;
      let units = 0;
      const products = seller.products.map((p) => {
        const hits = sellerLines.filter((l) => l.productId === p.id);
        if (hits.length === 0) return p;
        const qty = hits.reduce((s, h) => s + h.quantity, 0);
        const lineGross = hits.reduce(
          (s, h) => s + h.unitPrice * h.quantity,
          0
        );
        gross += lineGross;
        units += qty;
        return {
          ...p,
          sales: (p.sales || 0) + qty,
          stock: Math.max(0, p.stock - qty),
        };
      });

      if (gross <= 0) return seller;

      const platformFee = money(gross * PLATFORM_FEE_RATE);
      const causeContribution = money(gross * CAUSE_RATE);
      const net = money(gross - platformFee - causeContribution);

      const analyticsBase = {
        ...seller.analytics,
        sales: seller.analytics.sales + units,
        salesThisMonth: seller.analytics.salesThisMonth + units,
      };
      const nextSeller: SellerProfile = {
        ...seller,
        products,
        earnings: {
          ...seller.earnings,
          total: money(seller.earnings.total + net),
          available: money((seller.earnings.available ?? 0) + net * 0.65),
          pending: money(seller.earnings.pending + net * 0.35),
          thisMonth: money(seller.earnings.thisMonth + net),
          orders: seller.earnings.orders + units,
        },
        analytics: {
          ...analyticsBase,
          conversionRate: deriveSellerAnalytics({
            ...seller,
            products,
            analytics: analyticsBase,
          }).conversionRate,
        },
      };

      const prevGross = seller.earnings.breakdown?.productSales ?? 0;
      nextSeller.earnings.breakdown = rebuildBreakdown(
        nextSeller,
        money(prevGross + gross)
      );
      return nextSeller;
    });
    if (updated) credited += 1;
  }

  return credited;
}
