"use client";

import { CheckCircle2, Sparkles, Trees } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useMembership } from "@/contexts/membership-context";
import { confirmPaidOrder } from "@/lib/stripe/client";
import { formatMembershipDate } from "@/lib/membership-storage";

function MembershipSuccessInner() {
  const searchParams = useSearchParams();
  const { syncFromCheckoutSession, isImpactMember, periodEndsAt, refresh } =
    useMembership();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const sessionId = searchParams.get("session_id");
      if (!sessionId?.startsWith("cs_")) {
        if (!cancelled) {
          setError("Missing subscription session.");
          setStatus("error");
        }
        return;
      }

      const confirmed = await confirmPaidOrder(sessionId);
      const synced = await syncFromCheckoutSession(sessionId);
      refresh();

      if (cancelled) return;

      if ("error" in confirmed && !synced) {
        setError(confirmed.error);
        setStatus("error");
        return;
      }

      if ("order" in confirmed) {
        setOrderNumber(confirmed.order.orderNumber);
      }
      setStatus("ok");
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [searchParams, syncFromCheckoutSession, refresh]);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-muted-foreground">
        Activating your Impact Member subscription…
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <h1 className="font-heading text-2xl font-semibold text-primary">
          Subscription not confirmed
        </h1>
        <p className="mt-3 text-muted-foreground">{error}</p>
        <Button
          className="mt-8"
          nativeButton={false}
          render={<Link href="/membership" />}
        >
          Back to membership
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12 text-center sm:py-16">
      <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-emerald-100 sm:size-20">
        <Sparkles className="size-8 text-emerald-800 sm:size-10" />
      </div>
      <h1 className="font-heading text-3xl font-semibold text-primary">
        You&apos;re an Impact Member
      </h1>
      <p className="mt-3 text-muted-foreground">
        Your Stripe subscription is active
        {isImpactMember && periodEndsAt
          ? ` through ${formatMembershipDate(periodEndsAt)}`
          : ""}
        . Affiliate boost and cause credit are ready.
      </p>
      {orderNumber && (
        <p className="mt-2 font-mono text-sm text-muted-foreground">
          {orderNumber}
        </p>
      )}

      <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 text-left text-sm text-emerald-950">
        <div className="mb-2 flex items-center gap-2 font-medium">
          <CheckCircle2 className="size-4" /> What&apos;s unlocked
        </div>
        <ul className="list-inside list-disc space-y-1 text-emerald-900/90">
          <li>+25% first-party affiliate commission boost</li>
          <li>$8 monthly cause credit at checkout</li>
          <li>Impact Member badge on your profile</li>
        </ul>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Button
          nativeButton={false}
          render={<Link href="/marketplace" />}
          size="lg"
          className="min-h-12 gap-2"
        >
          <Trees className="size-4" />
          Start shopping with credit
        </Button>
        <Button
          nativeButton={false}
          render={<Link href="/membership" />}
          variant="outline"
          size="lg"
          className="min-h-12"
        >
          Manage membership
        </Button>
      </div>
    </div>
  );
}

export default function MembershipSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-16 text-center text-muted-foreground">
          Loading…
        </div>
      }
    >
      <MembershipSuccessInner />
    </Suspense>
  );
}
