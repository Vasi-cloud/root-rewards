"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getLeaValleyHireRequest,
  type HireRequest,
} from "@/lib/hire-requests";
import {
  LEA_VALLEY_HIRE_TREE_ADDON_DEFAULT_POUNDS,
  LEA_VALLEY_HIRE_TREE_ADDON_LABEL,
  leaValleyHirePricePounds,
} from "@/lib/lea-valley-guest";

export default function HirePayPage() {
  const params = useParams<{ requestId: string }>();
  const requestId = decodeURIComponent(params.requestId ?? "");
  const [row, setRow] = useState<HireRequest | null>(null);
  const [message, setMessage] = useState("Loading this hire…");
  const [starting, setStarting] = useState(false);
  const [addPartner, setAddPartner] = useState(false);
  const [partnerAmount, setPartnerAmount] = useState(
    String(LEA_VALLEY_HIRE_TREE_ADDON_DEFAULT_POUNDS)
  );

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
  const typedPartner = Number(partnerAmount);
  const partnerPounds =
    addPartner && Number.isFinite(typedPartner) && typedPartner >= 1
      ? Math.min(100, Math.round(typedPartner * 100) / 100)
      : 0;
  const totalPounds = hirePounds != null ? hirePounds + partnerPounds : null;

  async function startPay() {
    if (!row || starting) return;
    if (addPartner && partnerPounds < 1) {
      setMessage("Enter at least £1, or leave the box unticked.");
      return;
    }
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
          partnerPotPounds: partnerPounds,
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

      <label className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-card px-3.5 py-3 text-left text-sm">
        <input
          type="checkbox"
          className="mt-0.5 size-4 accent-primary"
          checked={addPartner}
          onChange={(e) => setAddPartner(e.target.checked)}
        />
        <span className="min-w-0 flex-1">
          <span className="block">{LEA_VALLEY_HIRE_TREE_ADDON_LABEL}</span>
          <span className="mt-2 flex items-center gap-2">
            <span className="text-muted-foreground">£</span>
            <Input
              type="number"
              min={1}
              max={100}
              step={1}
              inputMode="decimal"
              value={partnerAmount}
              disabled={!addPartner}
              onChange={(e) => setPartnerAmount(e.target.value)}
              className="h-9 w-24"
              aria-label="Amount toward a partner tree programme"
            />
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
