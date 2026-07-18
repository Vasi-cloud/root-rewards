import "server-only";

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";

import type { CauseSelection } from "@/lib/causes";
import { emptyCauseSelection } from "@/lib/causes";
import { CAUSE_IDS } from "@/lib/stripe/checkout-types";

export type OrderKind = "marketplace_order" | "impact_member";

export type ConfirmedOrder = {
  id: string;
  orderNumber: string;
  kind: OrderKind;
  sessionId: string;
  paymentStatus: string;
  amountTotalCents: number;
  currency: string;
  customerEmail: string | null;
  customerId: string | null;
  subscriptionId: string | null;
  userId: string | null;
  customerName: string | null;
  shipping: {
    address: string | null;
    city: string | null;
    zip: string | null;
  };
  causeSelection: CauseSelection;
  memberCreditCents: number;
  lineItems: Array<{
    name: string;
    quantity: number;
    amountCents: number;
  }>;
  fulfilledAt: string;
  fulfilledBy: "webhook" | "success_page" | "demo";
  status: "paid" | "fulfilled";
};

type OrderStore = {
  ordersBySession: Record<string, ConfirmedOrder>;
  processedEvents: Record<string, string>;
};

const globalKey = "__forest_buddies_order_store__";

function memoryStore(): OrderStore {
  const g = globalThis as typeof globalThis & {
    [globalKey]?: OrderStore;
  };
  if (!g[globalKey]) {
    g[globalKey] = { ordersBySession: {}, processedEvents: {} };
  }
  return g[globalKey]!;
}

function dataFilePath(): string {
  return path.join(process.cwd(), ".data", "stripe-orders.json");
}

function loadDisk(): OrderStore | null {
  try {
    const file = dataFilePath();
    if (!existsSync(file)) return null;
    const raw = readFileSync(file, "utf8");
    const parsed = JSON.parse(raw) as OrderStore;
    if (!parsed?.ordersBySession) return null;
    return {
      ordersBySession: parsed.ordersBySession ?? {},
      processedEvents: parsed.processedEvents ?? {},
    };
  } catch {
    return null;
  }
}

function saveDisk(store: OrderStore) {
  try {
    const dir = path.join(process.cwd(), ".data");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(dataFilePath(), JSON.stringify(store, null, 2), "utf8");
  } catch {
    // Serverless filesystems may be read-only — memory store still works per instance.
  }
}

function getStore(): OrderStore {
  const mem = memoryStore();
  if (Object.keys(mem.ordersBySession).length > 0) return mem;
  const disk = loadDisk();
  if (disk) {
    mem.ordersBySession = { ...disk.ordersBySession, ...mem.ordersBySession };
    mem.processedEvents = { ...disk.processedEvents, ...mem.processedEvents };
  }
  return mem;
}

export function getOrderBySessionId(sessionId: string): ConfirmedOrder | null {
  return getStore().ordersBySession[sessionId] ?? null;
}

export function saveConfirmedOrder(order: ConfirmedOrder): ConfirmedOrder {
  const store = getStore();
  const existing = store.ordersBySession[order.sessionId];
  if (existing) return existing;
  store.ordersBySession[order.sessionId] = order;
  saveDisk(store);
  return order;
}

/** Idempotent webhook event gate — returns false if already processed. */
export function markEventProcessed(eventId: string): boolean {
  const store = getStore();
  if (store.processedEvents[eventId]) return false;
  store.processedEvents[eventId] = new Date().toISOString();
  // Cap map size in long-running processes
  const keys = Object.keys(store.processedEvents);
  if (keys.length > 2000) {
    for (const k of keys.slice(0, keys.length - 1500)) {
      delete store.processedEvents[k];
    }
  }
  saveDisk(store);
  return true;
}

export function parseCauseSelectionFromMetadata(
  raw: string | null | undefined
): CauseSelection {
  const base = emptyCauseSelection();
  if (!raw) return base;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    for (const id of CAUSE_IDS) {
      const n = Number(parsed[id]);
      if (Number.isFinite(n) && n > 0) base[id] = Math.floor(n);
    }
  } catch {
    // ignore
  }
  return base;
}

export function makeOrderNumber(sessionId: string): string {
  return `FB-${sessionId.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase()}`;
}
