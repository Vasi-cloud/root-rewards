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
  canUseCauseCredit,
  loadMembership,
  markCauseCreditUsed,
  resumeMembership,
  scheduleMembershipCancel,
  setMembershipTier,
  type MembershipState,
} from "@/lib/membership-storage";
import type { MembershipTierId } from "@/types";

interface MembershipContextValue {
  state: MembershipState;
  tier: MembershipTier;
  isImpactMember: boolean;
  /** Cancel requested; benefits remain until periodEndsAt */
  cancelScheduled: boolean;
  periodEndsAt: string | null;
  causeCreditAvailable: boolean;
  upgradeToImpact: () => void;
  /** Immediate switch to Free (legacy / admin-style) */
  downgradeToFree: () => void;
  /** Friendly cancel: keep benefits until billing period ends */
  cancelMembership: () => void;
  /** Undo a scheduled cancel */
  keepMembership: () => void;
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

  const upgradeToImpact = useCallback(() => {
    setState(setMembershipTier("impact"));
  }, []);

  const downgradeToFree = useCallback(() => {
    setState(setMembershipTier("free"));
  }, []);

  const cancelMembership = useCallback(() => {
    setState(scheduleMembershipCancel());
  }, []);

  const keepMembership = useCallback(() => {
    setState(resumeMembership());
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
      upgradeToImpact,
      downgradeToFree,
      cancelMembership,
      keepMembership,
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
