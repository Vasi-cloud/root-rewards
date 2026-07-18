import {
  attributionExpiry,
  buildPartnerOutboundUrl,
  computeCommission,
  estimateExternalOrderTotal,
  generateAffiliateCode,
  isAttributionValid,
} from "@/lib/affiliate";
import {
  getAffiliatePlatform,
  type AffiliatePlatform,
} from "@/lib/affiliate-platforms";
import { loadMembership } from "@/lib/membership-storage";
import type {
  AffiliateAttribution,
  AffiliateEvent,
  AffiliatePlatformId,
  AffiliateStats,
} from "@/types";

export const AFFILIATE_STORAGE_KEY = "forest-buddies-affiliate";

export interface AffiliateCodeLedger {
  code: string;
  clicks: number;
  conversions: number;
  earnings: number;
  pendingPayout: number;
  /** External partner reports awaiting confirmation */
  pendingPartnerReports: number;
  events: AffiliateEvent[];
}

export interface AffiliateStore {
  myCode: string;
  attribution: AffiliateAttribution | null;
  ledgers: Record<string, AffiliateCodeLedger>;
  updatedAt: string;
}

function emptyLedger(code: string): AffiliateCodeLedger {
  return {
    code,
    clicks: 0,
    conversions: 0,
    earnings: 0,
    pendingPayout: 0,
    pendingPartnerReports: 0,
    events: [],
  };
}

function emptyStore(): AffiliateStore {
  const myCode = generateAffiliateCode("forest");
  return {
    myCode,
    attribution: null,
    ledgers: { [myCode]: emptyLedger(myCode) },
    updatedAt: new Date().toISOString(),
  };
}

function normalizeLedger(
  code: string,
  raw?: Partial<AffiliateCodeLedger>
): AffiliateCodeLedger {
  return {
    ...emptyLedger(code),
    ...raw,
    code,
    pendingPartnerReports: raw?.pendingPartnerReports ?? 0,
    events: Array.isArray(raw?.events) ? raw!.events! : [],
  };
}

export function loadAffiliateStore(): AffiliateStore {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = localStorage.getItem(AFFILIATE_STORAGE_KEY);
    if (!raw) {
      const fresh = emptyStore();
      saveAffiliateStore(fresh);
      return fresh;
    }
    const parsed = JSON.parse(raw) as Partial<AffiliateStore>;
    const myCode = parsed.myCode || generateAffiliateCode("forest");
    const ledgers: Record<string, AffiliateCodeLedger> = {};
    for (const [key, value] of Object.entries(parsed.ledgers ?? {})) {
      ledgers[key] = normalizeLedger(key, value);
    }
    if (!ledgers[myCode]) ledgers[myCode] = emptyLedger(myCode);
    return {
      myCode,
      attribution: parsed.attribution ?? null,
      ledgers,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return emptyStore();
  }
}

export function saveAffiliateStore(store: AffiliateStore) {
  try {
    store.updatedAt = new Date().toISOString();
    localStorage.setItem(AFFILIATE_STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new Event("forest-buddies-affiliate-updated"));
  } catch {
    // ignore
  }
}

export function ensureMyAffiliateCode(preferred?: string): string {
  const store = loadAffiliateStore();
  if (preferred && preferred !== store.myCode) {
    if (!store.ledgers[preferred]) {
      store.ledgers[preferred] = {
        ...emptyLedger(preferred),
        ...store.ledgers[store.myCode],
        code: preferred,
      };
    }
    store.myCode = preferred;
    saveAffiliateStore(store);
  }
  return store.myCode;
}

export function getMyAffiliateStats(code?: string): AffiliateStats {
  const store = loadAffiliateStore();
  const key = code ?? store.myCode;
  const ledger = store.ledgers[key] ?? emptyLedger(key);
  return {
    clicks: ledger.clicks,
    conversions: ledger.conversions,
    earnings: ledger.earnings,
    pendingPayout: ledger.pendingPayout,
    pendingPartnerReports: ledger.pendingPartnerReports,
  };
}

export function getStatsByPlatform(
  code?: string
): Record<AffiliatePlatformId, AffiliateStats> {
  const store = loadAffiliateStore();
  const key = code ?? store.myCode;
  const ledger = store.ledgers[key] ?? emptyLedger(key);
  const base: Record<string, AffiliateStats> = {};

  for (const ev of ledger.events) {
    const pid = (ev.platformId ?? "forest-buddies") as AffiliatePlatformId;
    if (!base[pid]) {
      base[pid] = {
        clicks: 0,
        conversions: 0,
        earnings: 0,
        pendingPayout: 0,
        pendingPartnerReports: 0,
      };
    }
    const row = base[pid];
    if (ev.type === "click" || ev.type === "outbound") row.clicks += 1;
    if (ev.type === "conversion") {
      if (ev.status === "pending") {
        row.pendingPartnerReports =
          (row.pendingPartnerReports ?? 0) + (ev.commission ?? 0);
      } else if (ev.status !== "reversed") {
        row.conversions += 1;
        row.earnings += ev.commission ?? 0;
        row.pendingPayout += ev.commission ?? 0;
      }
    }
  }

  return base as Record<AffiliatePlatformId, AffiliateStats>;
}

export function getMyAffiliateEvents(limit = 20): AffiliateEvent[] {
  const store = loadAffiliateStore();
  const ledger = store.ledgers[store.myCode] ?? emptyLedger(store.myCode);
  return [...ledger.events]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export function getActiveAttribution(): AffiliateAttribution | null {
  const store = loadAffiliateStore();
  if (!store.attribution) return null;
  if (!isAttributionValid(store.attribution.expiresAt)) {
    store.attribution = null;
    saveAffiliateStore(store);
    return null;
  }
  return store.attribution;
}

function pushEvent(ledger: AffiliateCodeLedger, event: AffiliateEvent) {
  ledger.events = [event, ...ledger.events].slice(0, 120);
}

/**
 * Capture first-party ?ref= landing. Uses Forest Buddies attribution window.
 */
export function captureReferral(opts: {
  code: string;
  productId?: string;
  productName?: string;
  landingPath?: string;
}): AffiliateAttribution | null {
  const code = opts.code.trim().toUpperCase();
  if (!code || code.length < 3) return null;

  const store = loadAffiliateStore();
  if (code === store.myCode) return store.attribution;

  if (!store.ledgers[code]) store.ledgers[code] = emptyLedger(code);

  const now = new Date();
  const platformId: AffiliatePlatformId = "forest-buddies";
  const event: AffiliateEvent = {
    id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: "click",
    code,
    platformId,
    productId: opts.productId,
    productName: opts.productName,
    createdAt: now.toISOString(),
  };

  store.ledgers[code].clicks += 1;
  pushEvent(store.ledgers[code], event);

  store.attribution = {
    code,
    capturedAt: now.toISOString(),
    expiresAt: attributionExpiry(now, platformId),
    platformId,
    productId: opts.productId,
    productName: opts.productName,
    landingPath: opts.landingPath,
  };

  saveAffiliateStore(store);
  return store.attribution;
}

/**
 * Record an outbound click to Amazon / Target / REI (or other partners).
 * Returns the destination URL to open. Does not confirm a sale — partners report later.
 */
export function recordPartnerOutboundClick(opts: {
  platformId: AffiliatePlatformId;
  productId?: string;
  productName: string;
  /** Competitor list price for demo pending estimates */
  listPrice?: number;
}): { url: string; event: AffiliateEvent } {
  const store = loadAffiliateStore();
  const code = store.myCode;
  if (!store.ledgers[code]) store.ledgers[code] = emptyLedger(code);

  const platform = getAffiliatePlatform(opts.platformId);
  const now = new Date();
  const url = buildPartnerOutboundUrl({
    platformId: opts.platformId,
    productName: opts.productName,
    productId: opts.productId,
    affiliateCode: code,
  });

  const event: AffiliateEvent = {
    id: `ob-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: "outbound",
    code,
    platformId: opts.platformId,
    productId: opts.productId,
    productName: opts.productName,
    destination: new URL(url).hostname.replace(/^www\./, ""),
    createdAt: now.toISOString(),
  };

  store.ledgers[code].clicks += 1;
  pushEvent(store.ledgers[code], event);

  // Seed a pending partner report for delayed platforms (demo realism)
  if (platform.conversionLatency === "delayed" && opts.listPrice) {
    const orderTotal = estimateExternalOrderTotal(opts.listPrice, platform);
    const commission = computeCommission({
      orderTotal,
      basePercent: platform.commissionRateTypical,
      platformId: opts.platformId,
    });
    const pending: AffiliateEvent = {
      id: `pd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: "conversion",
      code,
      platformId: opts.platformId,
      productId: opts.productId,
      productName: opts.productName,
      orderTotal,
      commission,
      status: "pending",
      destination: event.destination,
      createdAt: now.toISOString(),
    };
    store.ledgers[code].pendingPartnerReports = Number(
      (store.ledgers[code].pendingPartnerReports + commission).toFixed(2)
    );
    pushEvent(store.ledgers[code], pending);
  }

  saveAffiliateStore(store);
  return { url, event };
}

/**
 * Confirm pending external partner reports (simulates Amazon / network posting).
 */
export function confirmPendingPartnerReports(limit = 5): number {
  const store = loadAffiliateStore();
  const ledger = store.ledgers[store.myCode];
  if (!ledger) return 0;

  let confirmed = 0;
  for (const ev of ledger.events) {
    if (confirmed >= limit) break;
    if (ev.type !== "conversion" || ev.status !== "pending") continue;
    ev.status = "confirmed";
    const commission = ev.commission ?? 0;
    ledger.conversions += 1;
    ledger.earnings = Number((ledger.earnings + commission).toFixed(2));
    ledger.pendingPayout = Number(
      (ledger.pendingPayout + commission).toFixed(2)
    );
    ledger.pendingPartnerReports = Math.max(
      0,
      Number((ledger.pendingPartnerReports - commission).toFixed(2))
    );
    confirmed += 1;
  }

  if (confirmed > 0) saveAffiliateStore(store);
  return confirmed;
}

/**
 * First-party Forest Buddies checkout conversion.
 */
export function recordAffiliateConversion(opts: {
  orderTotal: number;
  basePercent?: number;
  productId?: string;
  productName?: string;
}): AffiliateEvent | null {
  const attr = getActiveAttribution();
  if (!attr) return null;

  const store = loadAffiliateStore();
  const code = attr.code;
  if (!store.ledgers[code]) store.ledgers[code] = emptyLedger(code);

  const platformId: AffiliatePlatformId =
    attr.platformId ?? "forest-buddies";
  const membershipTier =
    code === store.myCode ? loadMembership().tierId : "free";

  const commission = computeCommission({
    orderTotal: opts.orderTotal,
    basePercent: opts.basePercent ?? 12,
    membershipTier,
    platformId,
  });

  const event: AffiliateEvent = {
    id: `cv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: "conversion",
    code,
    platformId,
    productId: opts.productId ?? attr.productId,
    productName: opts.productName ?? attr.productName,
    orderTotal: opts.orderTotal,
    commission,
    status: "confirmed",
    createdAt: new Date().toISOString(),
  };

  const ledger = store.ledgers[code];
  ledger.conversions += 1;
  ledger.earnings = Number((ledger.earnings + commission).toFixed(2));
  ledger.pendingPayout = Number(
    (ledger.pendingPayout + commission).toFixed(2)
  );
  pushEvent(ledger, event);

  saveAffiliateStore(store);
  return event;
}

export function describeEvent(ev: AffiliateEvent): string {
  const platform = getAffiliatePlatform(ev.platformId ?? "forest-buddies");
  if (ev.type === "outbound") {
    return `Outbound → ${platform.name}`;
  }
  if (ev.type === "click") {
    return `Click · ${platform.name}`;
  }
  if (ev.status === "pending") {
    return `Pending report · ${platform.name}`;
  }
  if (ev.status === "reversed") {
    return `Reversed · ${platform.name}`;
  }
  return `Conversion · ${platform.name}`;
}

export type { AffiliatePlatform };
