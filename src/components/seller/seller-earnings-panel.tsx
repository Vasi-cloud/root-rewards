"use client";

import { useState } from "react";
import {
  DollarSign,
  Leaf,
  Package,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { payoutStatusBadge } from "@/components/seller/seller-hub-utils";
import { SellerStat } from "@/components/seller/seller-stat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SellerProfile } from "@/types";

export function SellerEarningsPanel({
  seller,
  onRequestPayout,
}: {
  seller: SellerProfile;
  onRequestPayout: () => boolean;
}) {
  const [payoutMessage, setPayoutMessage] = useState<string | null>(null);
  const nextPayout = (seller.payouts ?? []).find(
    (p) => p.status === "scheduled" || p.status === "processing"
  );
  const available = seller.earnings.available ?? 0;
  const payoutProgress = Math.min(100, (available / 10) * 100);

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2 text-primary">
          <Leaf className="size-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">
            Eco payouts
          </span>
        </div>
        <h2 className="font-heading text-xl font-semibold text-primary sm:text-2xl">
          Earnings
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Transparent splits, escrow timing, and payouts — built for makers who
          care where money grows.
        </p>
      </div>

      <Card className="overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50 via-cream to-background">
        <CardContent className="grid gap-6 p-6 sm:grid-cols-[1.2fr_1fr] sm:items-center">
          <div>
            <p className="text-sm text-muted-foreground">Available balance</p>
            <p className="mt-1 font-heading text-4xl font-semibold tabular-nums text-emerald-900">
              ${available.toFixed(2)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              ${seller.earnings.pending.toFixed(2)} in escrow · $
              {seller.earnings.thisMonth.toFixed(2)} earned this month
            </p>
            {nextPayout ? (
              <p className="mt-3 text-sm text-primary">
                Next: ${nextPayout.amount.toFixed(2)} ·{" "}
                {payoutStatusBadge(nextPayout.status).label.toLowerCase()} for{" "}
                {nextPayout.scheduledFor}
              </p>
            ) : null}
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Minimum payout $10</span>
                <span className="tabular-nums">{Math.round(payoutProgress)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-emerald-100">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all"
                  style={{ width: `${Math.max(4, payoutProgress)}%` }}
                />
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <Button
              className="w-full gap-1.5"
              disabled={available < 10}
              onClick={() => {
                const ok = onRequestPayout();
                setPayoutMessage(
                  ok
                    ? "Payout requested — status set to processing."
                    : "Need at least $10 available to request a payout."
                );
              }}
            >
              <Wallet className="size-4" />
              Request ${available.toFixed(2)}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Minimum $10 · transfer to{" "}
              {seller.payoutMethod ?? "Bank transfer ····4821"}
            </p>
          </div>
        </CardContent>
      </Card>

      {payoutMessage && (
        <p className="rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-900">
          {payoutMessage}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <SellerStat
          icon={DollarSign}
          label="Lifetime"
          value={`$${seller.earnings.total.toFixed(2)}`}
          hint="Paid + pending"
        />
        <SellerStat
          icon={Package}
          label="In escrow"
          value={`$${seller.earnings.pending.toFixed(2)}`}
          hint="Settles after delivery"
        />
        <SellerStat
          icon={TrendingUp}
          label="This month"
          value={`$${seller.earnings.thisMonth.toFixed(2)}`}
          hint={`${seller.earnings.orders} orders lifetime`}
          accent
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Earnings breakdown</CardTitle>
            <CardDescription>
              Transparent split — platform fee, causes, and your net share.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {(() => {
              const b = seller.earnings.breakdown;
              if (!b) {
                return (
                  <p className="text-muted-foreground">
                    Breakdown appears after your first sales cycle.
                  </p>
                );
              }
              const maxCat = Math.max(1, ...b.byCategory.map((c) => c.amount));
              return (
                <>
                  <div className="flex justify-between rounded-xl border px-4 py-3">
                    <span>Gross product sales</span>
                    <span className="font-medium tabular-nums">
                      ${b.productSales.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between rounded-xl border px-4 py-3">
                    <span>Platform fee (15%)</span>
                    <span className="font-medium tabular-nums text-muted-foreground">
                      −${b.platformFee.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
                    <span>Cause contribution</span>
                    <span className="font-medium tabular-nums text-emerald-800">
                      −${b.causeContribution.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                    <span className="font-medium">Your net share</span>
                    <span className="font-semibold tabular-nums text-primary">
                      ${b.sellerShare.toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-2">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      By category
                    </p>
                    <div className="space-y-2">
                      {b.byCategory.map((row) => (
                        <div key={row.category}>
                          <div className="mb-1 flex justify-between text-xs">
                            <span>{row.category}</span>
                            <span className="tabular-nums">
                              ${row.amount.toFixed(2)}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-emerald-100">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{
                                width: `${Math.max(
                                  8,
                                  (row.amount / maxCat) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Payout details</CardTitle>
            <CardDescription>
              85% seller share · 15% platform · optional cause slice
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-3">
              <span>Method</span>
              <span className="font-medium">
                {seller.payoutMethod ?? "Bank transfer ····4821"}
              </span>
            </div>
            <div className="flex justify-between rounded-xl border px-4 py-3">
              <span>Seller share</span>
              <span className="font-medium text-emerald-800">85%</span>
            </div>
            <div className="flex justify-between rounded-xl border px-4 py-3">
              <span>Platform fee</span>
              <span className="font-medium">15%</span>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
              Sales credit your shop when a shopper checks out with your
              listings. Escrow clears into available after the delivery window.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">How it works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {[
            "Shop sales credit your earnings automatically",
            "Part settles to available; part stays in escrow briefly",
            "A small slice can fund causes tied to your shop",
            "Request payout anytime once you hit $10 available",
          ].map((step, i) => (
            <div key={step} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <p className="text-muted-foreground">{step}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Payout history</CardTitle>
          <CardDescription>
            Scheduled, processing, and completed transfers.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {(seller.payouts ?? []).length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              No payouts yet.
            </p>
          ) : (
            seller.payouts.map((payout) => {
              const badge = payoutStatusBadge(payout.status);
              return (
                <div
                  key={payout.id}
                  className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium tabular-nums">
                        ${payout.amount.toFixed(2)}
                      </span>
                      <Badge className={badge.className}>{badge.label}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {payout.method}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground sm:text-right">
                    {payout.status === "paid" && payout.paidAt
                      ? `Paid ${payout.paidAt}`
                      : `Scheduled ${payout.scheduledFor}`}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
