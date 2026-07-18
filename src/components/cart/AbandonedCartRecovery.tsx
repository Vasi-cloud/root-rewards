"use client";

import { Leaf, Mail, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";
import {
  clearAbandonedFlag,
  dismissAbandonedReminder,
  flagAbandonedCart,
  loadAbandonedCart,
  sendMockAbandonedEmail,
  shouldShowAbandonedReminder,
  type MockReminderEmail,
} from "@/lib/abandoned-cart";

const HIDE_ON = ["/checkout", "/checkout/confirmation", "/login", "/register"];

/**
 * MVP abandoned-cart recovery:
 * - Flags the cart when the shopper leaves with items
 * - On the next visit, shows a reminder modal (+ optional mock email)
 */
export function AbandonedCartRecovery() {
  const { cart, totalItems, totalPrice } = useCart();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<MockReminderEmail | null>(null);
  const [preview, setPreview] = useState({
    itemCount: 0,
    totalPrice: 0,
    names: [] as string[],
  });

  // Hydrate reminder after cart loads from localStorage
  useEffect(() => {
    const t = window.setTimeout(() => {
      const state = loadAbandonedCart();
      if (shouldShowAbandonedReminder(cart.length, state)) {
        setPreview({
          itemCount: state.itemCount || totalItems,
          totalPrice: state.totalPrice || totalPrice,
          names: state.previewNames,
        });
        setOpen(true);
      }
      setReady(true);
    }, 400);
    return () => window.clearTimeout(t);
  }, [cart.length, totalItems, totalPrice]);

  // Flag abandonment when leaving / hiding the page with items in cart
  useEffect(() => {
    const mark = () => {
      if (cart.length > 0) flagAbandonedCart(cart);
      else clearAbandonedFlag();
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") mark();
    };

    window.addEventListener("pagehide", mark);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", mark);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [cart]);

  // Checkout completed (cart emptied) — clear flag
  useEffect(() => {
    if (!ready) return;
    if (cart.length === 0) clearAbandonedFlag();
  }, [cart.length, ready]);

  const hiddenRoute = HIDE_ON.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (!open || !ready || cart.length === 0 || hiddenRoute) return null;

  function dismiss() {
    dismissAbandonedReminder();
    setOpen(false);
    setSent(null);
  }

  function handleMockEmail(e: React.FormEvent) {
    e.preventDefault();
    const mail = sendMockAbandonedEmail({ email, cart });
    setSent(mail);
  }

  const names =
    preview.names.length > 0
      ? preview.names
      : cart.slice(0, 3).map((i) => i.name);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-forest/40 p-0 backdrop-blur-[3px] sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="abandoned-cart-title"
    >
      <div className="w-full max-w-md overflow-hidden rounded-t-3xl border border-border bg-cream shadow-xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-900">
              <ShoppingBag className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/70">
                Cart reminder
              </p>
              <h2
                id="abandoned-cart-title"
                className="font-heading text-xl font-semibold text-primary"
              >
                Still thinking it over?
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Dismiss reminder"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            You left{" "}
            <strong className="text-foreground">
              {preview.itemCount || totalItems} item
              {(preview.itemCount || totalItems) === 1 ? "" : "s"}
            </strong>{" "}
            (
            <strong className="text-foreground">
              ${(preview.totalPrice || totalPrice).toFixed(2)}
            </strong>
            ) in your cart. Your eco picks are still waiting.
          </p>

          <ul className="rounded-xl border border-border/70 bg-white/70 px-3 py-2 text-sm">
            {names.map((name) => (
              <li
                key={name}
                className="flex items-center gap-2 border-b border-border/50 py-2 last:border-0"
              >
                <Leaf className="size-3.5 shrink-0 text-primary" />
                <span className="truncate">{name}</span>
              </li>
            ))}
            {cart.length > names.length && (
              <li className="py-2 text-xs text-muted-foreground">
                +{cart.length - names.length} more
              </li>
            )}
          </ul>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="min-h-12 flex-1 text-base"
              size="lg"
              nativeButton={false}
              render={<Link href="/checkout" />}
              onClick={() => {
                dismissAbandonedReminder();
                setOpen(false);
              }}
            >
              Resume checkout
            </Button>
            <Button
              className="min-h-12 flex-1 text-base"
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="/cart" />}
              onClick={() => setOpen(false)}
            >
              View cart
            </Button>
          </div>

          <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-800/80">
              <Mail className="size-3.5" />
              Email reminder (demo)
            </p>
            {sent ? (
              <div className="mt-2 space-y-1 text-sm text-emerald-950">
                <p className="font-medium">Mock email queued</p>
                <p className="text-xs text-emerald-800/90">
                  To: {sent.to}
                </p>
                <p className="text-xs text-emerald-800/90">
                  Subject: {sent.subject}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {sent.preview}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  No real email was sent — MVP simulation only.
                </p>
              </div>
            ) : (
              <form onSubmit={handleMockEmail} className="mt-2 flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  inputMode="email"
                  autoComplete="email"
                  className="min-h-11 min-w-0 flex-1 rounded-xl border border-input bg-background px-3.5 py-2.5 text-base"
                />
                <Button
                  type="submit"
                  variant="outline"
                  className="min-h-11 shrink-0 px-4 text-base"
                >
                  Send
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
