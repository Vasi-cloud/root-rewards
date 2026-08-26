import {
  emptyCauseGifts,
  parseCauseGifts,
  type CauseGiftAmounts,
  type CauseSelection,
} from "@/lib/causes";
import type { SellerSaleLine } from "@/lib/seller-analytics";

export const PENDING_CHECKOUT_KEY = "forest-buddies-pending-checkout";

export type PendingCheckoutOrder = {
  selection: CauseSelection;
  /** Exact £ gifts submitted — thank-you / impact lines must use this */
  gifts: CauseGiftAmounts;
  memberCreditApplied: boolean;
  orderTotal: number;
  cartSubtotal: number;
  weightedAffiliatePercent: number;
  productName?: string;
  productId?: string;
  /** Seller attribution for earnings after payment */
  sellerLines?: SellerSaleLine[];
  email: string;
  name: string;
  createdAt: string;
};

export function savePendingCheckout(order: PendingCheckoutOrder) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(order));
  } catch {
    // ignore
  }
}

export function loadPendingCheckout(): PendingCheckoutOrder | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PENDING_CHECKOUT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingCheckoutOrder>;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      ...parsed,
      selection: parsed.selection ?? ({} as CauseSelection),
      gifts: parseCauseGifts(parsed.gifts ?? emptyCauseGifts()),
      memberCreditApplied: Boolean(parsed.memberCreditApplied),
      orderTotal: Number(parsed.orderTotal) || 0,
      cartSubtotal: Number(parsed.cartSubtotal) || 0,
      weightedAffiliatePercent: Number(parsed.weightedAffiliatePercent) || 0,
      email: typeof parsed.email === "string" ? parsed.email : "",
      name: typeof parsed.name === "string" ? parsed.name : "",
      createdAt:
        typeof parsed.createdAt === "string"
          ? parsed.createdAt
          : new Date().toISOString(),
    } as PendingCheckoutOrder;
  } catch {
    return null;
  }
}

export function clearPendingCheckout() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
  } catch {
    // ignore
  }
}
