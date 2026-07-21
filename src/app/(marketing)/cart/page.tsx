"use client";

import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Leaf,
  ShoppingCart,
  TreePine,
  Truck,
  X,
} from "lucide-react";
import Link from "next/link";

import { MarketplaceBrandBadge } from "@/components/brand/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";
import {
  buildAmazonAffiliateUrl,
  getAmazonStoreLabel,
} from "@/lib/amazon-affiliate";
import { recordPartnerOutboundClick } from "@/lib/affiliate-storage";
import {
  estimateCo2FromTrees,
  estimateTreesFromSubtotal,
  formatCartMoney,
  treeUnitPrice,
} from "@/lib/cart-impact";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems } =
    useCart();

  const treesEstimate = estimateTreesFromSubtotal(totalPrice);
  const co2Estimate = estimateCo2FromTrees(treesEstimate);

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-20">
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-primary/5">
          <ShoppingCart className="size-10 text-primary" />
        </div>
        <MarketplaceBrandBadge className="mb-3" />
        <h1 className="font-heading text-3xl font-semibold text-primary">
          Your cart is empty
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-base text-muted-foreground">
          Add eco products from the marketplace — or build a list in Leafy
          Kitchen and tap Add All to Cart.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            nativeButton={false}
            render={<Link href="/marketplace" />}
            size="lg"
            className="min-h-12 w-full sm:w-auto"
          >
            Continue shopping
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/kitchen" />}
            variant="outline"
            size="lg"
            className="min-h-12 w-full sm:w-auto"
          >
            Open Leafy Kitchen
          </Button>
        </div>
      </div>
    );
  }

  function buyOnAmazon(item: (typeof cart)[number]) {
    const { url } = recordPartnerOutboundClick({
      platformId: "amazon",
      productId: item.id,
      productName: item.name,
      amazonAsin: item.amazonAsin,
      listPrice: item.price,
    });
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-36 sm:px-6 sm:py-14 sm:pb-14">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <MarketplaceBrandBadge className="mb-2" />
          <div className="flex items-center gap-3">
            <Leaf className="size-6 shrink-0 text-primary" />
            <h1 className="font-heading text-3xl font-semibold text-primary">
              Your Cart
            </h1>
          </div>
          <p className="mt-1 text-base text-muted-foreground">
            {totalItems} item{totalItems === 1 ? "" : "s"} ·{" "}
            {formatCartMoney(totalPrice)} running total
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/marketplace" />}
          variant="outline"
          className="min-h-12 w-full gap-2 text-base sm:w-auto"
        >
          <ArrowLeft className="size-4" /> Continue shopping
        </Button>
      </div>

      {/* Trees impact — clear trust signal */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-emerald-300/80 bg-gradient-to-br from-emerald-50 via-cream to-sky-50/40 px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-cream">
            <TreePine className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="font-heading text-xl font-semibold tracking-tight text-emerald-950 sm:text-2xl">
              This order will plant {treesEstimate} tree
              {treesEstimate === 1 ? "" : "s"}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-emerald-900/85">
              Based on your {formatCartMoney(totalPrice)} subtotal (~
              {co2Estimate} kg CO₂e at ${treeUnitPrice()}/tree). Confirm Trees
              at checkout — every purchase helps plant trees.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3.5 text-sm text-muted-foreground">
        <Truck className="mt-0.5 size-5 shrink-0 text-primary" />
        <p>
          <span className="font-medium text-foreground">Partner fulfilled</span>
          {" — "}
          eco partners ship straight to your door. One simple checkout here.
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {cart.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:p-5"
          >
            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/5 sm:size-16">
              {item.imageUrl && !item.imageUrl.startsWith("data:") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <Leaf className="size-6 text-primary sm:size-7" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-base leading-tight font-medium sm:text-lg">
                  {item.name}
                </div>
                {item.id.startsWith("kitchen-") && (
                  <Badge
                    variant="secondary"
                    className="bg-emerald-100 text-[10px] text-emerald-900"
                  >
                    Kitchen list
                  </Badge>
                )}
              </div>
              <div className="mt-0.5 text-sm text-muted-foreground">
                {item.rentalDuration ? (
                  <span className="font-medium text-emerald-700">
                    {item.rentalDuration}-day rental · {item.category}
                  </span>
                ) : (
                  `${formatCartMoney(item.price)} each · ${item.category}`
                )}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-2 h-8 gap-1.5 text-xs"
                onClick={() => buyOnAmazon(item)}
                title={buildAmazonAffiliateUrl({
                  productName: item.name,
                  amazonAsin: item.amazonAsin,
                })}
              >
                Buy Online · {getAmazonStoreLabel()}
                <ExternalLink className="size-3 opacity-70" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end sm:gap-6">
              <div className="flex items-center rounded-xl border bg-background">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 rounded-l-xl"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  −
                </Button>
                <span className="w-10 text-center text-base font-medium tabular-nums">
                  {item.quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 rounded-r-xl"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  aria-label="Increase quantity"
                >
                  +
                </Button>
              </div>

              <div className="min-w-[5rem] text-right">
                <div className="text-lg font-semibold tabular-nums text-primary">
                  {formatCartMoney(item.price * item.quantity)}
                </div>
                {item.quantity > 1 && (
                  <p className="text-[11px] text-muted-foreground">
                    {item.quantity} × {formatCartMoney(item.price)}
                  </p>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="size-11 text-destructive hover:bg-destructive/10"
                onClick={() => removeFromCart(item.id)}
                aria-label={`Remove ${item.name}`}
              >
                <X className="size-5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:mt-10 sm:rounded-3xl sm:p-8">
        <div className="flex items-baseline justify-between text-xl">
          <span className="font-medium text-muted-foreground">Subtotal</span>
          <span className="font-heading text-2xl font-semibold tabular-nums text-primary">
            {formatCartMoney(totalPrice)}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Shipping calculated at checkout · Partner dropship fulfillment
        </p>

        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-3 text-sm text-emerald-950">
          <TreePine className="size-4 shrink-0 text-emerald-800" />
          <p className="font-medium">
            This order will plant {treesEstimate} tree
            {treesEstimate === 1 ? "" : "s"}
            <span className="font-normal text-emerald-900/80">
              {" "}
              (~{co2Estimate} kg CO₂e)
            </span>
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            nativeButton={false}
            render={<Link href="/checkout" />}
            size="lg"
            className="min-h-14 flex-1 gap-2 text-base font-semibold shadow-md"
          >
            Proceed to checkout
            <ArrowRight className="size-4" />
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/marketplace" />}
            variant="outline"
            size="lg"
            className="min-h-12 flex-1 gap-2 text-base"
          >
            <ArrowLeft className="size-4" />
            Continue shopping
          </Button>
        </div>

        <div className="mt-3 flex justify-center">
          <Button
            nativeButton={false}
            render={<Link href="/kitchen" />}
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
          >
            Or add more from Leafy Kitchen
          </Button>
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Every purchase helps plant trees. Prefer Amazon? Use{" "}
          <span className="font-medium text-foreground">Buy Online</span> on any
          line — affiliate links support Forest Buddies®.
        </p>
      </div>

      {/* Mobile sticky checkout bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-cream/95 px-4 pt-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur-md sm:hidden">
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {totalItems} item{totalItems === 1 ? "" : "s"}
          </span>
          <span className="font-semibold tabular-nums text-primary">
            {formatCartMoney(totalPrice)}
          </span>
        </div>
        <p className="mb-2.5 flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-900">
          <TreePine className="size-3.5" />
          This order will plant {treesEstimate} tree
          {treesEstimate === 1 ? "" : "s"}
        </p>
        <div className="flex gap-2">
          <Button
            nativeButton={false}
            render={<Link href="/marketplace" />}
            variant="outline"
            size="lg"
            className="min-h-12 flex-1 text-sm"
          >
            Continue
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/checkout" />}
            size="lg"
            className="min-h-12 flex-[1.4] gap-1.5 text-sm font-semibold"
          >
            Checkout
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
