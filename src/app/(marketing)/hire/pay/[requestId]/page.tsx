"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  getLeaValleyHireRequest,
  type HireRequest,
} from "@/lib/hire-requests";
import { leaValleyHirePricePounds } from "@/lib/lea-valley-guest";

export default function HirePayPage() {
  const params = useParams<{ requestId: string }>();
  const requestId = decodeURIComponent(params.requestId ?? "");
  const [row, setRow] = useState<HireRequest | null>(null);
  const [message, setMessage] = useState("Loading this hire…");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!requestId) {
        setMessage("Missing hire request.");
        return;
      }
      try {
        const found = await getLeaValleyHireRequest(requestId);
        if (cancelled) return;
        if (!found) {
          setMessage("That hire request was not found.");
          return;
        }
        if (found.status === "Paid") {
          setMessage("This hire is already paid.");
          return;
        }
        if (found.status !== "Confirmed") {
          setMessage("The seller has not confirmed this request yet.");
          return;
        }
        setRow(found);
        setMessage("");
      } catch {
        if (!cancelled) setMessage("Could not load this hire request.");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [requestId]);

  const hirePounds = row
    ? leaValleyHirePricePounds({
        id: row.listingId,
        name: row.listingTitle,
      })
    : null;

  async function startPay() {
    if (!row || starting) return;
    setStarting(true);
    setMessage("");
    try {
      const res = await fetch("/api/checkout/hire-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: row.id,
          listingId: row.listingId,
          listingTitle: row.listingTitle,
          email: row.email,
          dates: row.dates,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.url) {
        setMessage(data.error ?? "Could not open Stripe Checkout.");
        setStarting(false);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setMessage("Could not open Stripe Checkout.");
      setStarting(false);
    }
  }

  if (!row) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-heading text-2xl font-semibold text-primary">Pay</h1>
        <p className="mt-3 text-muted-foreground">{message}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:py-16">
      <h1 className="font-heading text-2xl font-semibold text-primary">Pay</h1>
      <p className="mt-2 font-medium text-primary">{row.listingTitle}</p>
      <p className="mt-1 text-sm text-muted-foreground">Dates · {row.dates}</p>
      {hirePounds != null ? (
        <p className="mt-4 text-sm">Hire · £{hirePounds}</p>
      ) : null}

      {message ? (
        <p className="mt-3 text-sm text-destructive">{message}</p>
      ) : null}

      <Button
        type="button"
        className="mt-6 min-h-11 w-full"
        disabled={starting}
        onClick={() => void startPay()}
      >
        {starting
          ? "Opening Stripe Checkout…"
          : hirePounds != null
            ? `Pay £${hirePounds}`
            : "Pay"}
      </Button>
    </div>
  );
}
