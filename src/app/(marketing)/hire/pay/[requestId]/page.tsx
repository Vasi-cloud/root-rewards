"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  getLeaValleyHireRequest,
  type HireRequest,
} from "@/lib/hire-requests";
import { leaValleyHirePricePounds } from "@/lib/lea-valley-guest";

export default function HirePayPage() {
  const params = useParams<{ requestId: string }>();
  const requestId = decodeURIComponent(params.requestId ?? "");
  const [message, setMessage] = useState("Opening Stripe Checkout…");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!requestId) {
        setMessage("Missing hire request.");
        return;
      }

      let row: HireRequest | null = null;
      try {
        row = await getLeaValleyHireRequest(requestId);
      } catch {
        if (!cancelled) setMessage("Could not load this hire request.");
        return;
      }

      if (cancelled) return;
      if (!row) {
        setMessage("That hire request was not found.");
        return;
      }
      if (row.status === "Paid") {
        setMessage("This hire is already paid.");
        return;
      }
      if (row.status !== "Confirmed") {
        setMessage("The seller has not confirmed this request yet.");
        return;
      }

      const pounds = leaValleyHirePricePounds({
        id: row.listingId,
        name: row.listingTitle,
      });
      setMessage(
        pounds
          ? `Opening Stripe Checkout · £${pounds}…`
          : "Opening Stripe Checkout…"
      );

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
          if (!cancelled) {
            setMessage(data.error ?? "Could not open Stripe Checkout.");
          }
          return;
        }
        window.location.assign(data.url);
      } catch {
        if (!cancelled) setMessage("Could not open Stripe Checkout.");
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [requestId]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="font-heading text-2xl font-semibold text-primary">Pay</h1>
      <p className="mt-3 text-muted-foreground">{message}</p>
    </div>
  );
}
