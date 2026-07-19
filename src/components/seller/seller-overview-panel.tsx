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
import type { SellerProfile } from "@/types";

type Tab = "overview" | "products" | "analytics" | "earnings" | "profile";

export function SellerOverviewPanel({
  seller,
  onTab,
}: {
  seller: SellerProfile;
  onTab: (tab: Tab) => void;
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

  const checklist = [
    {
      done: Boolean(seller.bio?.trim() && seller.story?.trim()),
      label: "Tell your shop story",
      action: () => onTab("profile"),
    },
    {
      done: approvedCount > 0,
      label: "Get at least one listing live",
      action: () => onTab("products"),
    },
    {
      done: (seller.earnings.orders ?? 0) > 0,
      label: "Make your first sale",
      action: () => onTab("analytics"),
    },
    {
      done: (seller.earnings.available ?? 0) >= 10,
      label: "Reach $10 available to payout",
      action: () => onTab("earnings"),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SellerStat
          icon={DollarSign}
          label="Total earnings"
          value={`$${seller.earnings.total.toFixed(2)}`}
          hint={`~$${aov.toFixed(0)} avg order`}
        />
        <SellerStat
          icon={TrendingUp}
          label="This month"
          value={`$${seller.earnings.thisMonth.toFixed(2)}`}
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
              ${(seller.earnings.available ?? 0).toFixed(2)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              ${seller.earnings.pending.toFixed(2)} still in escrow
            </p>
          </div>
          <Button onClick={() => onTab("earnings")} className="gap-1.5">
            <Wallet className="size-4" />
            Open earnings
          </Button>
        </CardContent>
      </Card>

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
