"use client";

import {
  BarChart3,
  DollarSign,
  Eye,
  Leaf,
  Package,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";

import { productStatusBadge } from "@/components/seller/seller-hub-utils";
import { SellerStat } from "@/components/seller/seller-stat";
import { Badge } from "@/components/ui/badge";
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
import { listingTypeLabel } from "@/lib/listing-categories";
import type { SellerProfile } from "@/types";

export function SellerAnalyticsPanel({ seller }: { seller: SellerProfile }) {
  const analytics = deriveSellerAnalytics(seller);
  const topProducts = topSellerProducts(seller.products, 5);
  const maxTopViews = Math.max(1, ...topProducts.map((p) => p.views || 0));
  const aov = averageOrderValue(seller);
  const productCount = seller.products.filter(
    (p) => p.listingType !== "service"
  ).length;
  const serviceCount = seller.products.filter(
    (p) => p.listingType === "service"
  ).length;
  const funnelWidth = Math.min(
    100,
    Math.max(6, analytics.conversionRate * 12)
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2 text-primary">
          <Leaf className="size-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">
            Sales pulse
          </span>
        </div>
        <h2 className="font-heading text-xl font-semibold text-primary sm:text-2xl">
          Analytics
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Views, conversions, and what&apos;s selling — updated when shoppers
          buy from your shop.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SellerStat
          icon={Eye}
          label="Total views"
          value={analytics.views.toLocaleString()}
          hint={`${analytics.viewsThisMonth.toLocaleString()} this month`}
          accent
        />
        <SellerStat
          icon={ShoppingBag}
          label="Total sales"
          value={String(analytics.sales)}
          hint={`${analytics.salesThisMonth} this month`}
        />
        <SellerStat
          icon={TrendingUp}
          label="Conversion"
          value={`${analytics.conversionRate.toFixed(1)}%`}
          hint="Views → orders"
        />
        <SellerStat
          icon={DollarSign}
          label="Revenue (month)"
          value={`$${seller.earnings.thisMonth.toFixed(2)}`}
          hint={`~$${aov.toFixed(0)} avg order · ${seller.earnings.orders} lifetime`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading">Conversion funnel</CardTitle>
            <CardDescription>
              How browsing turns into eco purchases.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Shop views</span>
                <span className="tabular-nums font-medium">
                  {analytics.views.toLocaleString()}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-emerald-100">
                <div className="h-full w-full rounded-full bg-primary/40" />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Orders</span>
                <span className="tabular-nums font-medium">
                  {analytics.sales}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-emerald-100">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${funnelWidth}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Tip: clear photos, eco scores, and a short story lift conversion.
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-heading">Catalog mix</CardTitle>
            <CardDescription>
              Balance goods and services for steadier months.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/70 px-4 py-3">
              <Package className="mb-2 size-4 text-primary" />
              <div className="text-2xl font-semibold tabular-nums">
                {productCount}
              </div>
              <div className="text-xs text-muted-foreground">Products</div>
            </div>
            <div className="rounded-xl border border-border/70 px-4 py-3">
              <ShoppingBag className="mb-2 size-4 text-primary" />
              <div className="text-2xl font-semibold tabular-nums">
                {serviceCount}
              </div>
              <div className="text-xs text-muted-foreground">Services</div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3">
              <TrendingUp className="mb-2 size-4 text-emerald-700" />
              <div className="text-2xl font-semibold tabular-nums text-emerald-800">
                {analytics.salesThisMonth}
              </div>
              <div className="text-xs text-emerald-700">Sales this month</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-primary/20">
        <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-emerald-50/80 to-transparent">
          <div className="flex items-center gap-2 text-primary">
            <BarChart3 className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Performance
            </span>
          </div>
          <CardTitle className="font-heading">Top listings</CardTitle>
          <CardDescription>
            Ranked by sales, then views. Bars scale to views.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          {topProducts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              List products or services to start seeing performance here.
            </p>
          ) : (
            topProducts.map((product, index) => (
              <div key={product.id} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{product.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {listingTypeLabel(product.listingType)} ·{" "}
                        {product.sales} sales · {product.views} views ·{" "}
                        {product.ecoScore}% eco
                      </div>
                    </div>
                  </div>
                  <Badge
                    className={
                      productStatusBadge(product.status ?? "pending").className
                    }
                  >
                    {productStatusBadge(product.status ?? "pending").label}
                  </Badge>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-emerald-100">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${Math.max(
                        8,
                        ((product.views || 0) / maxTopViews) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
