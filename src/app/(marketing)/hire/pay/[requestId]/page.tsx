"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  getLeaValleyHireRequest,
  type HireRequest,
} from "@/lib/hire-requests";
import {
  LEA_VALLEY_HIRE_TREE_ADDON_LABEL,
  LEA_VALLEY_HIRE_TREE_ADDON_POUNDS,
  leaValleyHirePricePounds,
} from "@/lib/lea-valley-guest";

export default function HirePayPage() {
  const params = useParams<{ requestId: string }>();
  const requestId = decodeURIComponent(params.requestId ?? "");
  const [row, setRow] = useState<HireRequest | null>(null);
  const [message, setMessage] = useState("Loading this hire…");
  const [treeAddon, setTreeAddon] = useState(false);
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
  const totalPounds =
    hirePounds != null
      ? hirePounds + (treeAddon ? LEA_VALLEY_HIRE_TREE_ADDON_POUNDS : 0)
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
          treeAddon,
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
        <p className="mt-4 text-sm">
          Hire · £{hirePounds}
          {treeAddon
            ? ` · ${LEA_VALLEY_HIRE_TREE_ADDON_LABEL} · Total £${totalPounds}`
            : ` · Total £${hirePounds}`}
        </p>
      ) : null}

      <label className="mt-5 flex items-start gap-3 rounded-xl border border-border bg-card px-3.5 py-3 text-left text-sm">
        <input
          type="checkbox"
          className="mt-0.5 size-4 accent-primary"
          checked={treeAddon}
          onChange={(e) => setTreeAddon(e.target.checked)}
        />
        <span>
          {LEA_VALLEY_HIRE_TREE_ADDON_LABEL}
          <span className="mt-0.5 block text-xs text-muted-foreground">
            Optional · off unless you tick this box. Not a planted tree.
          </span>
        </span>
      </label>

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
          : totalPounds != null
            ? `Pay £${totalPounds}`
            : "Pay"}
      </Button>
    </div>
  );
}
