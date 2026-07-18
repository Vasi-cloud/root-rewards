"use client";

import { ArrowLeft, ShoppingBag, XCircle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";

export default function CheckoutCancelPage() {
  const { totalItems } = useCart();

  return (
    <div className="mx-auto max-w-lg px-4 py-12 text-center sm:py-16">
      <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-amber-100 sm:size-20">
        <XCircle className="size-8 text-amber-800 sm:size-10" />
      </div>
      <h1 className="font-heading text-3xl font-semibold text-primary">
        Checkout canceled
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        No payment was taken. Your cart is still saved
        {totalItems > 0 ? ` (${totalItems} item${totalItems === 1 ? "" : "s"})` : ""}
        — finish whenever you&apos;re ready.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          nativeButton={false}
          render={<Link href="/checkout" />}
          size="lg"
          className="min-h-12 gap-2"
        >
          <ArrowLeft className="size-4" />
          Return to checkout
        </Button>
        <Button
          nativeButton={false}
          render={<Link href="/cart" />}
          variant="outline"
          size="lg"
          className="min-h-12 gap-2"
        >
          <ShoppingBag className="size-4" />
          View cart
        </Button>
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
            Prefer to keep browsing?{" "}
        <Link
          href="/marketplace"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          Back to marketplace
        </Link>
      </p>
    </div>
  );
}
