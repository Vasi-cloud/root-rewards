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
  applyStripeMembership,
  canUseCauseCredit,
  loadMembership,
  markCauseCreditUsed,
  resumeMembership,
  scheduleMembershipCancel,
  setMembershipTier,
  type MembershipState,
} from "@/lib/membership-storage";
import {
  openBillingPortal,
  startMembershipCheckout,
  verifyCheckoutSession,
} from "@/lib/stripe/client";
import type { MembershipTierId } from "@/types";

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

  const refresh = useCallback(() => {
    setState(loadMembership());
  }, []);

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

  const upgradeToImpact = useCallback(
    async (email?: string): Promise<"stripe" | "demo" | "error"> => {
      const current = loadMembership();
      const result = await startMembershipCheckout({
        email: email?.trim() || "member@forestbuddies.eco",
        userId: null,
        customerId: current.stripeCustomerId,
      });
      if ("demo" in result) {
        setState(setMembershipTier("impact"));
        return "demo";
      }
      if ("error" in result) {
        console.error(result.error);
        return "error";
      }
      window.location.href = result.url;
      return "stripe";
    },
    []
  );

  const downgradeToFree = useCallback(() => {
    setState(setMembershipTier("free"));
  }, []);

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
          setState(
            applyStripeMembership({
              customerId: current.stripeCustomerId,
              subscriptionId: current.stripeSubscriptionId,
              periodEndsAt: data.currentPeriodEnd ?? current.periodEndsAt,
              cancelAtPeriodEnd: true,
            })
          );
          return;
        }
      } catch {
        // fall through to demo cancel
      }
    }
    setState(scheduleMembershipCancel());
  }, []);

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
          setState(
            applyStripeMembership({
              customerId: current.stripeCustomerId,
              subscriptionId: current.stripeSubscriptionId,
              periodEndsAt: data.currentPeriodEnd ?? current.periodEndsAt,
              cancelAtPeriodEnd: false,
            })
          );
          return;
        }
      } catch {
        // fall through
      }
    }
    setState(resumeMembership());
  }, []);

  const manageBilling = useCallback(async (): Promise<"portal" | "demo" | "error"> => {
    const current = loadMembership();
    if (!current.stripeCustomerId) return "demo";
    const result = await openBillingPortal(current.stripeCustomerId);
    if ("error" in result) return "error";
    window.location.href = result.url;
    return "portal";
  }, []);

  const syncFromCheckoutSession = useCallback(async (sessionId: string) => {
    const verified = await verifyCheckoutSession(sessionId);
    if ("error" in verified || !verified.paid) return false;
    if (verified.kind !== "impact_member" && !verified.subscriptionId) {
      return false;
    }
    setState(
      applyStripeMembership({
        customerId: verified.customerId,
        subscriptionId: verified.subscriptionId,
        periodEndsAt: verified.currentPeriodEnd,
        cancelAtPeriodEnd: verified.cancelAtPeriodEnd,
      })
    );
    return true;
  }, []);

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
