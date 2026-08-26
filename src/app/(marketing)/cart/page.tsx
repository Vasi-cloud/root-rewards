"use client";

import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  HeartHandshake,
  Leaf,
  ShoppingCart,
  Truck,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { MarketplaceBrandBadge } from "@/components/brand/brand-mark";
import { CauseGiftPicker } from "@/components/causes/cause-gift-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";
import {
  getAmazonStoreLabel,
} from "@/lib/amazon-affiliate";
import { recordPartnerOutboundClick } from "@/lib/affiliate-storage";
import {
  emptyCauseGifts,
  giftLines,
  giftTotal,
  loadCartCauseGifts,
  saveCartCauseGifts,
  type CauseGiftAmounts,
} from "@/lib/causes";
import { formatCartMoney } from "@/lib/cart-impact";
import {
  isAffiliateProduct,
  isFirstPartyProduct,
} from "@/lib/commerce-type";
import {
  deliveryEstimateForCart,
  deliveryEstimateForProduct,
} from "@/lib/delivery-estimates";
import type { CartItem } from "@/types";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, totalItems } = useCart();
  const [gifts, setGifts] = useState<CauseGiftAmounts>(emptyCauseGifts);

  useEffect(() => {
    setGifts(loadCartCauseGifts());
  }, []);

  function updateGifts(next: CauseGiftAmounts) {
    setGifts(next);
    saveCartCauseGifts(next);
  }

  const firstParty = useMemo(
    () => cart.filter((item) => isFirstPartyProduct(item)),
    [cart]
  );
  const affiliate = useMemo(
    () => cart.filter((item) => isAffiliateProduct(item)),
    [cart]
  );

  const firstPartySubtotal = useMemo(
    () =>
      firstParty.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [firstParty]
  );
  const causeGiftTotal = giftTotal(gifts);
  const causeGiftLines = giftLines(gifts);
  const stripePayable = firstPartySubtotal + causeGiftTotal;
  const delivery = deliveryEstimateForCart(firstParty);

  function shopAmazon(item: CartItem) {
    const { url } = recordPartnerOutboundClick({
      platformId: "amazon",
      productId: item.id,
      productName: item.name,
      amazonAsin: item.amazonAsin,
      amazonAffiliateUrl: item.amazonAffiliateUrl,
      listPrice: item.price,
    });
    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (cart.length === 0 && causeGiftTotal < 1) {
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
          Add first-party products from the marketplace, or{" "}
          <Link
            href="/donate"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            fund a cause
          </Link>{" "}
          with no purchase.
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
            render={<Link href="/donate" />}
            variant="outline"
            size="lg"
            className="min-h-12 w-full sm:w-auto"
          >
            Support a cause
          </Button>
        </div>
      </div>
    );
  }

  const checkoutHref =
    firstParty.length > 0
      ? "/checkout"
      : causeGiftTotal >= 1
        ? "/donate"
        : "/marketplace";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-40 sm:px-6 sm:py-14 sm:pb-14">
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
            {totalItems} item{totalItems === 1 ? "" : "s"}
            {causeGiftTotal > 0
              ? ` · £${causeGiftTotal.toFixed(causeGiftTotal % 1 ? 2 : 0)} cause gifts`
              : ""}
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

      <div className="mb-6 rounded-xl border border-amber-200/90 bg-amber-50/80 px-3.5 py-3 text-sm text-amber-950">
        <p className="font-medium">How payment works</p>
        <p className="mt-1 text-xs leading-relaxed text-amber-900/85 sm:text-sm">
          First-party items and cause gifts check out with Stripe (£). Amazon
          affiliate lines open Shop Amazon only — they are not charged here.
          Cause gifts are partner-funded / illustrative — not a GPS pin for a
          tree.
        </p>
      </div>

      {firstParty.length > 0 && (
        <section className="mb-8 space-y-3">
          <h2 className="font-heading text-lg font-semibold text-primary">
            Checkout with Stripe
          </h2>
          {firstParty.map((item) => (
            <CartLine
              key={item.id}
              item={item}
              mode="first_party"
              onRemove={() => removeFromCart(item.id)}
              onQty={(q) => updateQuantity(item.id, q)}
            />
          ))}
          <div className="flex gap-3 rounded-2xl border border-sky-200/80 bg-sky-50/50 px-4 py-3.5 text-sm text-sky-950">
            <Truck className="mt-0.5 size-5 shrink-0 text-sky-800" />
            <div className="min-w-0">
              <p className="font-medium text-foreground">{delivery.summary}</p>
              <p className="mt-0.5 text-muted-foreground">{delivery.detail}</p>
            </div>
          </div>
        </section>
      )}

      {affiliate.length > 0 && (
        <section className="mb-8 space-y-3">
          <h2 className="font-heading text-lg font-semibold text-primary">
            Shop on Amazon
          </h2>
          <p className="text-sm text-muted-foreground">
            Tagged Associates links — not included in your Stripe total.
          </p>
          {affiliate.map((item) => (
            <CartLine
              key={item.id}
              item={item}
              mode="affiliate"
              onRemove={() => removeFromCart(item.id)}
              onShopAmazon={() => shopAmazon(item)}
            />
          ))}
        </section>
      )}

      <section className="mb-8">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-heading flex items-center gap-2 text-lg font-semibold text-primary">
              <HeartHandshake className="size-5" />
              Optional — Support a cause
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Multi-select Trees, Ocean, Animals, Education, Climate. £5 / £10 /
              £25 or custom (min £1).
            </p>
          </div>
          <Button
            nativeButton={false}
            render={<Link href="/donate" />}
            variant="ghost"
            size="sm"
            className="text-primary"
          >
            Open full donate page
          </Button>
        </div>
        <CauseGiftPicker gifts={gifts} onChange={updateGifts} />
      </section>

      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:rounded-3xl sm:p-8">
        <h2 className="font-heading text-lg font-semibold text-primary">
          Stripe summary
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex justify-between gap-3">
            <span className="text-muted-foreground">First-party products</span>
            <span className="tabular-nums font-medium">
              {formatCartMoney(firstPartySubtotal)}
            </span>
          </li>
          {causeGiftLines.map(({ cause, amount }) => (
            <li key={cause.id} className="flex justify-between gap-3">
              <span className="text-muted-foreground">
                Cause gift · {cause.name}
              </span>
              <span className="tabular-nums font-medium">
                £{amount.toFixed(amount % 1 ? 2 : 0)}
              </span>
            </li>
          ))}
          {affiliate.length > 0 && (
            <li className="flex justify-between gap-3 text-muted-foreground">
              <span>Amazon lines ({affiliate.length})</span>
              <span>Not charged here</span>
            </li>
          )}
        </ul>
        <div className="mt-4 flex items-baseline justify-between border-t border-border/60 pt-4 text-xl">
          <span className="font-medium text-muted-foreground">
            Payable with Stripe
          </span>
          <span className="font-heading text-2xl font-semibold tabular-nums text-primary">
            {formatCartMoney(stripePayable)}
          </span>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            nativeButton={false}
            render={<Link href={checkoutHref} />}
            size="lg"
            className="min-h-14 flex-1 gap-2 text-base font-semibold shadow-md"
            disabled={stripePayable < 0.5 && firstParty.length === 0}
          >
            {firstParty.length > 0
              ? "Proceed to checkout"
              : causeGiftTotal >= 1
                ? `Checkout selected (£${causeGiftTotal.toFixed(causeGiftTotal % 1 ? 2 : 0)})`
                : "Add items to continue"}
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
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-cream px-4 pt-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.06)] sm:hidden">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Stripe total</span>
          <span className="font-semibold tabular-nums text-primary">
            {formatCartMoney(stripePayable)}
          </span>
        </div>
        <Button
          nativeButton={false}
          render={<Link href={checkoutHref} />}
          size="lg"
          className="min-h-12 w-full gap-1.5 text-sm font-semibold"
          disabled={stripePayable < 0.5 && firstParty.length === 0}
        >
          {firstParty.length > 0 ? "Checkout" : "Checkout selected"}
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function CartLine({
  item,
  mode,
  onRemove,
  onQty,
  onShopAmazon,
}: {
  item: CartItem;
  mode: "first_party" | "affiliate";
  onRemove: () => void;
  onQty?: (q: number) => void;
  onShopAmazon?: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:p-5">
      <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/5 sm:size-16">
        {item.imageUrl && !item.imageUrl.startsWith("data:") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" className="size-full object-cover" />
        ) : (
          <Leaf className="size-6 text-primary sm:size-7" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-base leading-tight font-medium sm:text-lg">
            {item.name}
          </div>
          {mode === "affiliate" ? (
            <Badge className="bg-emerald-100 text-[10px] text-emerald-900">
              Amazon
            </Badge>
          ) : item.id.startsWith("kitchen-") ? (
            <Badge
              variant="secondary"
              className="bg-emerald-100 text-[10px] text-emerald-900"
            >
              Kitchen list
            </Badge>
          ) : null}
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
        {mode === "first_party" ? (
          <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-sky-900">
            <Truck className="size-3.5 shrink-0 opacity-80" />
            {deliveryEstimateForProduct(item).label}
          </p>
        ) : (
          <Button
            type="button"
            size="sm"
            className="mt-2 h-11 gap-1.5 bg-emerald-800 text-cream hover:bg-emerald-900"
            onClick={onShopAmazon}
          >
            Shop {getAmazonStoreLabel()}
            <ExternalLink className="size-3.5 opacity-80" />
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end sm:gap-6">
        {mode === "first_party" && onQty ? (
          <div className="flex items-center rounded-xl border bg-background">
            <Button
              variant="ghost"
              size="icon"
              className="size-11 rounded-l-xl"
              onClick={() => onQty(item.quantity - 1)}
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
              onClick={() => onQty(item.quantity + 1)}
              aria-label="Increase quantity"
            >
              +
            </Button>
          </div>
        ) : null}

        {mode === "first_party" ? (
          <div className="min-w-[5rem] text-right">
            <div className="text-lg font-semibold tabular-nums text-primary">
              {formatCartMoney(item.price * item.quantity)}
            </div>
          </div>
        ) : null}

        <Button
          variant="ghost"
          size="icon"
          className="size-11 text-destructive hover:bg-destructive/10"
          onClick={onRemove}
          aria-label={`Remove ${item.name}`}
        >
          <X className="size-5" />
        </Button>
      </div>
    </div>
  );
}
