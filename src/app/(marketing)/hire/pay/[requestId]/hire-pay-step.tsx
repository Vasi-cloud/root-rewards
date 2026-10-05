"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CAUSES, type CauseId } from "@/lib/causes";
import { cn } from "@/lib/utils";

const EMPTY_AMOUNTS: Record<CauseId, string> = {
  trees: "",
  ocean: "",
  animals: "",
  education: "",
  climate: "",
};

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
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function continueToStripe(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/checkout/hire-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          causes: amounts,
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
      <p className="mt-3 text-base text-muted-foreground">
        {listingTitle}
        {pricePounds > 0 ? ` · £${pricePounds}` : ""}
      </p>
      <p className="mt-6 text-sm text-muted-foreground">
        Leave a box blank for £0. Each amount you type is added.
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
      {error ? (
        <p className="mt-4 text-sm text-destructive">{error}</p>
      ) : null}
      <Button type="submit" size="lg" className="mt-8 min-h-12" disabled={pending}>
        {pending ? "Opening Stripe…" : "Continue to Stripe"}
      </Button>
    </form>
  );
}
