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
  emptyCauseGifts,
  emptyCauseSelection,
  formatCauseUnits,
  giftLines,
  giftTotal,
  giftsToIllustrativeUnits,
  parseCauseGifts,
  selectionCo2,
  type CauseGiftAmounts,
  type CauseSelection,
} from "@/lib/causes";
import {
  clearPendingDonation,
  loadPendingDonation,
  parseDonationCauseGifts,
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
      gifts: CauseGiftAmounts;
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
        const gifts =
          pending && giftTotal(pending.gifts) >= 1
            ? pending.gifts
            : emptyCauseGifts();
        if (!pending?.recorded) {
          saveLastDonation(selection, {
            source: "donate",
            userEmail: pending?.email ?? null,
          });
        }
        clearPendingDonation();
        if (!cancelled) {
          setView({
            status: "ok",
            gifts,
            selection,
            total: giftTotal(gifts) >= 1 ? giftTotal(gifts) : 0,
            co2: selectionCo2(
              giftTotal(gifts) >= 1
                ? giftsToIllustrativeUnits(gifts)
                : selection
            ),
            mode: "demo",
          });
        }
        return;
      }

      if (!sessionId?.startsWith("cs_")) {
        const pending = loadPendingDonation();
        if (pending) {
          if (!pending.recorded) {
            saveLastDonation(pending.selection, {
              source: "donate",
              userEmail: pending.email ?? null,
            });
          }
          clearPendingDonation();
          if (!cancelled) {
            const gifts =
              giftTotal(pending.gifts) >= 1
                ? pending.gifts
                : emptyCauseGifts();
            setView({
              status: "ok",
              gifts,
              selection: pending.selection,
              total: giftTotal(gifts) >= 1 ? giftTotal(gifts) : 0,
              co2: selectionCo2(
                giftTotal(gifts) >= 1
                  ? giftsToIllustrativeUnits(gifts)
                  : pending.selection
              ),
              mode: "demo",
            });
          }
          return;
        }
        if (!cancelled) {
          setView({
            status: "error",
            message:
              "Missing donation session. Return to Support a cause to try again.",
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
      let gifts: CauseGiftAmounts =
        pending && giftTotal(pending.gifts) >= 1
          ? pending.gifts
          : parseDonationCauseGifts(verified.metadata?.causeGifts);

      if (giftTotal(gifts) < 1) {
        gifts = parseCauseGifts(emptyCauseGifts());
      }

      let selection: CauseSelection =
        pending?.selection ??
        parseDonationCauseSelection(verified.metadata?.causeSelection);

      if (Object.values(selection).every((n) => !n)) {
        selection =
          giftTotal(gifts) >= 1
            ? giftsToIllustrativeUnits(gifts)
            : emptyCauseSelection();
      }

      if (!pending?.recorded) {
        saveLastDonation(selection, {
          source: "donate",
          userEmail: pending?.email ?? verified.customerEmail ?? null,
        });
      }
      clearPendingDonation();

      const exactTotal =
        giftTotal(gifts) >= 1
          ? giftTotal(gifts)
          : verified.amountTotal != null
            ? verified.amountTotal / 100
            : 0;

      setView({
        status: "ok",
        gifts,
        selection,
        total: exactTotal,
        co2: selectionCo2(
          giftTotal(gifts) >= 1 ? giftsToIllustrativeUnits(gifts) : selection
        ),
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

  const lines = giftLines(view.gifts);

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
        Your gift helps Forest Buddies® support partner causes. Amounts match
        what you selected; unit counts are illustrative estimates — not a GPS
        pin for a tree or a live carbon audit.
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
          £{view.total.toFixed(2)}
        </p>
        {lines.length > 0 && (
          <ul className="mt-4 space-y-2">
            {lines.map(({ cause, units, amount }) => {
              const Icon = CAUSE_ICONS[cause.icon];
              return (
                <li
                  key={cause.id}
                  className="flex items-start gap-2 text-sm text-emerald-900"
                >
                  <Icon className="mt-0.5 size-4 shrink-0" />
                  <span className="min-w-0 flex-1">
                    {cause.name}
                    <span className="mt-0.5 block text-xs text-emerald-800/80">
                      ≈ {formatCauseUnits(cause, units)} illustrative
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums font-medium">
                    £{amount.toFixed(2)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 text-xs text-emerald-900/75">
          ~{Math.round(view.co2)} kg CO₂e equivalent (illustrative)
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Button
          nativeButton={false}
          render={<Link href="/marketplace" />}
          size="lg"
          className="min-h-12 w-full gap-2"
        >
          Browse the shop
          <ArrowRight className="size-4" />
        </Button>
        <Button
          nativeButton={false}
          render={<Link href="/dashboard/impact" />}
          variant="outline"
          size="lg"
          className="min-h-12 w-full"
        >
          View your impact
        </Button>
        <Button
          nativeButton={false}
          render={<Link href="/donate" />}
          variant="ghost"
          size="lg"
          className="min-h-12 w-full"
        >
          Fund another cause
        </Button>
      </div>
    </div>
  );
}

export default function DonateSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-muted-foreground">
          <Loader2 className="mb-3 size-8 animate-spin opacity-50" />
          Loading…
        </div>
      }
    >
      <DonateSuccessInner />
    </Suspense>
  );
}
