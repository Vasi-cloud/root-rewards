import type { CartItem } from "@/types";

export const ABANDONED_CART_KEY = "forest-buddies-abandoned-cart";
export const ABANDONED_SESSION_SHOWN_KEY = "forest-buddies-abandoned-shown";

/** Must be away at least this long before a return counts as abandoned. */
export const MIN_AWAY_MS = 5 * 60 * 1000;
/** After dismiss, don't nag again for a day. */
export const DISMISS_COOLDOWN_MS = 24 * 60 * 60 * 1000;
/** After showing once, wait before another reminder. */
export const RESHOW_COOLDOWN_MS = 12 * 60 * 60 * 1000;

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
  lastShownAt: string | null;
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
    lastShownAt: null,
    mockEmails: [],
  };
}

function cartSnapshot(cart: CartItem[]) {
  const totalPrice = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  return {
    itemCount: cart.reduce((s, i) => s + i.quantity, 0),
    previewNames: cart.slice(0, 3).map((i) => i.name),
    totalPrice: Number(totalPrice.toFixed(2)),
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

function inCooldown(iso: string | null | undefined, ms: number): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < ms;
}

function shownThisSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(ABANDONED_SESSION_SHOWN_KEY) === "1";
  } catch {
    return false;
  }
}

function markShownThisSession() {
  try {
    sessionStorage.setItem(ABANDONED_SESSION_SHOWN_KEY, "1");
  } catch {
    // ignore
  }
}

/**
 * Call when the shopper truly leaves the page (pagehide / unload)
 * with a non-empty cart — not on brief tab switches.
 */
export function flagAbandonedCart(cart: CartItem[]) {
  if (cart.length === 0) {
    clearAbandonedFlag();
    return;
  }
  const prev = loadAbandonedCart();
  // Respect an active dismiss — don't re-arm until cooldown ends
  if (inCooldown(prev.dismissedAt, DISMISS_COOLDOWN_MS)) {
    saveAbandonedCart({
      ...prev,
      ...cartSnapshot(cart),
      flagged: false,
    });
    return;
  }
  saveAbandonedCart({
    ...prev,
    ...cartSnapshot(cart),
    flagged: true,
    flaggedAt: new Date().toISOString(),
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
  });
}

export function dismissAbandonedReminder() {
  const prev = loadAbandonedCart();
  markShownThisSession();
  saveAbandonedCart({
    ...prev,
    flagged: false,
    dismissedAt: new Date().toISOString(),
    lastShownAt: new Date().toISOString(),
  });
}

/** Mark that the nudge was displayed so refresh / next nav won't re-open it. */
export function markAbandonedReminderShown() {
  const prev = loadAbandonedCart();
  markShownThisSession();
  saveAbandonedCart({
    ...prev,
    flagged: false,
    lastShownAt: new Date().toISOString(),
  });
}

/** Record a reminder locally after the server send (live or demo). */
export function recordAbandonedEmail(opts: {
  email: string;
  cart: CartItem[];
  mode?: "live" | "demo";
  providerId?: string;
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
    id: opts.providerId ?? `mail-${Date.now()}`,
    to: opts.email.trim() || "you@example.com",
    subject: "Your sustainable picks are waiting",
    preview: `Still thinking it over? ${names}${
      opts.cart.length > 2 ? ", and more" : ""
    } — $${totalPrice.toFixed(2)} in your Forest Buddies cart.${
      opts.mode === "live" ? "" : " (demo inbox)"
    }`,
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

/** @deprecated use recordAbandonedEmail after API send */
export function sendMockAbandonedEmail(opts: {
  email: string;
  cart: CartItem[];
}): MockReminderEmail {
  return recordAbandonedEmail({ ...opts, mode: "demo" });
}

/**
 * Show only when: cart has items, shopper left long enough ago,
 * not dismissed recently, and not already shown this session.
 */
export function shouldShowAbandonedReminder(
  cartLength: number,
  state: AbandonedCartState = loadAbandonedCart()
): boolean {
  if (cartLength <= 0) return false;
  if (!state.flagged || !state.flaggedAt) return false;
  if (shownThisSession()) return false;
  if (inCooldown(state.dismissedAt, DISMISS_COOLDOWN_MS)) return false;
  if (inCooldown(state.lastShownAt, RESHOW_COOLDOWN_MS)) return false;

  const awayMs = Date.now() - new Date(state.flaggedAt).getTime();
  if (Number.isNaN(awayMs) || awayMs < MIN_AWAY_MS) return false;

  return true;
}
