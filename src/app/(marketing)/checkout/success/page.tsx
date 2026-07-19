"use client";

import {
  BookOpen,
  CheckCircle2,
  Leaf,
  Package,
  PawPrint,
  Sun,
  Waves,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";
import { useMembership } from "@/contexts/membership-context";
import { recordAffiliateConversion } from "@/lib/affiliate-storage";
import {
  emptyCauseSelection,
  formatCauseUnits,
  selectionLines,
  type CauseSelection,
} from "@/lib/causes";
import { saveLastDonation } from "@/lib/impact-storage";
import {
  confirmPaidOrder,
  type ConfirmedOrderClient,
} from "@/lib/stripe/client";
import { recordSellerSales } from "@/lib/seller-analytics";
import {
  clearPendingCheckout,
  loadPendingCheckout,
} from "@/lib/stripe/pending-order";

const CAUSE_ICONS = {
  trees: Leaf,
  waves: Waves,
  paw: PawPrint,
  book: BookOpen,
  sun: Sun,
} as const;

function CheckoutSuccessInner() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const { consumeCauseCredit } = useMembership();
  const [order, setOrder] = useState<ConfirmedOrderClient | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const sessionId = searchParams.get("session_id");
      const isDemo = searchParams.get("demo") === "1";

      if (isDemo) {
        const pending = loadPendingCheckout();
        const orderNumber = `FB-DEMO-${Date.now().toString().slice(-6)}`;
        if (pending?.sellerLines?.length) {
          recordSellerSales(pending.sellerLines);
        }
        if (pending?.email) {
          void fetch("/api/email/order-confirmation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: pending.email,
              name: pending.name,
              orderNumber,
              amountTotalCents: Math.round(pending.orderTotal * 100),
              causeSelection: pending.selection,
              lineItems: [
                {
                  name: pending.productName ?? "Forest Buddies order",
                  quantity: 1,
                  amountCents: Math.round(pending.cartSubtotal * 100),
                },
              ],
            }),
          });
        }
        clearPendingCheckout();
        clearCart();
        if (!cancelled) {
          setOrder({
            orderNumber,
            kind: "marketplace_order",
            sessionId: "demo",
            amountTotalCents: Math.round((pending?.orderTotal ?? 0) * 100),
            currency: "usd",
            customerEmail: pending?.email ?? null,
            customerId: null,
            subscriptionId: null,
            customerName: pending?.name ?? null,
            shipping: { address: null, city: null, zip: null },
            causeSelection: pending?.selection ?? {},
            memberCreditCents: 0,
            lineItems: [],
            fulfilledAt: new Date().toISOString(),
            fulfilledBy: "demo",
            status: "fulfilled",
          });
          setSource("demo");
          setStatus("ok");
        }
        return;
      }

      if (!sessionId?.startsWith("cs_")) {
        if (!cancelled) {
          setError("Missing payment session. Return to checkout to try again.");
          setStatus("error");
        }
        return;
      }

      const result = await confirmPaidOrder(sessionId);
      if (cancelled) return;

      if ("error" in result) {
        setError(result.error);
        setStatus("error");
        return;
      }

      const pending = loadPendingCheckout();
      if (pending) {
        saveLastDonation(pending.selection);
        if (pending.memberCreditApplied) consumeCauseCredit();
        recordAffiliateConversion({
          orderTotal: pending.cartSubtotal,
          basePercent: pending.weightedAffiliatePercent,
          productName: pending.productName,
          productId: pending.productId,
        });
        if (pending.sellerLines?.length) {
          recordSellerSales(pending.sellerLines);
        }
        clearPendingCheckout();
      } else if (result.order.causeSelection) {
        saveLastDonation(result.order.causeSelection as CauseSelection);
      }

      clearCart();
      setOrder(result.order);
      setSource(result.source);
      setStatus("ok");
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [searchParams, clearCart, consumeCauseCredit]);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-muted-foreground">Confirming your Stripe payment…</p>
      </div>
    );
  }

  if (status === "error" || !order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center sm:py-16">
        <h1 className="font-heading text-2xl font-semibold text-primary">
          Payment not confirmed
        </h1>
        <p className="mt-3 text-muted-foreground">
          {error ?? "Something went wrong."}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button nativeButton={false} render={<Link href="/checkout" />}>
            Back to checkout
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/cart" />}
          >
            View cart
          </Button>
        </div>
      </div>
    );
  }

  const selection: CauseSelection = {
    ...emptyCauseSelection(),
    ...(order.causeSelection as Partial<CauseSelection>),
  };
  const lines = selectionLines(selection);
  const total = (order.amountTotalCents / 100).toFixed(2);

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:py-16">
      <div className="text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-emerald-100 sm:size-20">
          <CheckCircle2 className="size-8 text-emerald-800 sm:size-10" />
        </div>
        <h1 className="font-heading text-3xl font-semibold text-primary">
          Payment successful
        </h1>
        <p className="mt-3 text-muted-foreground">
          Thank you — your order is confirmed and being prepared with care.
        </p>
        <p className="mt-2 text-xs font-medium text-emerald-800">
          {order.fulfilledBy === "demo"
            ? "Demo order — no card was charged · confirmation email queued"
            : source === "store"
              ? "Confirmed by Stripe webhook · email sent"
              : "Confirmed securely with Stripe · email sent"}
        </p>
      </div>

      <div className="mt-8 space-y-3 rounded-2xl border bg-card p-5 text-left sm:p-6">
        <div className="flex items-center justify-between gap-3 text-base">
          <span className="text-muted-foreground">Order number</span>
          <span className="font-mono font-medium">{order.orderNumber}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-base">
          <span className="text-muted-foreground">Amount paid</span>
          <span className="font-semibold tabular-nums text-primary">
            ${total}
          </span>
        </div>
        {order.customerEmail && (
          <div className="flex items-center justify-between gap-3 text-base">
            <span className="text-muted-foreground">Receipt</span>
            <span className="truncate text-sm">{order.customerEmail}</span>
          </div>
        )}

        {order.lineItems.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Items
            </p>
            {order.lineItems.map((item, i) => (
              <div
                key={`${item.name}-${i}`}
                className="flex justify-between gap-3 text-sm"
              >
                <span>
                  {item.name}
                  {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                </span>
                <span className="tabular-nums">
                  ${(item.amountCents / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}

        {lines.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
              Your impact
            </p>
            {lines.map(({ cause, units, cost }) => {
              const Icon = CAUSE_ICONS[cause.icon];
              return (
                <div
                  key={cause.id}
                  className="flex items-start gap-2 text-sm text-emerald-800"
                >
                  <Icon className="mt-0.5 size-4 shrink-0" />
                  <span className="flex-1">
                    {cause.name}: {formatCauseUnits(cause, units)}
                  </span>
                  <span className="tabular-nums">+${cost.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Button
          nativeButton={false}
          render={<Link href="/marketplace" />}
          size="lg"
          className="min-h-12 w-full"
        >
          Continue shopping
        </Button>
        <Button
          nativeButton={false}
          render={<Link href="/dashboard" />}
          variant="outline"
          size="lg"
          className="min-h-12 w-full"
        >
          View impact dashboard
        </Button>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-16 text-center text-muted-foreground">
          <Package className="mx-auto mb-3 size-8 opacity-40" />
          Loading order…
        </div>
      }
    >
      <CheckoutSuccessInner />
    </Suspense>
  );
}
