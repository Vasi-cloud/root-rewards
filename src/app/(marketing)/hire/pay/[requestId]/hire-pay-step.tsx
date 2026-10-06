"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CAUSES, type CauseId } from "@/lib/causes";
import { LEA_VALLEY_HIRE_CARD_DEPOSIT_POUNDS } from "@/lib/lea-valley-guest";
import { cn } from "@/lib/utils";

const EMPTY_AMOUNTS: Record<CauseId, string> = {
  trees: "",
  ocean: "",
  animals: "",
  education: "",
  climate: "",
};

function typedPounds(value: string): number {
  const text = value.trim();
  if (!text) return 0;
  const n = Number(text);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

function formatPounds(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

export function HirePayStep({
  requestId,
  listingTitle,
  pricePounds,
}: {
  requestId: string;
  listingTitle: string;
  pricePounds: number;
}) {
  const [amounts, setAmounts] = useState(EMPTY_AMOUNTS);
  const [cardDeposit, setCardDeposit] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const causeTotal = CAUSES.reduce(
    (sum, cause) => sum + typedPounds(amounts[cause.id]),
    0
  );
  const depositPounds = cardDeposit ? LEA_VALLEY_HIRE_CARD_DEPOSIT_POUNDS : 0;
  const total =
    Math.round((pricePounds + causeTotal + depositPounds) * 100) / 100;

  async function continueToStripe(event: React.FormEvent) {
    event.preventDefault();
    if (!acceptedTerms) {
      setError("Accept the terms to continue.");
      return;
    }
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/checkout/hire-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          causes: amounts,
          cardDeposit,
          acceptedTerms: true,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not open Stripe Checkout.");
        setPending(false);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError("Could not open Stripe Checkout.");
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={continueToStripe}
      className="mx-auto max-w-lg px-4 py-12 sm:py-16"
    >
      <h1 className="font-heading text-3xl font-semibold text-primary">
        Pay for this hire
      </h1>
      <p className="mt-3 text-base text-muted-foreground">{listingTitle}</p>
      <p className="mt-6 text-base font-medium text-foreground">
        Hire £{formatPounds(pricePounds)}
      </p>
      <p className="mt-6 text-sm font-medium text-foreground">Optional causes</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Leave a box blank for £0.
      </p>
      <div className="mt-4 space-y-3">
        {CAUSES.map((cause) => (
          <label
            key={cause.id}
            className={cn(
              "block rounded-2xl border px-3.5 py-3.5 text-sm font-medium sm:px-4",
              cause.accentClass
            )}
            htmlFor={`hire-cause-${cause.id}`}
          >
            {cause.name}
            <Input
              id={`hire-cause-${cause.id}`}
              name={cause.id}
              inputMode="decimal"
              autoComplete="off"
              placeholder=""
              value={amounts[cause.id]}
              onChange={(event) =>
                setAmounts((current) => ({
                  ...current,
                  [cause.id]: event.target.value,
                }))
              }
              className="mt-1 bg-white/90"
            />
          </label>
        ))}
      </div>
      <p className="mt-6 text-base font-semibold text-foreground">
        Total £{formatPounds(total)}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {cardDeposit
          ? "£50 deposit is on this card payment. Refunded if the bike comes back as issued."
          : "£50 deposit is cash at the lock on pickup, not charged here."}
      </p>
      <label className="mt-3 flex items-start gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={cardDeposit}
          onChange={(event) => setCardDeposit(event.target.checked)}
        />
        Pay the £50 deposit on the card
      </label>
      <div className="mt-6 rounded-2xl border border-border/70 bg-white/70 px-3.5 py-3.5 text-sm text-foreground">
        <p className="font-medium">Listing terms</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Collect at 10:00 at the Lea Valley lock</li>
          <li>Return by 18:00</li>
          <li>Bring ID</li>
          <li>Helmet and lock included</li>
          <li>Riding at the rider’s risk</li>
          <li>
            £50 deposit is cash at the lock unless you tick the card deposit
          </li>
        </ul>
      </div>
      <label className="mt-3 flex items-start gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={acceptedTerms}
          onChange={(event) => setAcceptedTerms(event.target.checked)}
        />
        I accept these terms.
      </label>
      {error ? (
        <p className="mt-4 text-sm text-destructive">{error}</p>
      ) : null}
      <Button
        type="submit"
        size="lg"
        className="mt-8 min-h-12"
        disabled={!acceptedTerms || pending}
      >
        {pending ? "Opening Stripe…" : "Continue to Stripe"}
      </Button>
    </form>
  );
}
