"use client";

import { ArrowLeft, Leaf, ShoppingCart, X } from "lucide-react";
import Link from "next/link";

import { MarketplaceBrandBadge } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, totalPrice } = useCart();

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
          Discover planet-positive products and start building your sustainable
          collection.
        </p>
        <Button
          nativeButton={false}
          render={<Link href="/marketplace" />}
          size="lg"
          className="mt-8 min-h-12 w-full sm:w-auto"
        >
          Browse the marketplace
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-14">
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
            {cart.length} item{cart.length > 1 ? "s" : ""} · Ready to checkout
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

      <div className="space-y-3 sm:space-y-4">
        {cart.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:p-5"
          >
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/5 sm:size-16">
              <Leaf className="size-6 text-primary sm:size-7" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-base leading-tight font-medium sm:text-lg">
                {item.name}
              </div>
              <div className="mt-0.5 text-sm text-muted-foreground">
                {item.rentalDuration ? (
                  <span className="font-medium text-emerald-700">
                    {item.rentalDuration}-day rental · {item.category}
                  </span>
                ) : (
                  `$${item.price} each · ${item.category}`
                )}
              </div>
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

              <div className="min-w-[4.5rem] text-right text-lg font-semibold tabular-nums text-primary">
                ${(item.price * item.quantity).toFixed(2)}
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

      <div className="mt-8 rounded-2xl border bg-card p-5 sm:mt-10 sm:rounded-3xl sm:p-8">
        <div className="flex items-baseline justify-between text-xl">
          <span className="font-medium text-muted-foreground">Subtotal</span>
          <span className="font-semibold tabular-nums text-primary">
            ${totalPrice.toFixed(2)}
          </span>
        </div>
        <p className="mt-1 text-base text-muted-foreground">
          Shipping and taxes calculated at checkout
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            nativeButton={false}
            render={<Link href="/checkout" />}
            size="lg"
            className="min-h-14 flex-1 text-base font-semibold"
          >
            Checkout — plant more good
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/marketplace" />}
            variant="outline"
            size="lg"
            className="min-h-12 flex-1 text-base"
          >
            Continue shopping
          </Button>
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Your cart is saved locally. Every purchase supports verified eco
          brands.
        </p>
      </div>
    </div>
  );
}
