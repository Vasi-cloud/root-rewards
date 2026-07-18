import type { CartItem } from "@/types";

export const ABANDONED_CART_KEY = "forest-buddies-abandoned-cart";

export interface MockReminderEmail {
  id: string;
  to: string;
  subject: string;
  preview: string;
  sentAt: string;
  itemCount: number;
  totalPrice: number;
}

export interface AbandonedCartState {
  /** True when the shopper left with items still in the cart */
  flagged: boolean;
  flaggedAt: string | null;
  itemCount: number;
  previewNames: string[];
  totalPrice: number;
  dismissedAt: string | null;
  mockEmails: MockReminderEmail[];
}

function emptyState(): AbandonedCartState {
  return {
    flagged: false,
    flaggedAt: null,
    itemCount: 0,
    previewNames: [],
    totalPrice: 0,
    dismissedAt: null,
    mockEmails: [],
  };
}

export function loadAbandonedCart(): AbandonedCartState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = localStorage.getItem(ABANDONED_CART_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<AbandonedCartState>;
    return {
      ...emptyState(),
      ...parsed,
      mockEmails: Array.isArray(parsed.mockEmails) ? parsed.mockEmails : [],
      previewNames: Array.isArray(parsed.previewNames)
        ? parsed.previewNames
        : [],
    };
  } catch {
    return emptyState();
  }
}

export function saveAbandonedCart(state: AbandonedCartState) {
  try {
    localStorage.setItem(ABANDONED_CART_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event("forest-buddies-abandoned-cart-updated"));
  } catch {
    // ignore
  }
}

/** Call when the shopper leaves (or hides) the tab with a non-empty cart. */
export function flagAbandonedCart(cart: CartItem[]) {
  if (cart.length === 0) {
    clearAbandonedFlag();
    return;
  }
  const totalPrice = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const prev = loadAbandonedCart();
  saveAbandonedCart({
    ...prev,
    flagged: true,
    flaggedAt: new Date().toISOString(),
    itemCount: cart.reduce((s, i) => s + i.quantity, 0),
    previewNames: cart.slice(0, 3).map((i) => i.name),
    totalPrice: Number(totalPrice.toFixed(2)),
    dismissedAt: null,
  });
}

export function clearAbandonedFlag() {
  const prev = loadAbandonedCart();
  saveAbandonedCart({
    ...prev,
    flagged: false,
    flaggedAt: null,
    itemCount: 0,
    previewNames: [],
    totalPrice: 0,
    dismissedAt: null,
  });
}

export function dismissAbandonedReminder() {
  const prev = loadAbandonedCart();
  saveAbandonedCart({
    ...prev,
    flagged: false,
    dismissedAt: new Date().toISOString(),
  });
}

/** Mock “we emailed you” — no real send. */
export function sendMockAbandonedEmail(opts: {
  email: string;
  cart: CartItem[];
}): MockReminderEmail {
  const totalPrice = opts.cart.reduce(
    (s, i) => s + i.price * i.quantity,
    0
  );
  const itemCount = opts.cart.reduce((s, i) => s + i.quantity, 0);
  const names = opts.cart
    .slice(0, 2)
    .map((i) => i.name)
    .join(", ");
  const mail: MockReminderEmail = {
    id: `mail-${Date.now()}`,
    to: opts.email.trim() || "you@example.com",
    subject: "Your sustainable picks are waiting",
    preview: `Still thinking it over? ${names}${
      opts.cart.length > 2 ? ", and more" : ""
    } — $${totalPrice.toFixed(2)} in your Forest Buddies cart.`,
    sentAt: new Date().toISOString(),
    itemCount,
    totalPrice: Number(totalPrice.toFixed(2)),
  };
  const prev = loadAbandonedCart();
  saveAbandonedCart({
    ...prev,
    mockEmails: [mail, ...prev.mockEmails].slice(0, 10),
  });
  return mail;
}

export function shouldShowAbandonedReminder(
  cartLength: number,
  state: AbandonedCartState = loadAbandonedCart()
): boolean {
  return cartLength > 0 && state.flagged;
}
