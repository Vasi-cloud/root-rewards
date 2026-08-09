"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getMembershipTier,
  type MembershipTier,
} from "@/lib/membership";
import {
  MEMBERSHIP_STORAGE_KEY,
  applyReconcileResult,
  applyStripeMembership,
  canUseCauseCredit,
  clearMembershipToFree,
  loadMembership,
  markCauseCreditUsed,
  resumeMembership,
  scheduleMembershipCancel,
  setMembershipTier,
  type MembershipState,
} from "@/lib/membership-storage";
import { upsertAdminMember } from "@/lib/admin-members-ledger";
import { syncMembershipToUserProfile } from "@/lib/firebase/firestore";
import {
  openBillingPortal,
  reconcileMembership,
  startMembershipCheckout,
  verifyCheckoutSession,
} from "@/lib/stripe/client";
import type { MembershipTierId } from "@/types";
import { useAuth } from "@/contexts/auth-context";

interface MembershipContextValue {
  state: MembershipState;
  tier: MembershipTier;
  isImpactMember: boolean;
  /** Cancel requested; benefits remain until periodEndsAt */
  cancelScheduled: boolean;
  periodEndsAt: string | null;
  causeCreditAvailable: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  /**
   * Start Stripe subscription Checkout when configured;
   * otherwise demo-upgrade locally. Returns outcome for UI.
   */
  upgradeToImpact: (email?: string) => Promise<"stripe" | "demo" | "error">;
  /** Immediate switch to Free (legacy / admin-style) */
  downgradeToFree: () => void;
  /** Friendly cancel: keep benefits until billing period ends */
  cancelMembership: () => Promise<void>;
  /** Undo a scheduled cancel */
  keepMembership: () => Promise<void>;
  /** Open Stripe Customer Portal when linked to a Stripe customer */
  manageBilling: () => Promise<"portal" | "demo" | "error">;
  /** Sync membership after returning from Stripe Checkout */
  syncFromCheckoutSession: (sessionId: string) => Promise<boolean>;
  /** Re-read plan from Stripe (login reconcile) */
  reconcileFromStripe: () => Promise<void>;
  consumeCauseCredit: () => boolean;
  refresh: () => void;
}

const MembershipContext = createContext<MembershipContextValue | undefined>(
  undefined
);

export function MembershipProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = useAuth();
  const [state, setState] = useState<MembershipState>(() => ({
    tierId: "free",
    startedAt: null,
    periodEndsAt: null,
    cancelAtPeriodEnd: false,
    causeCreditUsedMonth: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    updatedAt: new Date().toISOString(),
  }));

  const syncAdminLedger = useCallback(
    (next: MembershipState, emailOverride?: string | null) => {
      if (next.tierId !== "impact") {
        if (next.cancelAtPeriodEnd || next.tierId === "free") {
          upsertAdminMember({
            email: emailOverride ?? user?.email ?? null,
            displayName: user?.displayName ?? null,
            tierId: "impact",
            status: "cancelled",
            startedAt: next.startedAt,
            stripeCustomerId: next.stripeCustomerId,
            stripeSubscriptionId: next.stripeSubscriptionId,
          });
        }
        return;
      }
      upsertAdminMember({
        email: emailOverride ?? user?.email ?? null,
        displayName: user?.displayName ?? null,
        tierId: "impact",
        status: next.cancelAtPeriodEnd ? "cancelled" : "active",
        startedAt: next.startedAt,
        stripeCustomerId: next.stripeCustomerId,
        stripeSubscriptionId: next.stripeSubscriptionId,
      });
    },
    [user?.email, user?.displayName]
  );

  const persistProfileMembership = useCallback(
    async (next: MembershipState) => {
      if (!user?.uid) return;
      try {
        await syncMembershipToUserProfile({
          uid: user.uid,
          membershipTier: next.tierId,
          stripeCustomerId: next.stripeCustomerId,
          stripeSubscriptionId: next.stripeSubscriptionId,
        });
      } catch (err) {
        console.warn("[membership] could not sync profile", err);
      }
    },
    [user?.uid]
  );

  const refresh = useCallback(() => {
    setState(loadMembership());
  }, []);

  const reconcileFromStripe = useCallback(async () => {
    const email = user?.email ?? profile?.email ?? null;
    const local = loadMembership();
    const customerId =
      local.stripeCustomerId || profile?.stripeCustomerId || null;

    if (!email && !customerId) {
      // Signed-out / anonymous: do not invent Impact from stale local flags alone
      if (local.tierId === "impact" && !local.stripeSubscriptionId) {
        // keep demo local Impact without Stripe ids
        setState(local);
      }
      return;
    }

    const result = await reconcileMembership({
      email,
      customerId,
      userId: user?.uid ?? null,
    });

    if ("error" in result) {
      console.warn("[membership] reconcile error", result.error);
      setState(loadMembership());
      return;
    }

    // Demo mode (no Stripe keys): keep local cache; do not clear Impact demos
    if (result.mode === "demo" || !result.reconciled) {
      setState(loadMembership());
      return;
    }

    const next = applyReconcileResult(result);
    setState(next);
    syncAdminLedger(next, email);
    await persistProfileMembership(next);
  }, [
    user?.email,
    user?.uid,
    profile?.email,
    profile?.stripeCustomerId,
    syncAdminLedger,
    persistProfileMembership,
  ]);

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key !== MEMBERSHIP_STORAGE_KEY) return;
      refresh();
    };
    const onCustom = () => refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener("forest-buddies-membership-updated", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("forest-buddies-membership-updated", onCustom);
    };
  }, [refresh]);

  // On login / sign-up: Stripe is source of truth (reconcile only — does not cancel).
  // On sign-out: drop Stripe-backed local cache so guests aren't treated as Impact.
  useEffect(() => {
    if (!user?.uid) {
      const local = loadMembership();
      if (local.stripeSubscriptionId || local.stripeCustomerId) {
        setState(clearMembershipToFree());
      }
      return;
    }
    void reconcileFromStripe();
  }, [user?.uid, user?.email, reconcileFromStripe]);

  // Keep admin ledger in sync when this device has Impact Member
  useEffect(() => {
    if (state.tierId === "impact") {
      syncAdminLedger(state);
    }
  }, [state, syncAdminLedger]);

  const upgradeToImpact = useCallback(
    async (email?: string): Promise<"stripe" | "demo" | "error"> => {
      const current = loadMembership();
      const checkoutEmail =
        email?.trim() || user?.email || "member@forestbuddies.eco";
      const customerId =
        current.stripeCustomerId || profile?.stripeCustomerId || null;
      const result = await startMembershipCheckout({
        email: checkoutEmail,
        userId: user?.uid ?? null,
        customerId,
      });
      if ("demo" in result) {
        const next = setMembershipTier("impact");
        setState(next);
        syncAdminLedger(next, checkoutEmail);
        await persistProfileMembership(next);
        return "demo";
      }
      if ("error" in result) {
        console.error(result.error);
        return "error";
      }
      window.location.href = result.url;
      return "stripe";
    },
    [
      user?.email,
      user?.uid,
      profile?.stripeCustomerId,
      syncAdminLedger,
      persistProfileMembership,
    ]
  );

  const cancelMembership = useCallback(async () => {
    const current = loadMembership();
    if (current.stripeSubscriptionId) {
      try {
        const res = await fetch("/api/membership/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscriptionId: current.stripeSubscriptionId,
            resume: false,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            cancelAtPeriodEnd?: boolean;
            currentPeriodEnd?: string | null;
          };
          const next = applyStripeMembership({
            customerId: current.stripeCustomerId,
            subscriptionId: current.stripeSubscriptionId,
            periodEndsAt: data.currentPeriodEnd ?? current.periodEndsAt,
            cancelAtPeriodEnd: true,
          });
          setState(next);
          await persistProfileMembership(next);
          return;
        }
      } catch {
        // fall through to demo cancel
      }
    }
    const next = scheduleMembershipCancel();
    setState(next);
    await persistProfileMembership(next);
  }, [persistProfileMembership]);

  const downgradeToFree = useCallback(() => {
    const prev = loadMembership();
    // Never strip Impact while a Stripe subscription id is still linked —
    // schedule cancel-at-period-end instead (Stripe remains source of truth).
    if (prev.stripeSubscriptionId) {
      void cancelMembership();
      return;
    }
    syncAdminLedger(
      { ...prev, tierId: "free", cancelAtPeriodEnd: true },
      user?.email
    );
    const next = setMembershipTier("free");
    setState(next);
    void persistProfileMembership(next);
  }, [
    cancelMembership,
    syncAdminLedger,
    user?.email,
    persistProfileMembership,
  ]);

  const keepMembership = useCallback(async () => {
    const current = loadMembership();
    if (current.stripeSubscriptionId) {
      try {
        const res = await fetch("/api/membership/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscriptionId: current.stripeSubscriptionId,
            resume: true,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            currentPeriodEnd?: string | null;
          };
          const next = applyStripeMembership({
            customerId: current.stripeCustomerId,
            subscriptionId: current.stripeSubscriptionId,
            periodEndsAt: data.currentPeriodEnd ?? current.periodEndsAt,
            cancelAtPeriodEnd: false,
          });
          setState(next);
          await persistProfileMembership(next);
          return;
        }
      } catch {
        // fall through
      }
    }
    const next = resumeMembership();
    setState(next);
    await persistProfileMembership(next);
  }, [persistProfileMembership]);

  const manageBilling = useCallback(async (): Promise<"portal" | "demo" | "error"> => {
    const current = loadMembership();
    const customerId =
      current.stripeCustomerId || profile?.stripeCustomerId || null;
    if (!customerId) return "demo";
    const result = await openBillingPortal(customerId);
    if ("error" in result) return "error";
    window.location.href = result.url;
    return "portal";
  }, [profile?.stripeCustomerId]);

  const syncFromCheckoutSession = useCallback(
    async (sessionId: string) => {
      const verified = await verifyCheckoutSession(sessionId);
      if ("error" in verified || !verified.paid) return false;
      if (verified.kind !== "impact_member" && !verified.subscriptionId) {
        return false;
      }
      const next = applyStripeMembership({
        customerId: verified.customerId,
        subscriptionId: verified.subscriptionId,
        periodEndsAt: verified.currentPeriodEnd,
        cancelAtPeriodEnd: verified.cancelAtPeriodEnd,
      });
      setState(next);
      syncAdminLedger(next, verified.customerEmail ?? user?.email);
      await persistProfileMembership(next);
      return true;
    },
    [persistProfileMembership, syncAdminLedger, user?.email]
  );

  const consumeCauseCredit = useCallback(() => {
    const current = loadMembership();
    if (!canUseCauseCredit(current)) return false;
    setState(markCauseCreditUsed(current));
    return true;
  }, []);

  const tier = getMembershipTier(state.tierId);
  const value = useMemo(
    () => ({
      state,
      tier,
      isImpactMember: state.tierId === "impact",
      cancelScheduled: state.tierId === "impact" && state.cancelAtPeriodEnd,
      periodEndsAt: state.periodEndsAt,
      causeCreditAvailable: canUseCauseCredit(state),
      stripeCustomerId: state.stripeCustomerId,
      stripeSubscriptionId: state.stripeSubscriptionId,
      upgradeToImpact,
      downgradeToFree,
      cancelMembership,
      keepMembership,
      manageBilling,
      syncFromCheckoutSession,
      reconcileFromStripe,
      consumeCauseCredit,
      refresh,
    }),
    [
      state,
      tier,
      upgradeToImpact,
      downgradeToFree,
      cancelMembership,
      keepMembership,
      manageBilling,
      syncFromCheckoutSession,
      reconcileFromStripe,
      consumeCauseCredit,
      refresh,
    ]
  );

  return (
    <MembershipContext.Provider value={value}>
      {children}
    </MembershipContext.Provider>
  );
}

export function useMembership() {
  const ctx = useContext(MembershipContext);
  if (!ctx) {
    throw new Error("useMembership must be used within MembershipProvider");
  }
  return ctx;
}

export function useMembershipOptional() {
  return useContext(MembershipContext);
}

/** Helper for non-hook call sites */
export function resolveTierId(
  stored: MembershipTierId | undefined
): MembershipTierId {
  return stored === "impact" ? "impact" : "free";
}
