"use client";

import { Button } from "@/components/ui/button";
import { TrustBadges } from "@/components/trust/trust-badges";
import { CauseGiftPicker } from "@/components/causes/cause-gift-picker";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { useI18n } from "@/contexts/i18n-context";
import { useMembership } from "@/contexts/membership-context";
import {
  recordAffiliateConversion,
  recordPartnerOutboundClick,
} from "@/lib/affiliate-storage";
import { getAmazonStoreLabel } from "@/lib/amazon-affiliate";
import {
  estimateCo2FromTrees,
  estimateTreesFromSubtotal,
  formatCartMoney,
} from "@/lib/cart-impact";
import { isAffiliateProduct, isFirstPartyProduct } from "@/lib/commerce-type";
import {
  deliveryEstimateForCart,
  deliveryEstimateForProduct,
} from "@/lib/delivery-estimates";
import {
  emptyCauseGifts,
  formatGiftImpactSummary,
  giftLines,
  giftTotal,
  giftsToIllustrativeUnits,
  loadCartCauseGifts,
  saveCartCauseGifts,
  type CauseGiftAmounts,
} from "@/lib/causes";
import { saveLastDonation } from "@/lib/impact-storage";
import { consumeRateLimit } from "@/lib/rate-limit";
import {
  fetchPaymentsStatus,
  startStripeCheckout,
} from "@/lib/stripe/client";
import { savePendingCheckout } from "@/lib/stripe/pending-order";
import {
  validateAddress,
  validateEmail,
  validateName,
  validatePostalCode,
} from "@/lib/validation";
import { ExternalLink, Leaf, TreePine, Truck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

/** 16px+ inputs prevent iOS auto-zoom on focus */
const fieldClass =
  "mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-3.5 text-base leading-normal focus:outline-none focus:ring-2 focus:ring-ring";

export default function CheckoutPage() {
  const { cart } = useCart();
  const { t } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const {
    isImpactMember,
    causeCreditAvailable,
    tier,
    consumeCauseCredit,
  } = useMembership();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [applyMemberCredit, setApplyMemberCredit] = useState(true);
  const [gifts, setGifts] = useState<CauseGiftAmounts>(emptyCauseGifts);

  useEffect(() => {
    void fetchPaymentsStatus().then((s) => setStripeEnabled(s.stripeEnabled));
  }, []);

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
  const lines = useMemo(() => giftLines(gifts), [gifts]);
  const liveImpact = useMemo(() => formatGiftImpactSummary(gifts), [gifts]);
  const causeCo2 = useMemo(
    () => lines.reduce((sum, line) => sum + line.co2, 0),
    [lines]
  );
  const illustrativeUnits = useMemo(
    () => giftsToIllustrativeUnits(gifts),
    [gifts]
  );
  const totalUnits = useMemo(
    () =>
      Object.values(illustrativeUnits).reduce((sum, n) => sum + (n || 0), 0),
    [illustrativeUnits]
  );

  const memberCredit =
    isImpactMember && causeCreditAvailable && applyMemberCredit
      ? Math.min(causeGiftTotal, tier.monthlyCauseCredit)
      : 0;
  const finalTotal = Math.max(
    0,
    firstPartySubtotal + causeGiftTotal - memberCredit
  );

  const treesEstimate = estimateTreesFromSubtotal(firstPartySubtotal);
  const co2Estimate = estimateCo2FromTrees(treesEstimate);
  const delivery = deliveryEstimateForCart(firstParty);

  function shopAmazon(item: (typeof cart)[number]) {
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

  if (firstParty.length === 0 && causeGiftTotal < 1) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center sm:py-20">
        <Leaf className="mx-auto mb-4 size-10 text-primary" />
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
          Nothing to checkout here
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Add first-party products from the marketplace, or fund a cause on
          Donate. Amazon affiliate items stay in your cart for Shop Amazon only
          — they are not charged at this checkout.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            nativeButton={false}
            render={<Link href="/marketplace" />}
            className="min-h-12 w-full sm:w-auto"
            size="lg"
          >
            Browse marketplace
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/donate" />}
            variant="outline"
            className="min-h-12 w-full sm:w-auto"
            size="lg"
          >
            Support a cause
          </Button>
          {affiliate.length > 0 ? (
            <Button
              nativeButton={false}
              render={<Link href="/cart" />}
              variant="outline"
              className="min-h-12 w-full sm:w-auto"
              size="lg"
            >
              Back to cart
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const fd = new FormData(e.currentTarget);
    const nameResult = validateName(String(fd.get("name") ?? ""), {
      required: true,
      max: 120,
      label: "Full name",
    });
    if (!nameResult.ok) {
      setFormError(nameResult.error);
      return;
    }
    const emailResult = validateEmail(String(fd.get("email") ?? ""));
    if (!emailResult.ok) {
      setFormError(emailResult.error);
      return;
    }
    const addressResult = validateAddress(String(fd.get("address") ?? ""));
    if (!addressResult.ok) {
      setFormError(addressResult.error);
      return;
    }
    const cityResult = validateName(String(fd.get("city") ?? ""), {
      required: true,
      max: 80,
      label: "City",
    });
    if (!cityResult.ok) {
      setFormError(cityResult.error);
      return;
    }
    const zipResult = validatePostalCode(String(fd.get("zip") ?? ""));
    if (!zipResult.ok) {
      setFormError(zipResult.error);
      return;
    }

    if (finalTotal < 0.5) {
      setFormError(
        "Order total must be at least £0.50 after cause credit. Add items or adjust your cause gift."
      );
      return;
    }

    const rate = consumeRateLimit("checkout");
    if (!rate.allowed) {
      setFormError(rate.message);
      return;
    }

    setIsSubmitting(true);

    const weightedPercent =
      firstParty.length === 0
        ? 12
        : firstParty.reduce(
            (sum, item) =>
              sum + item.affiliateCommissionPercent * item.price * item.quantity,
            0
          ) / Math.max(firstPartySubtotal, 1);

    const email = emailResult.value;
    const name = nameResult.value;
    const causeSelection = giftsToIllustrativeUnits(gifts);

    savePendingCheckout({
      selection: causeSelection,
      memberCreditApplied: memberCredit > 0,
      orderTotal: finalTotal,
      cartSubtotal: firstPartySubtotal,
      weightedAffiliatePercent: weightedPercent,
      productName: firstParty[0]?.name,
      productId: firstParty[0]?.id,
      sellerLines: firstParty.map((item) => ({
        sellerUid: item.sellerUid,
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
        category: item.category,
      })),
      email,
      name,
      createdAt: new Date().toISOString(),
    });

    const stripeResult = await startStripeCheckout({
      email,
      name,
      address: addressResult.value,
      city: cityResult.value,
      zip: zipResult.value,
      userId: user?.uid ?? null,
      memberCreditCents: Math.round(memberCredit * 100),
      causeGifts: gifts,
      causeSelection,
      lineItems: firstParty.map((item) => ({
        id: item.id,
        name: item.name,
        unitAmountCents: Math.round(item.price * 100),
        quantity: item.quantity,
        description: item.rentalDuration
          ? `${item.rentalDuration}-day rental`
          : item.category,
      })),
    });

    if ("url" in stripeResult) {
      window.location.href = stripeResult.url;
      return;
    }

    if ("error" in stripeResult) {
      setIsSubmitting(false);
      setFormError(stripeResult.error);
      return;
    }

    // Demo fallback — no Stripe secret configured
    saveLastDonation(causeSelection, {
      source: "checkout",
      userEmail: email || null,
    });
    if (memberCredit > 0) consumeCauseCredit();
    recordAffiliateConversion({
      orderTotal: firstPartySubtotal,
      basePercent: weightedPercent,
      productName: firstParty[0]?.name,
      productId: firstParty[0]?.id,
    });

    await new Promise((resolve) => setTimeout(resolve, 600));
    // Keep pending payload for success page; clear cart there after demo confirm
    router.push("/checkout/success?demo=1");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pb-36 pt-6 sm:px-6 sm:pb-14 sm:pt-10 lg:pt-14">
      <div className="mb-5 flex items-center gap-3 sm:mb-6">
        <Leaf className="size-7 shrink-0 text-primary" />
        <div>
          <h1 className="font-heading text-3xl font-semibold text-primary sm:text-4xl">
            {t("checkout.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Simple, secure checkout · {delivery.summary}
          </p>
        </div>
      </div>

      {/* Trees pledge — illustrative / partner-funded */}
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-300/80 bg-gradient-to-r from-emerald-50 via-cream to-sky-50/50 px-4 py-3.5 text-emerald-950 sm:px-5">
        <TreePine className="mt-0.5 size-5 shrink-0 text-emerald-800" />
        <div>
          <p className="text-base font-semibold tracking-tight">
            Every purchase helps fund tree programmes
          </p>
          <p className="mt-0.5 text-sm leading-relaxed text-emerald-900/85">
            Your first-party basket (~{formatCartMoney(firstPartySubtotal)})
            could illustratively support about {treesEstimate} tree
            {treesEstimate === 1 ? "" : "s"} (~{co2Estimate} kg CO₂e) when you
            add a Trees gift below — partner-funded impact, not a GPS pin.
            Or choose another cause.
          </p>
        </div>
      </div>

      {/* Mobile: summary → impact → shipping. Desktop: two columns. */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-5 lg:gap-8">
        {/* Order summary */}
        <section className="order-1 space-y-6 lg:col-span-3 lg:order-1">
          <div className="overflow-hidden rounded-2xl border bg-card p-5 sm:rounded-3xl sm:p-6">
            <h2 className="font-heading mb-4 text-xl font-semibold sm:text-2xl">
              {t("checkout.summary")}
            </h2>

            <div className="divide-y">
              {firstParty.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 py-3.5"
                >
                  <div className="min-w-0">
                    <div className="text-base font-medium leading-snug">
                      {item.name}
                    </div>
                    <div className="mt-0.5 text-sm text-muted-foreground">
                      {item.rentalDuration
                        ? `${item.rentalDuration}-day rental`
                        : `Qty ${item.quantity} · ${formatCartMoney(item.price)} each`}
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-sky-900">
                      <Truck className="size-3.5 shrink-0 opacity-80" />
                      {deliveryEstimateForProduct(item).label}
                    </p>
                  </div>
                  <div className="shrink-0 text-base font-semibold tabular-nums text-primary">
                    {formatCartMoney(item.price * item.quantity)}
                  </div>
                </div>
              ))}

              {affiliate.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 py-3.5"
                >
                  <div className="min-w-0">
                    <div className="text-base font-medium leading-snug">
                      {item.name}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Shop Amazon only — not charged here
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      className="mt-2 h-10 gap-1.5 bg-emerald-800 text-cream hover:bg-emerald-900"
                      onClick={() => shopAmazon(item)}
                    >
                      Shop {getAmazonStoreLabel()}
                      <ExternalLink className="size-3.5 opacity-80" />
                    </Button>
                  </div>
                  <div className="shrink-0 text-sm font-medium text-muted-foreground">
                    —
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-between border-t pt-4 text-lg font-semibold sm:text-xl">
              <span>First-party subtotal</span>
              <span className="tabular-nums">
                {formatCartMoney(firstPartySubtotal)}
              </span>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/50 px-3 py-2.5 text-sm text-emerald-950">
              <TreePine className="mt-0.5 size-4 shrink-0 text-emerald-800" />
              <p>
                Illustrative tree impact from first-party items: ~{treesEstimate}{" "}
                tree{treesEstimate === 1 ? "" : "s"} if you fund Trees —
                partner-funded, not a live audit.
              </p>
            </div>

            {lines.map(({ cause, amount, units }) => (
              <div
                key={cause.id}
                className="mt-2 flex justify-between gap-3 text-base text-emerald-800"
              >
                <span className="min-w-0">
                  Cause gift · {cause.name}
                  {units > 0 ? ` (≈ ${units} illustrative)` : ""}
                </span>
                <span className="shrink-0 tabular-nums">
                  +£{amount.toFixed(amount % 1 ? 2 : 0)}
                </span>
              </div>
            ))}

            {memberCredit > 0 && (
              <div className="mt-2 flex justify-between gap-3 text-base text-emerald-900">
                <span>Impact Member cause credit</span>
                <span className="tabular-nums">−£{memberCredit.toFixed(2)}</span>
              </div>
            )}

            {isImpactMember && causeCreditAvailable && causeGiftTotal > 0 && (
              <label className="mt-3 flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3.5 py-3.5 text-base text-emerald-900">
                <input
                  type="checkbox"
                  className="mt-1 size-5 shrink-0 accent-emerald-700"
                  checked={applyMemberCredit}
                  onChange={(e) => setApplyMemberCredit(e.target.checked)}
                />
                <span>
                  Apply this month&apos;s £{tier.monthlyCauseCredit} cause
                  credit (toward causes — not product cashback)
                </span>
              </label>
            )}

            <div className="mt-3 flex justify-between border-t pt-4 text-2xl font-semibold">
              <span>Total</span>
              <span className="tabular-nums text-primary">
                {formatCartMoney(finalTotal)}
              </span>
            </div>
          </div>

          {/* Cause / impact */}
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-cream to-sky-50/40 p-5 sm:rounded-3xl sm:p-6">
            <div className="mb-2 flex items-center gap-2 text-emerald-800">
              <Leaf className="size-5 shrink-0" />
              <h3 className="font-heading text-xl font-semibold">
                Choose your impact
              </h3>
            </div>
            <p className="mb-5 text-base leading-relaxed text-emerald-800/85">
              Add one or more cause gifts (£5 / £10 / £25 or custom from £1).
              Amounts are partner-funded / illustrative — not affiliate cashback.
            </p>

            <CauseGiftPicker gifts={gifts} onChange={updateGifts} />

            <div
              className={`mt-5 rounded-2xl border px-4 py-4 transition-colors ${
                liveImpact
                  ? "border-emerald-300 bg-white/85 text-emerald-950"
                  : "border-dashed border-emerald-200 bg-white/50 text-emerald-800/70"
              }`}
              aria-live="polite"
            >
              {liveImpact ? (
                <>
                  <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                    Live impact (illustrative)
                  </p>
                  <p className="mt-1.5 font-heading text-xl font-semibold leading-snug sm:text-2xl">
                    {liveImpact}
                  </p>
                  <p className="mt-2 text-base text-emerald-800/90">
                    About {causeCo2} kg CO₂ equivalent · {totalUnits} unit
                    {totalUnits === 1 ? "" : "s"} (illustrative)
                  </p>
                </>
              ) : (
                <p className="text-base leading-relaxed">
                  Add any amount above to see illustrative impact — e.g. “£15
                  plants 3 trees”.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Shipping + payment */}
        <section className="order-2 lg:col-span-2 lg:order-2">
          <form
            id="checkout-form"
            onSubmit={handlePlaceOrder}
            className="space-y-5 sm:space-y-6"
          >
            <div className="rounded-2xl border bg-card p-5 sm:rounded-3xl sm:p-6">
              <h2 className="font-heading mb-2 text-xl font-semibold sm:text-2xl">
                Shipping details
              </h2>
              <div className="mb-5 flex gap-2.5 rounded-xl border border-sky-200/80 bg-sky-50/60 px-3.5 py-3 text-sm text-sky-950">
                <Truck className="mt-0.5 size-4 shrink-0 text-sky-800" />
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {delivery.summary}
                  </p>
                  <p className="mt-0.5 text-muted-foreground">
                    {delivery.detail} One checkout here — partners ship
                    directly to your door.
                  </p>
                </div>
              </div>

              <div className="grid gap-5">
                <div>
                  <label className="text-base font-medium" htmlFor="ship-name">
                    Full name
                  </label>
                  <input
                    id="ship-name"
                    name="name"
                    type="text"
                    required
                    maxLength={120}
                    autoComplete="name"
                    defaultValue="Alex Green"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="text-base font-medium" htmlFor="ship-email">
                    Email
                  </label>
                  <input
                    id="ship-email"
                    name="email"
                    type="email"
                    required
                    maxLength={320}
                    autoComplete="email"
                    inputMode="email"
                    defaultValue="alex@forestbuddies.app"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="text-base font-medium" htmlFor="ship-address">
                    Address
                  </label>
                  <input
                    id="ship-address"
                    name="address"
                    type="text"
                    required
                    maxLength={200}
                    autoComplete="street-address"
                    defaultValue="14 Grove Street"
                    placeholder="14 Grove Street"
                    className={fieldClass}
                  />
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="text-base font-medium" htmlFor="ship-city">
                      City / town
                    </label>
                    <input
                      id="ship-city"
                      name="city"
                      type="text"
                      required
                      maxLength={80}
                      autoComplete="address-level2"
                      defaultValue="Bristol"
                      placeholder="Bristol"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="text-base font-medium" htmlFor="ship-zip">
                      Postcode
                    </label>
                    <input
                      id="ship-zip"
                      name="zip"
                      type="text"
                      required
                      maxLength={20}
                      autoComplete="postal-code"
                      defaultValue="BS1 4DJ"
                      placeholder="BS1 4DJ"
                      className={fieldClass}
                    />
                  </div>
                </div>
              </div>
              {formError && (
                <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  {formError}
                </p>
              )}
            </div>

            <div className="rounded-2xl border bg-card p-5 sm:rounded-3xl sm:p-6">
              <h2 className="font-heading mb-3 text-xl font-semibold sm:text-2xl">
                Payment
              </h2>
              {stripeEnabled ? (
                <>
                  <p className="text-base text-muted-foreground">
                    You&apos;ll complete payment securely on Stripe Checkout —
                    we never see or store your card details. Amazon affiliate
                    lines are not charged here.
                  </p>
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3.5 text-sm text-emerald-950">
                    Powered by Stripe · PCI DSS compliant · 3D Secure when
                    required
                  </div>
                </>
              ) : (
                <>
                  <p className="text-base text-muted-foreground">
                    Demo mode — no real payment is processed. Add{" "}
                    <code className="rounded bg-muted px-1 text-xs">
                      STRIPE_SECRET_KEY
                    </code>{" "}
                    to enable live checkout.
                  </p>
                  <div className="mt-4 rounded-xl border bg-background px-4 py-3.5 text-base">
                    •••• •••• •••• 4242 · Visa · demo
                  </div>
                </>
              )}
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Return eligibility depends on the seller and item type. See the{" "}
                <Link
                  href="/returns"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  returns guidance &amp; EU/UK/US size guide
                </Link>{" "}
                before you order apparel.
              </p>
            </div>

            <TrustBadges variant="checkout" />

            {/* Desktop submit */}
            <div className="hidden sm:block">
              <Button
                type="submit"
                size="lg"
                className="min-h-12 w-full text-base"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? t("checkout.processing")
                  : stripeEnabled
                    ? `Pay ${formatCartMoney(finalTotal)} with Stripe`
                    : t("checkout.place")}
              </Button>
              <p className="mt-3 text-center text-sm font-medium text-emerald-900">
                Cause gifts fund partner programmes
              </p>
              <p className="mt-1.5 text-center text-sm text-muted-foreground">
                Total {formatCartMoney(finalTotal)} ·{" "}
                {stripeEnabled ? "Stripe Checkout · " : "Demo · "}
                Prefer {getAmazonStoreLabel()}? Use Shop{" "}
                {getAmazonStoreLabel()} above.{" "}
                <Link
                  href="/returns"
                  className="underline-offset-2 hover:underline"
                >
                  Returns &amp; sizing
                </Link>
              </p>
            </div>
          </form>
        </section>
      </div>

      {/* Mobile sticky checkout bar — full-width Place Order, safe-area padded */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-cream/95 px-4 pt-3.5 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur-md sm:hidden">
        <div className="mb-1 flex items-center justify-between text-base">
          <span className="text-muted-foreground">Total</span>
          <span className="text-lg font-semibold tabular-nums text-primary">
            {formatCartMoney(finalTotal)}
          </span>
        </div>
        <p className="mb-2.5 text-center text-xs font-medium text-emerald-900">
          Cause gifts fund partner programmes
        </p>
        <p className="mb-2.5 text-center text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            {stripeEnabled ? "Stripe secure checkout" : "Demo checkout"} ·{" "}
            <Link href="/returns" className="underline-offset-2 hover:underline">
              Returns &amp; size guide
            </Link>
          </span>
        </p>
        <Button
          type="submit"
          form="checkout-form"
          size="lg"
          className="min-h-14 w-full text-base font-semibold"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? t("checkout.processing")
            : stripeEnabled
              ? `Pay ${formatCartMoney(finalTotal)}`
              : t("checkout.place")}
        </Button>
      </div>
    </div>
  );
}
