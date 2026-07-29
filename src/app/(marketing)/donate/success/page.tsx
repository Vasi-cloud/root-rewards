"use client";

import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  HeartHandshake,
  Leaf,
  Loader2,
  PawPrint,
  Sun,
  Waves,
} from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  CAUSES,
  emptyCauseSelection,
  formatCauseUnits,
  getCause,
  selectionCo2,
  selectionCost,
  selectionLines,
  type CauseSelection,
} from "@/lib/causes";
import {
  clearPendingDonation,
  loadPendingDonation,
  parseDonationCauseSelection,
} from "@/lib/donate";
import { saveLastDonation } from "@/lib/impact-storage";
import { verifyCheckoutSession } from "@/lib/stripe/client";

const CAUSE_ICONS = {
  trees: Leaf,
  waves: Waves,
  paw: PawPrint,
  book: BookOpen,
  sun: Sun,
} as const;

type ViewState =
  | { status: "loading" }
  | {
      status: "ok";
      selection: CauseSelection;
      total: number;
      co2: number;
      mode: "demo" | "live";
    }
  | { status: "error"; message: string };

function DonateSuccessInner() {
  const searchParams = useSearchParams();
  const [view, setView] = useState<ViewState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const isDemo = searchParams.get("demo") === "1";
      const sessionId = searchParams.get("session_id");

      if (isDemo) {
        const pending = loadPendingDonation();
        const selection = pending?.selection ?? emptyCauseSelection();
        if (!pending?.recorded) {
          saveLastDonation(selection);
        }
        clearPendingDonation();
        if (!cancelled) {
          setView({
            status: "ok",
            selection,
            total: selectionCost(selection),
            co2: selectionCo2(selection),
            mode: "demo",
          });
        }
        return;
      }

      if (!sessionId?.startsWith("cs_")) {
        const pending = loadPendingDonation();
        if (pending) {
          if (!pending.recorded) saveLastDonation(pending.selection);
          clearPendingDonation();
          if (!cancelled) {
            setView({
              status: "ok",
              selection: pending.selection,
              total: selectionCost(pending.selection),
              co2: selectionCo2(pending.selection),
              mode: "demo",
            });
          }
          return;
        }
        if (!cancelled) {
          setView({
            status: "error",
            message: "Missing donation session. Return to Support a cause to try again.",
          });
        }
        return;
      }

      const verified = await verifyCheckoutSession(sessionId);
      if (cancelled) return;

      if ("error" in verified) {
        setView({ status: "error", message: verified.error });
        return;
      }

      if (!verified.paid) {
        setView({
          status: "error",
          message: "Payment was not completed. You can try again anytime.",
        });
        return;
      }

      const pending = loadPendingDonation();
      let selection: CauseSelection =
        pending?.selection ??
        parseDonationCauseSelection(verified.metadata?.causeSelection);

      if (Object.values(selection).every((n) => !n)) {
        selection = emptyCauseSelection();
      }

      if (!pending?.recorded) {
        saveLastDonation(selection);
      }
      clearPendingDonation();

      setView({
        status: "ok",
        selection,
        total:
          verified.amountTotal != null
            ? verified.amountTotal / 100
            : selectionCost(selection),
        co2: selectionCo2(selection),
        mode: "live",
      });
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  if (view.status === "loading") {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-muted-foreground">
        <Loader2 className="mb-3 size-8 animate-spin opacity-50" />
        Confirming your gift…
      </div>
    );
  }

  if (view.status === "error") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-destructive">{view.message}</p>
        <Button
          nativeButton={false}
          render={<Link href="/donate" />}
          className="mt-6"
        >
          Back to Support a cause
        </Button>
      </div>
    );
  }

  const lines = selectionLines(view.selection);

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:py-16">
      <div className="mb-6 flex justify-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
          <CheckCircle2 className="size-8" />
        </span>
      </div>

      <h1 className="font-heading text-center text-3xl font-semibold text-primary">
        Thank you for funding impact
      </h1>
      <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground sm:text-base">
        Your gift helps Forest Buddies® support partner causes. Numbers below
        are illustrative estimates — not a live carbon audit.
        {view.mode === "demo" ? (
          <span className="mt-1 block text-xs">
            Demo mode — impact is saved on this device.
          </span>
        ) : null}
      </p>

      <div className="mt-8 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 via-cream to-white p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-950">
          <HeartHandshake className="size-4" />
          Gift summary
        </p>
        <p className="mt-1 font-heading text-2xl font-semibold tabular-nums text-primary">
          ${view.total.toFixed(2)}
        </p>
        {lines.length > 0 && (
          <ul className="mt-4 space-y-2">
            {lines.map(({ cause, units, cost }) => {
              const Icon = CAUSE_ICONS[cause.icon];
              return (
                <li
                  key={cause.id}
                  className="flex items-start gap-2 text-sm text-emerald-900"
                >
                  <Icon className="mt-0.5 size-4 shrink-0" />
                  <span className="flex-1">
                    {cause.name}: {formatCauseUnits(cause, units)}
                  </span>
                  <span className="tabular-nums">${cost.toFixed(2)}</span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          ~{Math.round(view.co2)} kg CO₂e equivalent (estimate)
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Button
          nativeButton={false}
          render={<Link href="/dashboard/impact" />}
          size="lg"
          className="min-h-12 w-full gap-2 bg-emerald-800 text-cream hover:bg-emerald-900"
        >
          View Your Impact
          <ArrowRight className="size-4" />
        </Button>
        <Button
          nativeButton={false}
          render={<Link href="/marketplace" />}
          variant="outline"
          size="lg"
          className="min-h-12 w-full"
        >
          Browse Marketplace
        </Button>
        <Button
          nativeButton={false}
          render={<Link href="/recommend" />}
          variant="outline"
          size="lg"
          className="min-h-12 w-full"
        >
          Ask Leafy tools
        </Button>
        <Button
          nativeButton={false}
          render={<Link href="/donate" />}
          variant="ghost"
          size="lg"
          className="min-h-12 w-full"
        >
          Support another cause
        </Button>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Causes available:{" "}
        {CAUSES.map((c) => getCause(c.id)?.name).filter(Boolean).join(", ")}.
      </p>
    </div>
  );
}

export default function DonateSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-16 text-center text-muted-foreground">
          <Loader2 className="mx-auto mb-3 size-8 animate-spin opacity-40" />
          Loading…
        </div>
      }
    >
      <DonateSuccessInner />
    </Suspense>
  );
}
