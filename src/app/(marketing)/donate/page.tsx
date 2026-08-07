"use client";

import {
  ArrowRight,
  BookOpen,
  Check,
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
  selectionTotalUnits,
  unitsToDollars,
  type Cause,
  type CauseId,
  type CauseSelection,
} from "@/lib/causes";
import { savePendingDonation } from "@/lib/donate";
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
function quickPicksForCause(
  cause: Cause
): Array<{ dollars: number; label: string }> {
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

function initialSelection(): CauseSelection {
  const next = emptyCauseSelection();
  next.trees = 1; // preserve simple single-cause start
  return next;
}

function initialCustomAmounts(): Record<CauseId, string> {
  return {
    trees: "8",
    ocean: "",
    animals: "",
    education: "",
    climate: "",
  };
}

export default function DonatePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selection, setSelection] = useState<CauseSelection>(initialSelection);
  const [customAmounts, setCustomAmounts] = useState(initialCustomAmounts);
  const [email, setEmail] = useState(user?.email ?? "");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = selectionCost(selection);
  const co2 = selectionCo2(selection);
  const summary = formatLiveImpactSummary(selection);
  const lines = selectionLines(selection);
  const hasSelection = selectionTotalUnits(selection) > 0;
  const canContinue = hasSelection && total >= 0.5;

  const selectedCount = useMemo(
    () => CAUSES.filter((c) => (selection[c.id] || 0) > 0).length,
    [selection]
  );

  function setCauseUnits(id: CauseId, units: number) {
    const cause = CAUSES.find((c) => c.id === id);
    if (!cause) return;
    const nextUnits = Math.max(0, Math.floor(units));
    setSelection((prev) => ({ ...prev, [id]: nextUnits }));
    setCustomAmounts((prev) => ({
      ...prev,
      [id]: nextUnits > 0 ? String(unitsToDollars(cause, nextUnits)) : "",
    }));
  }

  function toggleCause(id: CauseId) {
    const current = selection[id] || 0;
    if (current > 0) {
      setCauseUnits(id, 0);
      return;
    }
    setCauseUnits(id, 1);
  }

  function applyDollars(id: CauseId, dollars: number) {
    const cause = CAUSES.find((c) => c.id === id);
    if (!cause) return;
    const nextUnits = Math.max(1, dollarsToUnits(cause, dollars));
    setSelection((prev) => ({ ...prev, [id]: nextUnits }));
    setCustomAmounts((prev) => ({
      ...prev,
      [id]: String(unitsToDollars(cause, nextUnits)),
    }));
  }

  async function handleContinue() {
    setError(null);
    if (!canContinue) {
      setError("Select at least one cause and amount to continue.");
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

      saveLastDonation(selection, {
        source: "donate",
        userEmail: emailTrim || user?.email || null,
      });
      savePendingDonation({ ...pending, recorded: true });
      await new Promise((r) => window.setTimeout(r, 400));
      router.push("/donate/success?demo=1");
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
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
          Pick one cause or several — each with its own amount — then continue
          once for the combined total. Amounts map to illustrative,
          partner-funded units, not a live carbon audit.
        </p>

        <LeafyHubLinks className="mt-4" dense />

        <div
          role="note"
          className="mt-5 rounded-xl border border-amber-200/90 bg-amber-50/80 px-3.5 py-3 text-sm text-amber-950"
        >
          <p className="font-medium">Honest impact</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-900/85 sm:text-sm">
            For Trees, about <strong>$8 ≈ 1 tree</strong> (illustrative /
            partner-funded). Cause and tree payments fund partner programmes —
            not affiliate cashback. Totals below are estimates — not a guarantee
            of a specific planted tree or CO₂ offset.
          </p>
        </div>

        {/* Multi-select cause cards */}
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

          <div className="grid gap-3">
            {CAUSES.map((cause) => {
              const CIcon = CAUSE_ICONS[cause.icon];
              const units = selection[cause.id] || 0;
              const selected = units > 0;
              const picks = quickPicksForCause(cause);
              const lineCost = unitsToDollars(cause, units);

              return (
                <div
                  key={cause.id}
                  className={cn(
                    "rounded-2xl border transition-all",
                    selected
                      ? `${cause.accentClass} shadow-sm ring-2 ring-emerald-600/35`
                      : "border-border/70 bg-white/80"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleCause(cause.id)}
                    aria-pressed={selected}
                    className="flex w-full items-start gap-3 px-3.5 py-3.5 text-left sm:px-4"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                        selected
                          ? "border-emerald-800 bg-emerald-800 text-cream"
                          : "border-emerald-300 bg-white text-transparent"
                      )}
                      aria-hidden
                    >
                      <Check className="size-3 stroke-[3]" />
                    </span>
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-xl",
                        selected
                          ? "bg-emerald-800 text-cream"
                          : "bg-emerald-100 text-emerald-900"
                      )}
                    >
                      <CIcon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                        <span className="font-heading text-base font-semibold">
                          {cause.name}
                        </span>
                        {selected ? (
                          <span className="text-sm font-semibold tabular-nums">
                            ${lineCost.toFixed(2)}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed opacity-90 sm:text-sm">
                        {cause.tagline}
                      </span>
                      <span className="mt-1.5 block text-[11px] font-medium tabular-nums opacity-80">
                        ${cause.unitPrice} / {cause.unitSingular}
                        {cause.id === "trees" ? " · ≈ 1 tree" : ""}
                        {selected
                          ? ` · ${formatCauseUnits(cause, units)}`
                          : " · tap to add"}
                      </span>
                    </span>
                  </button>

                  {selected ? (
                    <div className="border-t border-current/10 px-3.5 pb-3.5 pt-3 sm:px-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] opacity-70">
                        Amount for {cause.name}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {picks.map((pick) => {
                          const pickUnits = dollarsToUnits(cause, pick.dollars);
                          const active = units === pickUnits;
                          return (
                            <button
                              key={pick.dollars}
                              type="button"
                              onClick={() => applyDollars(cause.id, pick.dollars)}
                              className={cn(
                                "min-h-10 rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors",
                                active
                                  ? "border-emerald-800 bg-emerald-800 text-cream"
                                  : "border-emerald-300/80 bg-white/85 hover:bg-white"
                              )}
                            >
                              <span className="tabular-nums">${pick.dollars}</span>
                              <span className="ml-1 opacity-80">
                                ({pick.label})
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <label
                        htmlFor={`donate-custom-${cause.id}`}
                        className="mt-3 block text-sm font-medium"
                      >
                        Custom amount ($)
                      </label>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <input
                          id={`donate-custom-${cause.id}`}
                          type="number"
                          min={cause.unitPrice}
                          step="1"
                          inputMode="decimal"
                          value={customAmounts[cause.id]}
                          onChange={(e) => {
                            const value = e.target.value;
                            setCustomAmounts((prev) => ({
                              ...prev,
                              [cause.id]: value,
                            }));
                            const n = parseFloat(value);
                            if (Number.isFinite(n) && n > 0) {
                              const nextUnits = dollarsToUnits(cause, n);
                              setSelection((prev) => ({
                                ...prev,
                                [cause.id]: Math.max(0, nextUnits),
                              }));
                            }
                          }}
                          placeholder={String(cause.unitPrice)}
                          className="h-11 w-full max-w-[10rem] rounded-xl border border-input bg-background px-3 text-base tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <button
                          type="button"
                          onClick={() => setCauseUnits(cause.id, 0)}
                          className="min-h-11 rounded-xl px-3 text-sm font-medium text-emerald-900/80 underline-offset-2 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                      <p className="mt-1.5 text-xs opacity-75">
                        Whole units only — ${cause.unitPrice} funds 1{" "}
                        {cause.unitSingular}.
                      </p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        {/* Combined summary */}
        <section className="mt-6 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 via-cream to-white p-4 sm:p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-950">
            <Sparkles className="size-4" />
            Combined gift
          </p>
          {!hasSelection ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Select one or more causes above to build your total.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-emerald-950">
              {lines.map(({ cause: c, units: u, cost }) => {
                const Icon = CAUSE_ICONS[c.icon];
                return (
                  <li
                    key={c.id}
                    className="flex items-start justify-between gap-3"
                  >
                    <span className="flex min-w-0 items-start gap-2">
                      <Icon className="mt-0.5 size-3.5 shrink-0 opacity-80" />
                      <span>
                        {c.name}: {formatCauseUnits(c, u)}
                      </span>
                    </span>
                    <span className="shrink-0 tabular-nums">
                      ${cost.toFixed(2)}
                    </span>
                  </li>
                );
              })}
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
              ~{Math.round(co2)} kg CO₂e equivalent
              <span className="block">(illustrative estimate)</span>
            </p>
          </div>
          {summary ? (
            <p className="mt-3 text-sm font-medium text-emerald-900">{summary}</p>
          ) : null}
        </section>

        {/* Optional contact */}
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

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2">
          {!canContinue ? (
            <p className="text-sm text-muted-foreground">
              Select at least one cause with an amount to continue.
            </p>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              size="lg"
              className="min-h-12 flex-1 gap-2 bg-emerald-800 text-base text-cream hover:bg-emerald-900"
              disabled={submitting || !canContinue}
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
