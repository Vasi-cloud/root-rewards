"use client";

import {
  ArrowRight,
  BookOpen,
  HeartHandshake,
  Leaf,
  Loader2,
  PawPrint,
  Sparkles,
  Sun,
  Waves,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { MarketplaceBrandBadge } from "@/components/brand/brand-mark";
import { CauseGiftPicker } from "@/components/causes/cause-gift-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import {
  CAUSE_GIFT_PRESETS,
  CAUSES,
  clampCauseGiftGbp,
  emptyCauseGifts,
  formatGiftImpactSummary,
  giftLines,
  giftSelectedCount,
  giftTotal,
  giftsToIllustrativeUnits,
  loadCartCauseGifts,
  type CauseGiftAmounts,
  type CauseId,
} from "@/lib/causes";
import { savePendingDonation } from "@/lib/donate";
import { saveLastDonation } from "@/lib/impact-storage";
import { startDonateCheckout } from "@/lib/stripe/client";
import { validateEmail } from "@/lib/validation";

const CAUSE_ICONS = {
  trees: Leaf,
  waves: Waves,
  paw: PawPrint,
  book: BookOpen,
  sun: Sun,
} as const;

/** Cap “Starting checkout…” so a hung API cannot spin forever. */
const CHECKOUT_SPIN_MS = 20_000;

const CANCEL_MESSAGE =
  "Checkout canceled — no payment was taken. Choose your causes again when you’re ready.";

function wasCanceledReturn(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("canceled") === "1";
}

function initialGifts(): CauseGiftAmounts {
  if (typeof window !== "undefined") {
    if (wasCanceledReturn()) return emptyCauseGifts();
    const fromCart = loadCartCauseGifts();
    if (giftTotal(fromCart) >= 1) return fromCart;
  }
  const next = emptyCauseGifts();
  next.trees = CAUSE_GIFT_PRESETS[0];
  return next;
}

function initialError(): string | null {
  return wasCanceledReturn() ? CANCEL_MESSAGE : null;
}

export default function DonatePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [gifts, setGifts] = useState<CauseGiftAmounts>(initialGifts);
  const [email, setEmail] = useState(user?.email ?? "");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const submittingRef = useRef(false);

  const total = giftTotal(gifts);
  const lines = giftLines(gifts);
  const summary = formatGiftImpactSummary(gifts);
  const selectedCount = giftSelectedCount(gifts);
  const hasSelection = selectedCount > 0;
  const canContinue = hasSelection && total >= 1;
  const co2 = useMemo(
    () => lines.reduce((sum, line) => sum + line.co2, 0),
    [lines]
  );

  function stopSubmitting() {
    submittingRef.current = false;
    setSubmitting(false);
  }

  function resetDonateUi(message: string | null) {
    stopSubmitting();
    setGifts(emptyCauseGifts());
    setError(message);
  }

  // Stripe cancel return + strip query so refresh doesn’t re-show the banner forever.
  useEffect(() => {
    if (!wasCanceledReturn()) return;
    resetDonateUi(CANCEL_MESSAGE);
    window.history.replaceState({}, "", "/donate");
  }, []);

  // Browser back from Checkout (bfcache) leaves submitting=true — clear it.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted && !submittingRef.current) return;
      resetDonateUi(
        "Checkout was interrupted. Choose your causes again, then continue."
      );
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  // Cap the spinner if create-session hangs.
  useEffect(() => {
    if (!submitting) return;
    const timer = window.setTimeout(() => {
      resetDonateUi(
        "Checkout is taking too long. Please try again in a moment."
      );
    }, CHECKOUT_SPIN_MS);
    return () => window.clearTimeout(timer);
  }, [submitting]);

  function giveNow(id: CauseId, amount: number) {
    const next = emptyCauseGifts();
    next[id] = clampCauseGiftGbp(amount);
    setGifts(next);
    return next;
  }

  async function handleContinue(override?: CauseGiftAmounts) {
    setError(null);
    const payload = override ?? gifts;
    const payTotal = giftTotal(payload);
    if (payTotal < 1) {
      setError("Select at least one cause and amount (£1+) to continue.");
      return;
    }

    const emailTrim = email.trim();
    if (emailTrim) {
      const emailResult = validateEmail(emailTrim);
      if (!emailResult.ok) {
        setError(emailResult.error);
        return;
      }
    }

    submittingRef.current = true;
    setSubmitting(true);
    const selection = giftsToIllustrativeUnits(payload);

    const pending = {
      selection,
      gifts: payload,
      email: emailTrim || undefined,
      name: name.trim() || undefined,
      recorded: false,
      createdAt: new Date().toISOString(),
    };

    let redirected = false;
    try {
      if (emailTrim) {
        const stripeResult = await startDonateCheckout({
          email: emailTrim,
          name: name.trim() || undefined,
          causeGifts: payload,
          causeSelection: selection,
          userId: user?.uid ?? null,
        });

        if ("url" in stripeResult) {
          savePendingDonation(pending);
          redirected = true;
          window.location.href = stripeResult.url;
          return;
        }

        if ("error" in stripeResult) {
          // Keep current cause picks so the shopper can retry; clear spinner.
          stopSubmitting();
          setError(stripeResult.error);
          return;
        }
      }

      saveLastDonation(selection, {
        source: "donate",
        userEmail: emailTrim || user?.email || null,
      });
      savePendingDonation({ ...pending, recorded: true });
      await new Promise((r) => window.setTimeout(r, 400));
      redirected = true;
      router.push("/donate/success?demo=1");
    } catch {
      stopSubmitting();
      setError("Something went wrong. Please try again.");
    } finally {
      if (!redirected) stopSubmitting();
    }
  }

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_80%_55%_at_50%_-5%,rgba(149,213,178,0.4),transparent)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-14">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <MarketplaceBrandBadge />
          <Badge className="gap-1 bg-emerald-800/10 font-normal text-emerald-900">
            <HeartHandshake className="size-3.5" />
            Support a cause
          </Badge>
        </div>

        <h1 className="font-heading max-w-2xl text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
          Fund impact — no purchase needed
        </h1>
        <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:mt-3 sm:text-base">
          Select one or more causes with their own amounts (£5 / £10 / £25 or
          custom from £1), then checkout once for the combined total. Choosing
          an amount on one cause does not clear the others.
        </p>

        <p className="mt-4">
          <Link
            href="/marketplace"
            className="text-sm font-medium text-emerald-900 underline-offset-2 hover:underline"
          >
            Back to Marketplace
          </Link>
        </p>

        <div
          role="note"
          className="mt-5 rounded-xl border border-amber-200/90 bg-amber-50/80 px-3.5 py-3 text-sm text-amber-950"
        >
          <p className="font-medium">Honest impact</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-900/85 sm:text-sm">
            Gifts are <strong>partner-funded / illustrative</strong> — roughly
            £5 ≈ 1 tree unit for Trees. This is not a GPS pin for a planted
            tree, and not a live carbon audit. Cause payments fund partner
            programmes, not affiliate cashback.
          </p>
        </div>

        <section className="mt-8 space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="font-heading text-xl font-semibold text-primary">
              Choose causes
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {selectedCount === 0
                ? "Tap to add one or more"
                : `${selectedCount} selected`}
            </p>
          </div>
          <CauseGiftPicker gifts={gifts} onChange={setGifts} />
        </section>

        <section className="mt-6 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 via-cream to-white p-4 sm:p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-950">
            <Sparkles className="size-4" />
            Running summary
          </p>
          {!hasSelection ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Select one or more causes above to build your total.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-emerald-950">
              {lines.map(({ cause: c, amount, units }) => {
                const Icon = CAUSE_ICONS[c.icon];
                return (
                  <li
                    key={c.id}
                    className="flex items-start justify-between gap-3"
                  >
                    <span className="flex min-w-0 items-start gap-2">
                      <Icon className="mt-0.5 size-3.5 shrink-0 opacity-80" />
                      <span>
                        {c.name}
                        <span className="mt-0.5 block text-xs opacity-75">
                          ≈ {units} illustrative{" "}
                          {units === 1 ? c.unitSingular : c.unitPlural}
                        </span>
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
          <div className="mt-3 flex items-end justify-between border-t border-emerald-200/70 pt-3">
            <div>
              <p className="text-xs text-muted-foreground">Payable total</p>
              <p className="font-heading text-2xl font-semibold tabular-nums text-primary">
                £{total.toFixed(2)}
              </p>
            </div>
            <p className="max-w-[14rem] text-right text-xs text-muted-foreground">
              ~{Math.round(co2)} kg CO₂e equivalent
              <span className="block">(illustrative estimate)</span>
            </p>
          </div>
          {summary ? (
            <p className="mt-3 text-sm font-medium text-emerald-900">{summary}</p>
          ) : null}
        </section>

        <section className="mt-6 space-y-3">
          <h2 className="font-heading text-lg font-semibold text-primary">
            Contact (optional)
          </h2>
          <p className="text-sm text-muted-foreground">
            Add an email for a Stripe receipt when payments are live; otherwise
            we use a demo thank-you path.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="donate-name" className="text-sm font-medium">
                Name
              </label>
              <input
                id="donate-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="donate-email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="donate-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </section>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3">
          <Button
            type="button"
            size="lg"
            className="min-h-12 w-full gap-2 bg-emerald-800 text-base text-cream hover:bg-emerald-900 sm:min-h-14"
            disabled={submitting || !canContinue}
            onClick={() => void handleContinue()}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Starting checkout…
              </>
            ) : (
              <>
                Checkout selected (£{total.toFixed(2)})
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>

          <div className="rounded-xl border border-border/70 bg-white/70 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Single-cause shortcut — this tap clears other selections and goes
              to checkout
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {CAUSES.map((cause) => (
                <Button
                  key={cause.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-11"
                  disabled={submitting}
                  onClick={() => {
                    const one = giveNow(cause.id, CAUSE_GIFT_PRESETS[0]);
                    void handleContinue(one);
                  }}
                >
                  Give £{CAUSE_GIFT_PRESETS[0]} now · {cause.name}
                </Button>
              ))}
            </div>
          </div>

          <Button
            nativeButton={false}
            render={<Link href="/marketplace" />}
            variant="outline"
            size="lg"
            className="min-h-12"
          >
            Shop instead
          </Button>
        </div>
      </div>
    </div>
  );
}
