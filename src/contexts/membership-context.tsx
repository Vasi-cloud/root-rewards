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
  saveMembership,
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
   * `already` = email already has an active Impact sub (no new Checkout).
   */
  upgradeToImpact: (
    email?: string
  ) => Promise<"stripe" | "demo" | "already" | "error">;
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
  const { user, profile, loading: authLoading } = useAuth();
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

  /** Restore Impact flags from Firebase profile before Stripe answers. */
  const seedFromProfile = useCallback((): MembershipState | null => {
    if (!user?.uid || !profile) return null;
    const customerId =
      typeof profile.stripeCustomerId === "string" &&
      profile.stripeCustomerId.startsWith("cus_")
        ? profile.stripeCustomerId
        : null;
    const subscriptionId =
      typeof profile.stripeSubscriptionId === "string" &&
      profile.stripeSubscriptionId.startsWith("sub_")
        ? profile.stripeSubscriptionId
        : null;

    if (profile.membershipTier === "impact" && subscriptionId) {
      const next = applyStripeMembership({
        customerId,
        subscriptionId,
        periodEndsAt: null,
        cancelAtPeriodEnd: false,
      });
      setState(next);
      return next;
    }

    // Keep customer id available for Stripe lookup even if tier was wiped locally
    if (customerId) {
      const local = loadMembership();
      if (local.stripeCustomerId !== customerId) {
        const next: MembershipState = {
          ...local,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId ?? local.stripeSubscriptionId,
          updatedAt: new Date().toISOString(),
        };
        saveMembership(next);
        setState(next);
        return next;
      }
    }
    return null;
  }, [user?.uid, profile]);

  const reconcileFromStripe = useCallback(async () => {
    const email = user?.email ?? profile?.email ?? null;
    const local = loadMembership();
    const customerId =
      local.stripeCustomerId ||
      (profile?.stripeCustomerId?.startsWith("cus_")
        ? profile.stripeCustomerId
        : null) ||
      null;
    const subscriptionId =
      local.stripeSubscriptionId ||
      (profile?.stripeSubscriptionId?.startsWith("sub_")
        ? profile.stripeSubscriptionId
        : null) ||
      null;

    if (!email && !customerId && !subscriptionId) {
      // Signed-out / anonymous: do not invent Impact from stale local flags alone
      if (local.tierId === "impact" && !local.stripeSubscriptionId) {
        setState(local);
      }
      return;
    }

    const result = await reconcileMembership({
      email,
      customerId,
      subscriptionId,
      userId: user?.uid ?? null,
    });

    if ("error" in result) {
      console.warn("[membership] reconcile error", result.error);
      // Keep profile-seeded Impact if Stripe request failed
      setState(loadMembership());
      return;
    }

    // Demo mode / Stripe error (reconciled: false): keep local/profile seed
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
    profile?.stripeSubscriptionId,
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

  // Stripe is source of truth after auth is ready.
  // Never wipe local Stripe-backed cache while Firebase Auth is still loading.
  useEffect(() => {
    if (authLoading) return;

    if (!user?.uid) {
      const local = loadMembership();
      if (local.stripeSubscriptionId || local.stripeCustomerId) {
        setState(clearMembershipToFree());
      }
      return;
    }

    // Wait until profile has loaded so we can pass stored Stripe ids
    if (!profile) return;

    seedFromProfile();
    void reconcileFromStripe();
  }, [
    authLoading,
    user?.uid,
    user?.email,
    profile,
    seedFromProfile,
    reconcileFromStripe,
  ]);

  // Keep admin ledger in sync when this device has Impact Member
  useEffect(() => {
    if (state.tierId === "impact") {
      syncAdminLedger(state);
    }
  }, [state, syncAdminLedger]);

  const upgradeToImpact = useCallback(
    async (
      email?: string
    ): Promise<"stripe" | "demo" | "already" | "error"> => {
      const checkoutEmail =
        email?.trim() || user?.email || "member@forestbuddies.eco";

      // Always reconcile first — never open Checkout for an existing Impact sub
      await reconcileFromStripe();
      const afterReconcile = loadMembership();
      if (
        afterReconcile.tierId === "impact" &&
        afterReconcile.stripeSubscriptionId
      ) {
        syncAdminLedger(afterReconcile, checkoutEmail);
        await persistProfileMembership(afterReconcile);
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/membership")
        ) {
          window.location.assign("/membership");
        }
        return "already";
      }

      const customerId =
        afterReconcile.stripeCustomerId ||
        (profile?.stripeCustomerId?.startsWith("cus_")
          ? profile.stripeCustomerId
          : null) ||
        null;
      const subscriptionId =
        afterReconcile.stripeSubscriptionId ||
        (profile?.stripeSubscriptionId?.startsWith("sub_")
          ? profile.stripeSubscriptionId
          : null) ||
        null;

      const result = await startMembershipCheckout({
        email: checkoutEmail,
        userId: user?.uid ?? null,
        customerId,
        subscriptionId,
      });
      if ("demo" in result) {
        const next = setMembershipTier("impact");
        setState(next);
        syncAdminLedger(next, checkoutEmail);
        await persistProfileMembership(next);
        return "demo";
      }
      if ("alreadyMember" in result) {
        const next = applyStripeMembership({
          customerId: result.customerId,
          subscriptionId: result.subscriptionId,
          periodEndsAt: result.periodEndsAt,
          cancelAtPeriodEnd: result.cancelAtPeriodEnd,
        });
        setState(next);
        syncAdminLedger(next, checkoutEmail);
        await persistProfileMembership(next);
    // Prefer portal URL for THIS email-matched customer when already a member
        if (typeof window !== "undefined") {
          const dest =
            result.portalUrl ||
            result.url ||
            result.membershipUrl ||
            "/membership";
          window.location.assign(dest);
        }
        return "already";
      }
      if ("error" in result) {
        console.error(result.error);
        if (typeof window !== "undefined") {
          const dest = result.url || result.membershipUrl;
          if (dest) window.location.assign(dest);
        }
        return "error";
      }
      // Never open Checkout if we somehow still look like Impact locally
      const guard = loadMembership();
      if (guard.tierId === "impact" && guard.stripeSubscriptionId) {
        if (typeof window !== "undefined") {
          window.location.assign("/membership");
        }
        return "already";
      }
      // Refuse Stripe Checkout URLs if response looks like membership manage
      if (
        result.url.includes("/membership") &&
        !result.url.includes("checkout.stripe.com")
      ) {
        window.location.assign(result.url);
        return "already";
      }
      window.location.href = result.url;
      return "stripe";
    },
    [
      user?.email,
      user?.uid,
      profile?.stripeCustomerId,
      profile?.stripeSubscriptionId,
      reconcileFromStripe,
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
    const email = user?.email?.trim() || profile?.email?.trim() || null;
    if (!email) return "error";

    const current = loadMembership();
    const customerIdHint =
      current.stripeCustomerId ||
      (profile?.stripeCustomerId?.startsWith("cus_")
        ? profile.stripeCustomerId
        : null) ||
      null;

    const result = await openBillingPortal({
      email,
      customerId: customerIdHint,
    });
    if ("error" in result) return "error";

    // Persist the email-matched customer id (may replace a stale mismatched id)
    if (result.customerId && result.customerId !== current.stripeCustomerId) {
      const patched: MembershipState = {
        ...current,
        stripeCustomerId: result.customerId,
        updatedAt: new Date().toISOString(),
      };
      saveMembership(patched);
      setState(patched);
      await persistProfileMembership(patched);
    }

    window.location.href = result.url;
    return "portal";
  }, [
    user?.email,
    profile?.email,
    profile?.stripeCustomerId,
    persistProfileMembership,
  ]);

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

      // Re-query Stripe so Firebase + local cache match live subscription status
      // (covers late webhooks and Price IDs without Impact metadata).
      const email =
        verified.customerEmail ?? user?.email ?? profile?.email ?? null;
      const reconcile = await reconcileMembership({
        email,
        customerId: verified.customerId ?? next.stripeCustomerId,
        subscriptionId: verified.subscriptionId ?? next.stripeSubscriptionId,
        userId: user?.uid ?? null,
      });
      if (!("error" in reconcile) && reconcile.reconciled && reconcile.mode === "live") {
        const fromStripe = applyReconcileResult(reconcile);
        setState(fromStripe);
        syncAdminLedger(fromStripe, email);
        await persistProfileMembership(fromStripe);
        return fromStripe.tierId === "impact";
      }

      return true;
    },
    [
      persistProfileMembership,
      syncAdminLedger,
      user?.email,
      user?.uid,
      profile?.email,
    ]
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
