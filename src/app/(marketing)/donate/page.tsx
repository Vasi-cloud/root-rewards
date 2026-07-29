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
import { useMemo, useState } from "react";

import { MarketplaceBrandBadge } from "@/components/brand/brand-mark";
import { LeafyHubLinks } from "@/components/layout/leafy-hub-links";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import {
  CAUSES,
  dollarsToUnits,
  emptyCauseSelection,
  formatCauseUnits,
  formatLiveImpactSummary,
  selectionCo2,
  selectionCost,
  selectionLines,
  unitsToDollars,
  type Cause,
  type CauseId,
} from "@/lib/causes";
import {
  savePendingDonation,
} from "@/lib/donate";
import { saveLastDonation } from "@/lib/impact-storage";
import { startDonateCheckout } from "@/lib/stripe/client";
import { cn } from "@/lib/utils";
import { validateEmail } from "@/lib/validation";

const CAUSE_ICONS = {
  trees: Leaf,
  waves: Waves,
  paw: PawPrint,
  book: BookOpen,
  sun: Sun,
} as const;

/** Quick dollar picks for Trees; other causes use 1 / 3 / 5 units. */
function quickPicksForCause(cause: Cause): Array<{ dollars: number; label: string }> {
  if (cause.id === "trees") {
    return [
      { dollars: 8, label: "1 tree" },
      { dollars: 24, label: "3 trees" },
      { dollars: 40, label: "5 trees" },
    ];
  }
  return [1, 3, 5].map((n) => ({
    dollars: unitsToDollars(cause, n),
    label: formatCauseUnits(cause, n),
  }));
}

export default function DonatePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [causeId, setCauseId] = useState<CauseId>("trees");
  const [customAmount, setCustomAmount] = useState("");
  const [units, setUnits] = useState(1);
  const [email, setEmail] = useState(user?.email ?? "");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cause = CAUSES.find((c) => c.id === causeId) ?? CAUSES[0];
  const picks = useMemo(() => quickPicksForCause(cause), [cause]);

  const selection = useMemo(() => {
    const next = emptyCauseSelection();
    next[cause.id] = units;
    return next;
  }, [cause.id, units]);

  const total = selectionCost(selection);
  const co2 = selectionCo2(selection);
  const summary = formatLiveImpactSummary(selection);
  const lines = selectionLines(selection);

  function applyDollars(dollars: number) {
    const nextUnits = dollarsToUnits(cause, dollars);
    setUnits(Math.max(1, nextUnits));
    setCustomAmount(String(dollars));
  }

  function selectCause(id: CauseId) {
    setCauseId(id);
    const nextCause = CAUSES.find((c) => c.id === id) ?? CAUSES[0];
    // Keep roughly similar spend when switching causes
    const dollars = Math.max(nextCause.unitPrice, unitsToDollars(cause, units));
    const nextUnits = Math.max(1, dollarsToUnits(nextCause, dollars));
    setUnits(nextUnits);
    setCustomAmount(String(unitsToDollars(nextCause, nextUnits)));
  }

  async function handleContinue() {
    setError(null);
    if (units < 1 || total < 0.5) {
      setError("Choose an amount to support a cause.");
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

    setSubmitting(true);

    const pending = {
      selection,
      email: emailTrim || undefined,
      name: name.trim() || undefined,
      recorded: false,
      createdAt: new Date().toISOString(),
    };

    try {
      if (emailTrim) {
        const stripeResult = await startDonateCheckout({
          email: emailTrim,
          name: name.trim() || undefined,
          causeSelection: selection,
          userId: user?.uid ?? null,
        });

        if ("url" in stripeResult) {
          savePendingDonation(pending);
          window.location.href = stripeResult.url;
          return;
        }

        if ("error" in stripeResult) {
          setError(stripeResult.error);
          setSubmitting(false);
          return;
        }
        // demo mode from API
      }

      // Demo / no email — record locally and thank the donor
      saveLastDonation(selection);
      savePendingDonation({ ...pending, recorded: true });
      await new Promise((r) => window.setTimeout(r, 400));
      router.push("/donate/success?demo=1");
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  const Icon = CAUSE_ICONS[cause.icon];

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
          Help fund trees and partner causes even when you&apos;re not shopping.
          Amounts map to illustrative, partner-funded units — we never claim a
          live carbon audit from a single gift.
        </p>

        <LeafyHubLinks className="mt-4" dense />

        <div
          role="note"
          className="mt-5 rounded-xl border border-amber-200/90 bg-amber-50/80 px-3.5 py-3 text-sm text-amber-950"
        >
          <p className="font-medium">Honest impact</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-900/85 sm:text-sm">
            For Trees, about <strong>$8 ≈ 1 tree</strong> (illustrative /
            partner-funded). Totals below are estimates to keep the experience
            clear — not a guarantee of a specific planted tree or CO₂ offset.
          </p>
        </div>

        {/* Cause picker */}
        <section className="mt-8 space-y-3">
          <h2 className="font-heading text-xl font-semibold text-primary">
            Choose a cause
          </h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {CAUSES.map((c) => {
              const CIcon = CAUSE_ICONS[c.icon];
              const active = c.id === causeId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectCause(c.id)}
                  className={cn(
                    "rounded-2xl border px-3.5 py-3.5 text-left transition-all",
                    active
                      ? `${c.accentClass} shadow-sm ring-2 ring-emerald-600/40`
                      : "border-border/70 bg-white/80 hover:border-emerald-300/80 hover:bg-emerald-50/40"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-xl",
                        active
                          ? "bg-emerald-800 text-cream"
                          : "bg-emerald-100 text-emerald-900"
                      )}
                    >
                      <CIcon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-heading text-base font-semibold">
                        {c.name}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed opacity-90 sm:text-sm">
                        {c.tagline}
                      </p>
                      <p className="mt-1.5 text-[11px] font-medium tabular-nums opacity-80">
                        ${c.unitPrice} / {c.unitSingular}
                        {c.id === "trees" ? " · ≈ 1 tree" : ""}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Amount */}
        <section className={`mt-8 rounded-2xl border p-4 sm:p-5 ${cause.accentClass}`}>
          <div className="mb-1 flex items-center gap-2">
            <Icon className="size-5" />
            <h2 className="font-heading text-lg font-semibold">{cause.name}</h2>
          </div>
          <p className="text-sm opacity-90">{cause.tagline}</p>

          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] opacity-70">
            Quick picks
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {picks.map((pick) => {
              const pickUnits = dollarsToUnits(cause, pick.dollars);
              const active = units === pickUnits;
              return (
                <button
                  key={pick.dollars}
                  type="button"
                  onClick={() => applyDollars(pick.dollars)}
                  className={cn(
                    "min-h-11 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "border-emerald-800 bg-emerald-800 text-cream"
                      : "border-emerald-300/80 bg-white/80 hover:bg-white"
                  )}
                >
                  <span className="tabular-nums">${pick.dollars}</span>
                  <span className="ml-1.5 opacity-80">({pick.label})</span>
                </button>
              );
            })}
          </div>

          <label
            htmlFor="donate-custom"
            className="mt-4 block text-sm font-medium"
          >
            Custom amount ($)
          </label>
          <input
            id="donate-custom"
            type="number"
            min={cause.unitPrice}
            step="1"
            inputMode="decimal"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              const n = parseFloat(e.target.value);
              if (Number.isFinite(n) && n > 0) {
                setUnits(Math.max(0, dollarsToUnits(cause, n)));
              }
            }}
            placeholder={String(cause.unitPrice)}
            className="mt-1.5 h-12 w-full max-w-xs rounded-xl border border-input bg-background px-3 text-base tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="mt-2 text-xs opacity-80">
            Whole units only — ${cause.unitPrice} funds 1 {cause.unitSingular}.
          </p>
        </section>

        {/* Summary */}
        <section className="mt-6 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 via-cream to-white p-4 sm:p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-950">
            <Sparkles className="size-4" />
            Before you continue
          </p>
          {lines.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Pick an amount above to see your estimated impact.
            </p>
          ) : (
            <ul className="mt-3 space-y-1.5 text-sm text-emerald-950">
              {lines.map(({ cause: c, units: u, cost }) => (
                <li
                  key={c.id}
                  className="flex justify-between gap-3 tabular-nums"
                >
                  <span>
                    {c.name}: {formatCauseUnits(c, u)}
                  </span>
                  <span>${cost.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex items-end justify-between border-t border-emerald-200/70 pt-3">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-heading text-2xl font-semibold tabular-nums text-primary">
                ${total.toFixed(2)}
              </p>
            </div>
            <p className="max-w-[14rem] text-right text-xs text-muted-foreground">
              ~{co2} kg CO₂e equivalent
              <span className="block">(illustrative estimate)</span>
            </p>
          </div>
          {summary && (
            <p className="mt-3 text-sm font-medium text-emerald-900">
              {summary}
            </p>
          )}
        </section>

        {/* Optional contact for Stripe receipt */}
        <section className="mt-6 space-y-3">
          <h2 className="font-heading text-lg font-semibold text-primary">
            Contact (optional)
          </h2>
          <p className="text-sm text-muted-foreground">
            Guests can continue without an account. Add an email if you want a
            Stripe receipt when payments are configured; otherwise we&apos;ll
            use a demo thank-you path.
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

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            size="lg"
            className="min-h-12 flex-1 gap-2 bg-emerald-800 text-base text-cream hover:bg-emerald-900"
            disabled={submitting || units < 1}
            onClick={() => void handleContinue()}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Continuing…
              </>
            ) : (
              <>
                Continue · ${total.toFixed(2)}
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/marketplace" />}
            variant="outline"
            size="lg"
            className="min-h-12 sm:w-auto"
          >
            Shop instead
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Prefer shopping? You can also fund causes at{" "}
          <Link
            href="/checkout"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            checkout
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
