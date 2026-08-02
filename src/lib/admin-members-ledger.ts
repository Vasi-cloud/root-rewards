/**
 * Admin-only membership ledger (localStorage).
 * Soft-launch: records Impact memberships from this device’s upgrade flows.
 */

import { getMembershipTier } from "@/lib/membership";
import type { MembershipTierId } from "@/types";

const KEY = "forest-buddies-admin-members";
const EVENT = "forest-buddies-admin-members-updated";

export type AdminMemberStatus = "active" | "cancelled";

export type AdminMemberRecord = {
  id: string;
  email: string | null;
  displayName: string | null;
  tierId: MembershipTierId;
  tierLabel: string;
  status: AdminMemberStatus;
  startedAt: string;
  amountMonthly: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  updatedAt: string;
};

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT));
  }
}

export function subscribeAdminMembers(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function loadRaw(): AdminMemberRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AdminMemberRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRaw(rows: AdminMemberRecord[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(rows.slice(0, 500)));
    emit();
  } catch {
    // ignore
  }
}

export function loadAdminMembers(): AdminMemberRecord[] {
  return loadRaw().sort(
    (a, b) => +new Date(b.startedAt) - +new Date(a.startedAt)
  );
}

export function countActiveAdminMembers(): number {
  return loadAdminMembers().filter((m) => m.status === "active").length;
}

/**
 * Upsert a membership row (by email or stripe customer / subscription id).
 */
export function upsertAdminMember(input: {
  email?: string | null;
  displayName?: string | null;
  tierId: MembershipTierId;
  status: AdminMemberStatus;
  startedAt?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}): AdminMemberRecord | null {
  if (input.tierId === "free" && input.status !== "cancelled") {
    return null;
  }

  const tier = getMembershipTier(input.tierId);
  const email = input.email?.trim() || null;
  const now = new Date().toISOString();
  const startedAt = input.startedAt ?? now;
  const rows = loadRaw();

  const matchIndex = rows.findIndex((r) => {
    if (email && r.email && r.email.toLowerCase() === email.toLowerCase()) {
      return true;
    }
    if (
      input.stripeSubscriptionId &&
      r.stripeSubscriptionId === input.stripeSubscriptionId
    ) {
      return true;
    }
    if (
      input.stripeCustomerId &&
      r.stripeCustomerId === input.stripeCustomerId
    ) {
      return true;
    }
    return false;
  });

  const next: AdminMemberRecord = {
    id:
      matchIndex >= 0
        ? rows[matchIndex].id
        : `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    email,
    displayName: input.displayName?.trim() || null,
    tierId: input.tierId === "impact" ? "impact" : input.tierId,
    tierLabel: tier.name,
    status: input.status,
    startedAt:
      matchIndex >= 0 ? rows[matchIndex].startedAt || startedAt : startedAt,
    amountMonthly: tier.priceMonthly,
    stripeCustomerId: input.stripeCustomerId ?? null,
    stripeSubscriptionId: input.stripeSubscriptionId ?? null,
    updatedAt: now,
  };

  if (matchIndex >= 0) {
    rows[matchIndex] = {
      ...rows[matchIndex],
      ...next,
      startedAt: rows[matchIndex].startedAt || startedAt,
    };
  } else {
    rows.unshift(next);
  }

  saveRaw(rows);
  return next;
}
