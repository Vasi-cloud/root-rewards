import type { MembershipTierId } from "@/types";

export const MEMBERSHIP_STORAGE_KEY = "forest-buddies-membership";

export interface MembershipState {
  tierId: MembershipTierId;
  /** ISO date when Impact Member period started / renewed */
  startedAt: string | null;
  /** ISO date when the current paid period ends (demo: +1 month from start/renewal) */
  periodEndsAt: string | null;
  /** User asked to cancel; benefits stay active until periodEndsAt */
  cancelAtPeriodEnd: boolean;
  /** Whether this month's cause credit was already applied */
  causeCreditUsedMonth: string | null;
  /** Stripe Customer id when paid via Stripe */
  stripeCustomerId: string | null;
  /** Stripe Subscription id for Impact Member */
  stripeSubscriptionId: string | null;
  updatedAt: string;
}

function emptyState(): MembershipState {
  return {
    tierId: "free",
    startedAt: null,
    periodEndsAt: null,
    cancelAtPeriodEnd: false,
    causeCreditUsedMonth: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    updatedAt: new Date().toISOString(),
  };
}

/** Add one calendar month to an ISO timestamp (demo billing period). */
export function addOneMonth(iso: string): string {
  const d = new Date(iso);
  const next = new Date(d);
  next.setMonth(next.getMonth() + 1);
  return next.toISOString();
}

export function formatMembershipDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export function daysUntilPeriodEnd(
  periodEndsAt: string | null,
  now = new Date()
): number {
  if (!periodEndsAt) return 0;
  const end = new Date(periodEndsAt).getTime();
  const ms = end - now.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function normalizeState(parsed: Partial<MembershipState>): MembershipState {
  const startedAt = parsed.startedAt ?? null;
  let periodEndsAt = parsed.periodEndsAt ?? null;
  if (parsed.tierId === "impact" && startedAt && !periodEndsAt) {
    periodEndsAt = addOneMonth(startedAt);
  }
  return {
    tierId: parsed.tierId === "impact" ? "impact" : "free",
    startedAt,
    periodEndsAt: parsed.tierId === "impact" ? periodEndsAt : null,
    cancelAtPeriodEnd: Boolean(parsed.cancelAtPeriodEnd) && parsed.tierId === "impact",
    causeCreditUsedMonth: parsed.causeCreditUsedMonth ?? null,
    stripeCustomerId:
      typeof parsed.stripeCustomerId === "string" &&
      parsed.stripeCustomerId.startsWith("cus_")
        ? parsed.stripeCustomerId
        : null,
    stripeSubscriptionId:
      typeof parsed.stripeSubscriptionId === "string" &&
      parsed.stripeSubscriptionId.startsWith("sub_")
        ? parsed.stripeSubscriptionId
        : null,
    updatedAt: parsed.updatedAt ?? new Date().toISOString(),
  };
}

/** If cancel was scheduled and the period has ended, move to Free. */
export function finalizeExpiredCancellation(
  state: MembershipState,
  now = new Date()
): MembershipState {
  if (
    state.tierId !== "impact" ||
    !state.cancelAtPeriodEnd ||
    !state.periodEndsAt
  ) {
    return state;
  }
  if (new Date(state.periodEndsAt).getTime() > now.getTime()) {
    return state;
  }
  const next: MembershipState = {
    ...emptyState(),
    updatedAt: now.toISOString(),
  };
  saveMembership(next);
  return next;
}

export function loadMembership(): MembershipState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = localStorage.getItem(MEMBERSHIP_STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<MembershipState>;
    const normalized = normalizeState(parsed);
    return finalizeExpiredCancellation(normalized);
  } catch {
    return emptyState();
  }
}

export function saveMembership(state: MembershipState) {
  try {
    localStorage.setItem(MEMBERSHIP_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event("forest-buddies-membership-updated"));
  } catch {
    // ignore
  }
}

export function setMembershipTier(tierId: MembershipTierId): MembershipState {
  const current = loadMembership();
  const nowIso = new Date().toISOString();

  if (tierId === "impact") {
    const startedAt = current.startedAt ?? nowIso;
    const periodEndsAt =
      current.tierId === "impact" && current.periodEndsAt
        ? current.periodEndsAt
        : addOneMonth(startedAt);
    const next: MembershipState = {
      ...current,
      tierId: "impact",
      startedAt,
      periodEndsAt,
      cancelAtPeriodEnd: false,
      causeCreditUsedMonth: current.causeCreditUsedMonth,
      stripeCustomerId: current.stripeCustomerId,
      stripeSubscriptionId: current.stripeSubscriptionId,
      updatedAt: nowIso,
    };
    saveMembership(next);
    return next;
  }

  const next: MembershipState = {
    ...emptyState(),
    updatedAt: nowIso,
  };
  saveMembership(next);
  return next;
}

/**
 * Schedule cancel at end of billing period.
 * Member keeps Impact benefits until periodEndsAt.
 */
export function scheduleMembershipCancel(
  state: MembershipState = loadMembership()
): MembershipState {
  if (state.tierId !== "impact") return state;
  const periodEndsAt =
    state.periodEndsAt ??
    (state.startedAt ? addOneMonth(state.startedAt) : addOneMonth(new Date().toISOString()));
  const next: MembershipState = {
    ...state,
    periodEndsAt,
    cancelAtPeriodEnd: true,
    updatedAt: new Date().toISOString(),
  };
  saveMembership(next);
  return next;
}

/** Undo a scheduled cancel — stay Impact Member. */
export function resumeMembership(
  state: MembershipState = loadMembership()
): MembershipState {
  if (state.tierId !== "impact") return state;
  const next: MembershipState = {
    ...state,
    cancelAtPeriodEnd: false,
    updatedAt: new Date().toISOString(),
  };
  saveMembership(next);
  return next;
}

/** YYYY-MM for credit tracking */
export function currentCreditMonth(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function canUseCauseCredit(state: MembershipState = loadMembership()): boolean {
  if (state.tierId !== "impact") return false;
  return state.causeCreditUsedMonth !== currentCreditMonth();
}

export function markCauseCreditUsed(
  state: MembershipState = loadMembership()
): MembershipState {
  const next: MembershipState = {
    ...state,
    causeCreditUsedMonth: currentCreditMonth(),
    updatedAt: new Date().toISOString(),
  };
  saveMembership(next);
  return next;
}

/** Apply Stripe subscription details after successful Checkout / verify. */
export function applyStripeMembership(params: {
  customerId?: string | null;
  subscriptionId?: string | null;
  periodEndsAt?: string | null;
  cancelAtPeriodEnd?: boolean;
}): MembershipState {
  const current = loadMembership();
  const nowIso = new Date().toISOString();
  const startedAt = current.startedAt ?? nowIso;
  const next: MembershipState = {
    ...current,
    tierId: "impact",
    startedAt,
    periodEndsAt:
      params.periodEndsAt ?? current.periodEndsAt ?? addOneMonth(startedAt),
    cancelAtPeriodEnd: Boolean(params.cancelAtPeriodEnd),
    stripeCustomerId:
      params.customerId?.startsWith("cus_")
        ? params.customerId
        : current.stripeCustomerId,
    stripeSubscriptionId:
      params.subscriptionId?.startsWith("sub_")
        ? params.subscriptionId
        : current.stripeSubscriptionId,
    updatedAt: nowIso,
  };
  saveMembership(next);
  return next;
}
