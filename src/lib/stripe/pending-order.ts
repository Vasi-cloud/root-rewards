import type { CauseSelection } from "@/lib/causes";
import type { SellerSaleLine } from "@/lib/seller-analytics";

export const PENDING_CHECKOUT_KEY = "forest-buddies-pending-checkout";

export type PendingCheckoutOrder = {
  selection: CauseSelection;
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
    return JSON.parse(raw) as PendingCheckoutOrder;
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
