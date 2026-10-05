"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CAUSES, type CauseId } from "@/lib/causes";

export function HirePayStep({
  requestId,
  listingTitle,
  pricePounds,
}: {
  requestId: string;
  listingTitle: string;
  pricePounds: number;
}) {
  const [amount, setAmount] = useState("");
  const [causeId, setCauseId] = useState<CauseId | "">("");
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
          causeId,
          causePounds: amount,
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
      <p className="mt-6 text-sm font-medium text-foreground">
        Optional amount
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Leave blank for £0. Nothing is added until you type an amount and
        choose a cause.
      </p>
      <label className="mt-3 block text-sm text-muted-foreground" htmlFor="hire-cause-amount">
        Amount (£)
        <Input
          id="hire-cause-amount"
          name="causePounds"
          inputMode="decimal"
          autoComplete="off"
          placeholder=""
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="mt-1"
        />
      </label>
      <fieldset className="mt-6">
        <legend className="text-sm font-medium text-foreground">Cause</legend>
        <div className="mt-2 space-y-2">
          {CAUSES.map((cause) => (
            <label
              key={cause.id}
              className="flex items-center gap-2 text-sm text-foreground"
            >
              <input
                type="radio"
                name="causeId"
                value={cause.id}
                checked={causeId === cause.id}
                onChange={() => setCauseId(cause.id)}
              />
              {cause.name}
            </label>
          ))}
        </div>
      </fieldset>
      {error ? (
        <p className="mt-4 text-sm text-destructive">{error}</p>
      ) : null}
      <Button type="submit" size="lg" className="mt-8 min-h-12" disabled={pending}>
        {pending ? "Opening Stripe…" : "Continue to Stripe"}
      </Button>
    </form>
  );
}
