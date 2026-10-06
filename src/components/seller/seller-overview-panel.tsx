"use client";

import {
  CheckCircle2,
  Circle,
  DollarSign,
  Eye,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useState } from "react";

import { SellerStat } from "@/components/seller/seller-stat";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  averageOrderValue,
  deriveSellerAnalytics,
  topSellerProducts,
} from "@/lib/seller-analytics";
import { formatCauseUnits, getCause } from "@/lib/causes";
import {
  formatHireRequestReceived,
  hireRequestOverlapsConfirmed,
  type HireRequest,
  type HireRequestStatus,
} from "@/lib/hire-requests";
import {
  isLeaValleySeller,
  leaValleyPublicShopHasLiveHires,
} from "@/lib/lea-valley-guest";
import { formatMoney, formatMoneyCompact } from "@/lib/money";
import type { SellerProfile } from "@/types";

type Tab = "overview" | "products" | "analytics" | "earnings" | "profile";

export function SellerOverviewPanel({
  seller,
  onTab,
  hireRequests = [],
  hireRequestsReady = true,
  hireNewCount = 0,
  hireCardOpen = false,
  onOpenHireRequests,
  onHireRequestStatus,
}: {
  seller: SellerProfile;
  onTab: (tab: Tab) => void;
  hireRequests?: HireRequest[];
  hireRequestsReady?: boolean;
  hireNewCount?: number;
  hireCardOpen?: boolean;
  onOpenHireRequests?: () => void;
  onHireRequestStatus?: (
    id: string,
    status: Extract<HireRequestStatus, "Confirmed" | "Declined">
  ) => Promise<void>;
}) {
  const analytics = deriveSellerAnalytics(seller);
  const pendingCount = seller.products.filter(
    (p) => p.status === "pending"
  ).length;
  const approvedCount = seller.products.filter(
    (p) => p.status === "approved"
  ).length;
  const rejectedCount = seller.products.filter(
    (p) => p.status === "rejected"
  ).length;
  const top = topSellerProducts(seller.products, 3);
  const aov = averageOrderValue(seller);
  const leaValley = isLeaValleySeller(seller);
  const [savingHireId, setSavingHireId] = useState<string | null>(null);
  const [hireStatusError, setHireStatusError] = useState<string | null>(null);

  async function decideHireRow(
    id: string,
    status: Extract<HireRequestStatus, "Confirmed" | "Declined">
  ) {
    if (!onHireRequestStatus) return;
    setSavingHireId(id);
    setHireStatusError(null);
    try {
      await onHireRequestStatus(id, status);
    } catch {
      setHireStatusError("Could not save that decision.");
    } finally {
      setSavingHireId(null);
    }
  }

  const hireQueue = [...hireRequests].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  );

  const liveListingDone = leaValley
    ? leaValleyPublicShopHasLiveHires()
    : approvedCount > 0;

  const checklist = [
    {
      done: Boolean(seller.bio?.trim() && seller.story?.trim()),
      label: "Tell your shop story",
      action: () => onTab("profile"),
    },
    {
      done: liveListingDone,
      label: "Get at least one listing live",
      action: () => onTab("products"),
    },
    {
      done: (seller.earnings.orders ?? 0) > 0,
      label: "Make your first sale",
      action: () => onTab("analytics"),
    },
    {
      done:
        (seller.earnings.orders ?? 0) > 0 &&
        (seller.earnings.available ?? 0) >= 10,
      label: "Reach £10 available to payout",
      action: () => onTab("earnings"),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SellerStat
          icon={DollarSign}
          label="Total earnings"
          value={formatMoney(seller.earnings.total)}
          hint={`~${formatMoneyCompact(Math.round(aov))} avg order`}
        />
        <SellerStat
          icon={TrendingUp}
          label="This month"
          value={formatMoney(seller.earnings.thisMonth)}
          hint={`${analytics.salesThisMonth} sales`}
          accent
        />
        <SellerStat
          icon={Eye}
          label="Shop views"
          value={analytics.viewsThisMonth.toLocaleString()}
          hint={`${analytics.views.toLocaleString()} all-time`}
        />
        <SellerStat
          icon={ShoppingBag}
          label="Products"
          value={String(seller.products.length)}
          hint={`${approvedCount} live · ${pendingCount} in review`}
        />
      </div>

      <Card className="overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50 via-cream to-background">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-primary">
              <Wallet className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">
                Ready to withdraw
              </span>
            </div>
            <p className="font-heading text-3xl font-semibold tabular-nums text-emerald-900">
              {formatMoney(seller.earnings.available ?? 0)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatMoney(seller.earnings.pending)} still in escrow
            </p>
          </div>
          <Button onClick={() => onTab("earnings")} className="gap-1.5">
            <Wallet className="size-4" />
            Open earnings
          </Button>
        </CardContent>
      </Card>

      {leaValley ? (
        <Card>
          <CardHeader>
            <button
              type="button"
              onClick={onOpenHireRequests}
              className="w-full rounded-lg text-left"
            >
              <CardTitle className="flex flex-wrap items-center gap-2 font-heading">
                Hire requests
                {hireNewCount > 0 ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-amber-900">
                    {hireNewCount} new
                  </span>
                ) : null}
              </CardTitle>
              <CardDescription>
                Shoppers asked to rent — confirm dates. This is not a booking.
              </CardDescription>
            </button>
          </CardHeader>
          <CardContent className="space-y-2">
            {hireRequestsReady && hireQueue.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hire requests yet.
              </p>
            ) : !hireCardOpen && hireNewCount > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onOpenHireRequests}
              >
                Open hire requests
              </Button>
            ) : (
              hireQueue.map((row) => {
                const overlaps = hireRequestOverlapsConfirmed(row, hireQueue);
                const received = formatHireRequestReceived(row.createdAt);
                return (
                <div
                  key={row.id}
                  className="rounded-xl border border-border/70 px-3 py-2.5 text-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-medium text-primary">{row.listingTitle}</p>
                    <span className="flex flex-wrap gap-1">
                      {overlaps ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-950">
                          Overlaps
                        </span>
                      ) : null}
                      {row.status === "Confirmed" ||
                      row.status === "Declined" ||
                      row.status === "Paid" ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            row.status === "Paid"
                              ? "bg-emerald-200 text-emerald-900"
                              : row.status === "Confirmed"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {row.status}
                        </span>
                      ) : null}
                    </span>
                  </div>
                  {received ? (
                    <p className="mt-0.5 text-muted-foreground">
                      Received {received}
                    </p>
                  ) : null}
                  <p className="mt-0.5 text-muted-foreground">
                    {row.name} · {row.email}
                  </p>
                  <p className="mt-0.5 text-muted-foreground">
                    Dates · {row.dates}
                  </p>
                  {row.status === "Paid" && row.paidTotal != null ? (
                    <p className="mt-1 text-sm font-medium text-emerald-900">
                      £{row.paidTotal}
                      {row.sellerShare != null && row.partnerPot != null
                        ? ` · Seller share £${row.sellerShare} · Partner pot £${row.partnerPot}`
                        : null}
                    </p>
                  ) : null}
                  {row.status === "new" && !overlaps ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={savingHireId === row.id}
                        onClick={() => void decideHireRow(row.id, "Confirmed")}
                      >
                        Confirm
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={savingHireId === row.id}
                        onClick={() => void decideHireRow(row.id, "Declined")}
                      >
                        Decline
                      </Button>
                    </div>
                  ) : row.status === "new" && overlaps ? (
                    <div className="mt-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={savingHireId === row.id}
                        onClick={() => void decideHireRow(row.id, "Declined")}
                      >
                        Decline
                      </Button>
                    </div>
                  ) : null}
                </div>
                );
              })
            )}
            {hireStatusError ? (
              <p className="text-xs text-destructive">{hireStatusError}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-cream">
          <CardHeader>
            <CardTitle className="font-heading">Your brand impact</CardTitle>
            <CardDescription>
              Causes your shop helps grow — keep telling that story.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(seller.impact ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Add your story on the Profile tab to inspire shoppers.
              </p>
            ) : (
              (seller.impact ?? []).map((row) => {
                const cause = getCause(row.causeId);
                return (
                  <div
                    key={row.causeId}
                    className="flex justify-between rounded-xl border border-emerald-100 bg-white/70 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-emerald-900">
                      {cause?.name ?? row.causeId}
                      {row.label ? (
                        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                          {row.label}
                        </span>
                      ) : null}
                    </span>
                    <span className="tabular-nums text-emerald-800">
                      {cause
                        ? formatCauseUnits(cause, row.unitsSupported)
                        : row.unitsSupported}
                    </span>
                  </div>
                );
              })
            )}
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => onTab("profile")}
            >
              Edit profile & story
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Launch checklist</CardTitle>
            <CardDescription>
              A short path from setup to your first payout.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {checklist.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                className="flex w-full items-center gap-3 rounded-xl border border-border/70 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60"
              >
                {item.done ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-700" />
                ) : (
                  <Circle className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span
                  className={
                    item.done
                      ? "text-muted-foreground line-through"
                      : "font-medium text-foreground"
                  }
                >
                  {item.label}
                </span>
              </button>
            ))}
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg border px-2 py-2">
                <div className="font-semibold text-emerald-800">
                  {approvedCount}
                </div>
                <div className="text-muted-foreground">Live</div>
              </div>
              <div className="rounded-lg border px-2 py-2">
                <div className="font-semibold text-primary">{pendingCount}</div>
                <div className="text-muted-foreground">Review</div>
              </div>
              <div className="rounded-lg border px-2 py-2">
                <div className="font-semibold">{rejectedCount}</div>
                <div className="text-muted-foreground">Rejected</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="font-heading">Top listings</CardTitle>
            <CardDescription>Sales leaders in your shop.</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => onTab("analytics")}>
            Full analytics
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {top.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              List a product or service to start tracking performance.
            </p>
          ) : (
            top.map((product, i) => (
              <div
                key={product.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2.5 text-sm"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span className="truncate font-medium">{product.name}</span>
                </div>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {product.sales} sold · {product.views} views
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
