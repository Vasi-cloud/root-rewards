"use client";

import {
  BookOpen,
  Leaf,
  PawPrint,
  Sun,
  Waves,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { TrustBadges } from "@/components/trust/trust-badges";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { useI18n } from "@/contexts/i18n-context";
import { useMembership } from "@/contexts/membership-context";
import { recordAffiliateConversion } from "@/lib/affiliate-storage";
import {
  CAUSES,
  dollarsToUnits,
  emptyCauseSelection,
  formatCauseUnits,
  formatLiveImpactSummary,
  selectionCo2,
  selectionCost,
  selectionLines,
  selectionTotalUnits,
  unitsToDollars,
  type Cause,
  type CauseId,
  type CauseSelection,
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

const CAUSE_ICONS = {
  trees: Leaf,
  waves: Waves,
  paw: PawPrint,
  book: BookOpen,
  sun: Sun,
} as const;

/** 16px+ inputs prevent iOS auto-zoom on focus */
const fieldClass =
  "mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-3.5 text-base leading-normal focus:outline-none focus:ring-2 focus:ring-ring";

export default function CheckoutPage() {
  const { cart, totalPrice } = useCart();
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

  useEffect(() => {
    void fetchPaymentsStatus().then((s) => setStripeEnabled(s.stripeEnabled));
  }, []);
  const [selection, setSelection] = useState<CauseSelection>(() => {
    const initial = emptyCauseSelection();
    initial.trees = 1;
    return initial;
  });
  const [activeCauseId, setActiveCauseId] = useState<CauseId>("trees");
  const [customAmount, setCustomAmount] = useState("8");

  const activeCause = CAUSES.find((c) => c.id === activeCauseId) ?? CAUSES[0];
  const activeUnits = selection[activeCauseId] || 0;
  const causeCost = selectionCost(selection);
  const causeCo2 = selectionCo2(selection);
  const totalUnits = selectionTotalUnits(selection);
  const lines = useMemo(() => selectionLines(selection), [selection]);
  const liveImpact = useMemo(
    () => formatLiveImpactSummary(selection),
    [selection]
  );
  const memberCredit =
    isImpactMember && causeCreditAvailable && applyMemberCredit
      ? Math.min(causeCost, tier.monthlyCauseCredit)
      : 0;
  const finalTotal = Math.max(0, totalPrice + causeCost - memberCredit);

  function setCauseUnits(causeId: CauseId, units: number) {
    const next = Math.max(0, Math.floor(units) || 0);
    setSelection((prev) => ({ ...prev, [causeId]: next }));
    if (causeId === activeCauseId) {
      const dollars = unitsToDollars(
        CAUSES.find((c) => c.id === causeId) ?? activeCause,
        next
      );
      setCustomAmount(next > 0 ? String(dollars) : "");
    }
  }

  function selectCause(causeId: CauseId) {
    setActiveCauseId(causeId);
    const cause = CAUSES.find((c) => c.id === causeId) ?? activeCause;
    const units = selection[causeId] || 0;
    const dollars = unitsToDollars(cause, units);
    setCustomAmount(units > 0 ? String(dollars) : "");
  }

  function applyCustomAmount(raw: string) {
    setCustomAmount(raw);
    const dollars = parseFloat(raw);
    if (raw.trim() === "" || Number.isNaN(dollars)) {
      setSelection((prev) => ({ ...prev, [activeCauseId]: 0 }));
      return;
    }
    const units = dollarsToUnits(activeCause, Math.max(0, dollars));
    setSelection((prev) => ({ ...prev, [activeCauseId]: units }));
  }

  function addRoundUp(dollars: number) {
    const currentTotal = totalPrice + causeCost;
    const target = Math.ceil(currentTotal / dollars) * dollars;
    const extra = Math.max(0, target - currentTotal);
    const addDollars =
      extra <= 0 ? activeCause.unitPrice : Math.max(extra, activeCause.unitPrice);
    const currentDollars = unitsToDollars(activeCause, activeUnits);
    const newDollars = currentDollars + addDollars;
    const units = dollarsToUnits(activeCause, newDollars);
    const ensured =
      unitsToDollars(activeCause, units) < newDollars ? units + 1 : units;
    setCauseUnits(activeCauseId, ensured);
  }

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center sm:py-20">
        <Leaf className="mx-auto mb-4 size-10 text-primary" />
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
          Your cart is empty
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Add some sustainable products first.
        </p>
        <Button
          nativeButton={false}
          render={<Link href="/marketplace" />}
          className="mt-8 min-h-12 w-full sm:w-auto"
          size="lg"
        >
          Browse marketplace
        </Button>
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

    const rate = consumeRateLimit("checkout");
    if (!rate.allowed) {
      setFormError(rate.message);
      return;
    }

    setIsSubmitting(true);

    const weightedPercent =
      cart.length === 0
        ? 12
        : cart.reduce(
            (sum, item) =>
              sum + item.affiliateCommissionPercent * item.price * item.quantity,
            0
          ) / Math.max(totalPrice, 1);

    const email = emailResult.value;
    const name = nameResult.value;

    savePendingCheckout({
      selection,
      memberCreditApplied: memberCredit > 0,
      orderTotal: finalTotal,
      cartSubtotal: totalPrice,
      weightedAffiliatePercent: weightedPercent,
      productName: cart[0]?.name,
      productId: cart[0]?.id,
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
      causeSelection: selection,
      lineItems: cart.map((item) => ({
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
    saveLastDonation(selection);
    if (memberCredit > 0) consumeCauseCredit();
    recordAffiliateConversion({
      orderTotal: totalPrice,
      basePercent: weightedPercent,
      productName: cart[0]?.name,
      productId: cart[0]?.id,
    });

    await new Promise((resolve) => setTimeout(resolve, 600));
    // Keep pending payload for success page; clear cart there after demo confirm
    router.push("/checkout/success?demo=1");
  };

  const customDollars = parseFloat(customAmount);
  const previewUnits =
    customAmount.trim() === "" || Number.isNaN(customDollars)
      ? 0
      : dollarsToUnits(activeCause, Math.max(0, customDollars));
  const remainder =
    customAmount.trim() === "" ||
    Number.isNaN(customDollars) ||
    customDollars <= 0
      ? 0
      : Math.max(0, customDollars - previewUnits * activeCause.unitPrice);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-36 pt-6 sm:px-6 sm:pb-14 sm:pt-10 lg:pt-14">
      <div className="mb-6 flex items-center gap-3 sm:mb-8">
        <Leaf className="size-7 shrink-0 text-primary" />
        <h1 className="font-heading text-3xl font-semibold text-primary sm:text-4xl">
          {t("checkout.title")}
        </h1>
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
              {cart.map((item) => (
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
                        : `Qty ${item.quantity}`}
                    </div>
                  </div>
                  <div className="shrink-0 text-base font-semibold tabular-nums text-primary">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-between border-t pt-4 text-lg font-semibold sm:text-xl">
              <span>Subtotal</span>
              <span className="tabular-nums">${totalPrice.toFixed(2)}</span>
            </div>

            {lines.map(({ cause, units, cost }) => (
              <div
                key={cause.id}
                className="mt-2 flex justify-between gap-3 text-base text-emerald-800"
              >
                <span className="min-w-0">
                  {cause.name}: {formatCauseUnits(cause, units)}
                </span>
                <span className="shrink-0 tabular-nums">+${cost.toFixed(2)}</span>
              </div>
            ))}

            {memberCredit > 0 && (
              <div className="mt-2 flex justify-between gap-3 text-base text-emerald-900">
                <span>Impact Member cause credit</span>
                <span className="tabular-nums">−${memberCredit.toFixed(2)}</span>
              </div>
            )}

            {isImpactMember && causeCreditAvailable && causeCost > 0 && (
              <label className="mt-3 flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3.5 py-3.5 text-base text-emerald-900">
                <input
                  type="checkbox"
                  className="mt-1 size-5 shrink-0 accent-emerald-700"
                  checked={applyMemberCredit}
                  onChange={(e) => setApplyMemberCredit(e.target.checked)}
                />
                <span>
                  Apply this month&apos;s ${tier.monthlyCauseCredit} Impact
                  Member cause credit
                </span>
              </label>
            )}

            <div className="mt-3 flex justify-between border-t pt-4 text-2xl font-semibold">
              <span>Total</span>
              <span className="tabular-nums text-primary">
                ${finalTotal.toFixed(2)}
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
              Pick a cause, then enter any dollar amount. We convert it into
              real impact units for you.
            </p>

            <div className="scrollbar-none -mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1 touch-pan-x">
              {CAUSES.map((cause) => {
                const Icon = CAUSE_ICONS[cause.icon];
                const units = selection[cause.id] || 0;
                const active = activeCauseId === cause.id;
                return (
                  <button
                    key={cause.id}
                    type="button"
                    onClick={() => selectCause(cause.id)}
                    className={`inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full border px-4 py-3 text-base font-medium transition-all ${
                      active
                        ? "border-emerald-700 bg-emerald-700 text-white"
                        : "border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-100"
                    }`}
                  >
                    <Icon className="size-5" />
                    {cause.name}
                    {units > 0 && (
                      <span
                        className={`tabular-nums ${
                          active ? "opacity-90" : "text-emerald-700"
                        }`}
                      >
                        · {units}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <CausePicker
              cause={activeCause}
              units={activeUnits}
              customAmount={customAmount}
              previewUnits={previewUnits}
              remainder={remainder}
              onPreset={(n) => setCauseUnits(activeCauseId, n)}
              onCustomAmount={applyCustomAmount}
              onRoundUp={addRoundUp}
              onClear={() => {
                setCauseUnits(activeCauseId, 0);
                setCustomAmount("");
              }}
            />

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
                    Live impact
                  </p>
                  <p className="mt-1.5 font-heading text-xl font-semibold leading-snug sm:text-2xl">
                    {liveImpact}
                  </p>
                  <p className="mt-2 text-base text-emerald-800/90">
                    About {causeCo2} kg CO₂ equivalent · {totalUnits} unit
                    {totalUnits === 1 ? "" : "s"} funded
                  </p>
                </>
              ) : (
                <p className="text-base leading-relaxed">
                  Add any amount above to see your live impact — e.g. “$24
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
              <h2 className="font-heading mb-5 text-xl font-semibold sm:text-2xl">
                Shipping details
              </h2>

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
                    defaultValue="42 Forest Lane, Portland, OR"
                    className={fieldClass}
                  />
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="text-base font-medium" htmlFor="ship-city">
                      City
                    </label>
                    <input
                      id="ship-city"
                      name="city"
                      type="text"
                      required
                      maxLength={80}
                      autoComplete="address-level2"
                      defaultValue="Portland"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="text-base font-medium" htmlFor="ship-zip">
                      ZIP / postal
                    </label>
                    <input
                      id="ship-zip"
                      name="zip"
                      type="text"
                      required
                      maxLength={20}
                      autoComplete="postal-code"
                      inputMode="numeric"
                      defaultValue="97201"
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
                    we never see or store your card details.
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
                Free returns within 30 days on unused items. Check the{" "}
                <Link
                  href="/returns"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  returns policy &amp; EU/UK/US size guide
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
                    ? `Pay $${finalTotal.toFixed(2)} with Stripe`
                    : t("checkout.place")}
              </Button>
              <p className="mt-3 text-center text-sm text-muted-foreground">
                Total ${finalTotal.toFixed(2)} ·{" "}
                {stripeEnabled ? "Stripe Checkout · " : "Demo · "}
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
            ${finalTotal.toFixed(2)}
          </span>
        </div>
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
              ? `Pay $${finalTotal.toFixed(2)}`
              : t("checkout.place")}
        </Button>
      </div>
    </div>
  );
}

function CausePicker({
  cause,
  units,
  customAmount,
  previewUnits,
  remainder,
  onPreset,
  onCustomAmount,
  onRoundUp,
  onClear,
}: {
  cause: Cause;
  units: number;
  customAmount: string;
  previewUnits: number;
  remainder: number;
  onPreset: (n: number) => void;
  onCustomAmount: (raw: string) => void;
  onRoundUp: (dollars: number) => void;
  onClear: () => void;
}) {
  const Icon = CAUSE_ICONS[cause.icon];
  const presets = [1, 3, 5, 10];

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 ${cause.accentClass}`}>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <Icon className="size-5" />
        <span className="font-heading text-lg font-semibold">{cause.name}</span>
        <span className="text-sm opacity-80">
          ${cause.unitPrice} per {cause.unitSingular}
        </span>
      </div>
      <p className="mb-5 text-base leading-relaxed opacity-90">{cause.tagline}</p>

      <div className="mb-5">
        <label
          htmlFor={`custom-amount-${cause.id}`}
          className="mb-2 block text-sm font-semibold uppercase tracking-wide opacity-80"
        >
          Custom amount ($)
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-base font-medium opacity-60">
              $
            </span>
            <input
              id={`custom-amount-${cause.id}`}
              type="number"
              min={0}
              step={1}
              inputMode="decimal"
              value={customAmount}
              placeholder="e.g. 24"
              onChange={(e) => onCustomAmount(e.target.value)}
              className="w-full rounded-xl border border-current/25 bg-white py-3.5 pr-3 pl-8 text-lg font-medium tabular-nums shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
            />
          </div>
          <button
            type="button"
            onClick={onClear}
            className="min-h-12 rounded-xl border border-current/20 bg-white/80 px-4 text-base font-medium hover:bg-white sm:w-auto"
          >
            Clear
          </button>
        </div>
        <p className="mt-2.5 text-base font-medium leading-snug">
          {previewUnits > 0 ? (
            <>
              ${Number(customAmount).toFixed(Number(customAmount) % 1 ? 2 : 0)} →{" "}
              <span className="font-semibold">
                {formatCauseUnits(cause, previewUnits)}
              </span>
              {remainder > 0.009 && (
                <span className="mt-1 block text-sm font-normal opacity-75 sm:mt-0 sm:inline sm:ml-1">
                  (${remainder.toFixed(2)} shy of another {cause.unitSingular})
                </span>
              )}
            </>
          ) : customAmount.trim() !== "" && Number(customAmount) > 0 ? (
            <span className="opacity-80">
              Enter at least ${cause.unitPrice} to fund 1 {cause.unitSingular}
            </span>
          ) : (
            <span className="opacity-70">
              Type any dollar amount — we&apos;ll convert it to{" "}
              {cause.unitPlural}.
            </span>
          )}
        </p>
      </div>

      <div className="mb-2 text-sm font-semibold uppercase tracking-wide opacity-80">
        Quick picks
      </div>
      <div className="mb-4 grid grid-cols-2 gap-2">
        {presets.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onPreset(n)}
            className={`min-h-12 rounded-xl border px-3 py-2.5 text-left text-base font-medium transition-all ${
              units === n
                ? "border-current bg-emerald-800 text-white"
                : "border-current/20 bg-white/85 hover:bg-white"
            }`}
          >
            <span className="block leading-tight">
              {formatCauseUnits(cause, n)}
            </span>
            <span className="text-sm opacity-75">${n * cause.unitPrice}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => onRoundUp(5)}
          className="min-h-12 rounded-xl border border-current/20 bg-white/85 px-3 py-3 text-base font-medium hover:bg-white"
        >
          Round up +$5
        </button>
        <button
          type="button"
          onClick={() => onRoundUp(10)}
          className="min-h-12 rounded-xl border border-current/20 bg-white/85 px-3 py-3 text-base font-medium hover:bg-white"
        >
          Round up +$10
        </button>
      </div>
    </div>
  );
}
