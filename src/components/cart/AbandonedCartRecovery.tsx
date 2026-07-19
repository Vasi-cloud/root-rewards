"use client";

import { Leaf, Mail, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";
import {
  clearAbandonedFlag,
  dismissAbandonedReminder,
  flagAbandonedCart,
  loadAbandonedCart,
  markAbandonedReminderShown,
  recordAbandonedEmail,
  shouldShowAbandonedReminder,
  type MockReminderEmail,
} from "@/lib/abandoned-cart";
import { requestAbandonedCartEmail } from "@/lib/email/client";

const HIDE_ON = [
  "/cart",
  "/checkout",
  "/checkout/confirmation",
  "/checkout/success",
  "/login",
  "/register",
];

/**
 * Abandoned-cart recovery (low intrusion):
 * - Flags only on real leave (pagehide), not brief tab switches
 * - Shows once after a real return with items still in cart
 * - Bottom nudge — no full-screen blocker
 */
export function AbandonedCartRecovery() {
  const { cart, hydrated, totalItems, totalPrice } = useCart();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<MockReminderEmail | null>(null);
  const [sentMode, setSentMode] = useState<"live" | "demo" | null>(null);
  const [preview, setPreview] = useState({
    itemCount: 0,
    totalPrice: 0,
    names: [] as string[],
  });
  const evaluatedRef = useRef(false);
  const cartRef = useRef(cart);
  cartRef.current = cart;

  const hiddenRoute = HIDE_ON.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  // Evaluate once after cart hydrates — not on every navigation / cart tweak
  useEffect(() => {
    if (!hydrated || evaluatedRef.current || hiddenRoute) return;

    const t = window.setTimeout(() => {
      const state = loadAbandonedCart();
      const items = cartRef.current;
      if (!shouldShowAbandonedReminder(items.length, state)) {
        evaluatedRef.current = true;
        return;
      }
      setPreview({
        itemCount: state.itemCount || items.reduce((s, i) => s + i.quantity, 0),
        totalPrice:
          state.totalPrice ||
          items.reduce((s, i) => s + i.price * i.quantity, 0),
        names: state.previewNames,
      });
      markAbandonedReminderShown();
      setOpen(true);
      evaluatedRef.current = true;
    }, 1200);

    return () => window.clearTimeout(t);
  }, [hydrated, hiddenRoute]);

  // Flag only when leaving the document (close / navigate away), not tab blur
  useEffect(() => {
    if (!hydrated) return;

    const onPageHide = () => {
      const items = cartRef.current;
      if (items.length > 0) flagAbandonedCart(items);
      else clearAbandonedFlag();
    };

    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [hydrated]);

  // Clear abandon state when cart is emptied (after hydrate)
  useEffect(() => {
    if (!hydrated) return;
    if (cart.length === 0) {
      clearAbandonedFlag();
      if (open) setOpen(false);
    }
  }, [cart.length, hydrated, open]);

  if (!open || !hydrated || cart.length === 0 || hiddenRoute) return null;

  function dismiss() {
    dismissAbandonedReminder();
    setOpen(false);
    setSent(null);
    setError(null);
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    const names =
      preview.names.length > 0
        ? preview.names
        : cart.slice(0, 3).map((i) => i.name);

    const result = await requestAbandonedCartEmail({
      email,
      previewNames: names,
      itemCount: preview.itemCount || totalItems,
      totalPrice: preview.totalPrice || totalPrice,
    });

    setSending(false);
    if (!result.ok) {
      setError(result.error ?? "Could not send reminder.");
      return;
    }

    const mail = recordAbandonedEmail({
      email,
      cart,
      mode: result.mode ?? "demo",
      providerId: undefined,
    });
    setSent(mail);
    setSentMode(result.mode ?? "demo");
  }

  const names =
    preview.names.length > 0
      ? preview.names
      : cart.slice(0, 3).map((i) => i.name);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center p-3 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:justify-end sm:p-0"
      role="dialog"
      aria-label="Cart reminder"
      aria-labelledby="abandoned-cart-title"
    >
      <div className="pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl border border-border bg-cream shadow-lg sm:w-[22rem]">
        <div className="flex items-start justify-between gap-2 border-b border-border/60 px-4 py-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-900">
              <ShoppingBag className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800/70">
                Still in your cart
              </p>
              <h2
                id="abandoned-cart-title"
                className="font-heading text-lg font-semibold leading-snug text-primary"
              >
                Your eco picks are waiting
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Dismiss reminder"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3 px-4 py-3.5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            You left{" "}
            <strong className="font-medium text-foreground">
              {preview.itemCount || totalItems} item
              {(preview.itemCount || totalItems) === 1 ? "" : "s"}
            </strong>{" "}
            (
            <strong className="font-medium text-foreground">
              ${(preview.totalPrice || totalPrice).toFixed(2)}
            </strong>
            ). Resume when you&apos;re ready.
          </p>

          <ul className="rounded-xl border border-border/70 bg-white/70 px-2.5 py-1 text-sm">
            {names.map((name) => (
              <li
                key={name}
                className="flex items-center gap-2 border-b border-border/50 py-1.5 last:border-0"
              >
                <Leaf className="size-3.5 shrink-0 text-primary" />
                <span className="truncate">{name}</span>
              </li>
            ))}
          </ul>

          <div className="flex gap-2">
            <Button
              className="min-h-10 flex-1"
              size="sm"
              nativeButton={false}
              render={<Link href="/checkout" />}
              onClick={dismiss}
            >
              Checkout
            </Button>
            <Button
              className="min-h-10 flex-1"
              size="sm"
              variant="outline"
              nativeButton={false}
              render={<Link href="/cart" />}
              onClick={() => setOpen(false)}
            >
              View cart
            </Button>
          </div>

          <div className="rounded-xl border border-dashed border-emerald-200/80 bg-emerald-50/40 p-2.5">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-800/80">
              <Mail className="size-3" />
              Email a reminder
            </p>
            {sent ? (
              <p className="mt-1.5 text-xs text-emerald-950">
                {sentMode === "live" ? "Sent to" : "Queued for"} {sent.to}
              </p>
            ) : (
              <form
                onSubmit={(e) => void handleEmail(e)}
                className="mt-1.5 flex gap-1.5"
              >
                <input
                  type="email"
                  required
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  inputMode="email"
                  autoComplete="email"
                  className="min-h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-2.5 text-sm"
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  disabled={sending}
                  className="min-h-9 shrink-0 px-3"
                >
                  {sending ? "…" : "Send"}
                </Button>
              </form>
            )}
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="w-full text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
