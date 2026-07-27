"use client";

import {
  ArrowRight,
  BadgeCheck,
  Check,
  CreditCard,
  LayoutDashboard,
  Leaf,
  Settings,
  Sparkles,
  Trees,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { MembershipCancelControls } from "@/components/membership/membership-cancel-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useMembership } from "@/contexts/membership-context";
import { MEMBERSHIP_TIERS } from "@/lib/membership";
import {
  daysUntilPeriodEnd,
  formatMembershipDate,
} from "@/lib/membership-storage";
import { fetchPaymentsStatus } from "@/lib/stripe/client";
import { cn } from "@/lib/utils";

const UPGRADE_HIGHLIGHTS = [
  {
    title: "+25% commissions",
    detail: "Boost first-party affiliate earnings on Forest Buddies® sales.",
    icon: Sparkles,
  },
  {
    title: "$8 monthly cause credit",
    detail: "Auto-fund trees, ocean, or climate at checkout each month.",
    icon: Trees,
  },
  {
    title: "Impact Member badge",
    detail: "Show your support on your profile and affiliate presence.",
    icon: BadgeCheck,
  },
] as const;

export default function MembershipPage() {
  const { user } = useAuth();
  const {
    tier,
    isImpactMember,
    upgradeToImpact,
    causeCreditAvailable,
    cancelScheduled,
    periodEndsAt,
    keepMembership,
    manageBilling,
    stripeCustomerId,
  } = useMembership();
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    void fetchPaymentsStatus().then((s) => setStripeEnabled(s.stripeEnabled));
  }, []);

  async function handleUpgrade() {
    setBusy(true);
    setBanner(null);
    let email = user?.email ?? "";
    if (stripeEnabled && !email) {
      email =
        window.prompt("Email for your Stripe membership receipt:")?.trim() ??
        "";
      if (!email) {
        setBanner("An email is required for paid memberships.");
        setBusy(false);
        return;
      }
    }
    const result = await upgradeToImpact(email || undefined);
    if (result === "demo") {
      setBanner(
        "Demo upgrade complete — no card charged (Stripe not configured)."
      );
      setBusy(false);
    } else if (result === "error") {
      setBanner("Could not start membership checkout. Try again.");
      setBusy(false);
    }
    // stripe → redirect
  }

  async function handlePortal() {
    setBusy(true);
    const result = await manageBilling();
    if (result !== "portal") {
      setBusy(false);
      if (result === "demo") {
        setBanner(
          "Billing portal needs a Stripe customer — cancel below instead."
        );
      } else {
        setBanner("Could not open the billing portal.");
      }
    }
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sage/30 via-cream to-cream" />
      <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-emerald-800/10 font-normal text-emerald-900">
            Membership
          </Badge>
          <Badge
            variant="outline"
            className={
              stripeEnabled
                ? "border-emerald-300 text-emerald-900"
                : "text-muted-foreground"
            }
          >
            {stripeEnabled ? "Stripe-ready billing" : "Demo billing (no card)"}
          </Badge>
        </div>

        <h1 className="font-heading mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-primary sm:text-5xl">
          Free vs Impact Member
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:mt-4 sm:text-lg">
          Shop and share for free — or upgrade to earn more, fund causes
          monthly, and show your Impact badge. Cancel anytime; benefits last
          until your period ends.
        </p>

        {/* Current plan + shortcuts */}
        <div className="mt-5 rounded-2xl border border-emerald-200/90 bg-white/80 px-3.5 py-3.5 shadow-xs sm:px-5 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800/70">
                Your current plan
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-2 font-heading text-lg font-semibold text-emerald-950 sm:text-xl">
                <Leaf className="size-4 shrink-0 text-emerald-800" />
                {tier.name}
                {isImpactMember && (
                  <Badge className="bg-emerald-800 text-cream">
                    Impact Member
                  </Badge>
                )}
                {cancelScheduled && (
                  <Badge className="bg-amber-100 text-amber-950">
                    Canceling · ends {formatMembershipDate(periodEndsAt)}
                  </Badge>
                )}
              </p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {isImpactMember
                  ? cancelScheduled
                    ? `Benefits continue until ${formatMembershipDate(periodEndsAt)}.`
                    : causeCreditAvailable
                      ? "Cause credit ready this month · manage billing below."
                      : periodEndsAt
                        ? `Period renews ${formatMembershipDate(periodEndsAt)} · ${daysUntilPeriodEnd(periodEndsAt)} days left.`
                        : "You’re on Impact Member — manage or cancel below."
                  : "You’re on Free — upgrade anytime for commissions, credit, and badge."}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {!isImpactMember && (
                <Button
                  className="h-11 gap-2 bg-emerald-800 text-cream hover:bg-emerald-900 sm:h-9"
                  disabled={busy}
                  onClick={() => void handleUpgrade()}
                >
                  <Sparkles className="size-3.5" />
                  Upgrade to Impact
                </Button>
              )}
              {isImpactMember && stripeCustomerId && stripeEnabled && (
                <Button
                  variant="outline"
                  className="h-11 gap-2 sm:h-9"
                  disabled={busy}
                  onClick={() => void handlePortal()}
                >
                  <CreditCard className="size-3.5" />
                  Manage membership
                </Button>
              )}
              {isImpactMember && (
                <Button
                  variant="outline"
                  className="h-11 sm:h-9"
                  nativeButton={false}
                  render={<Link href="#manage" />}
                >
                  Manage / cancel
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="ghost"
            className="h-11 gap-1.5 px-2.5 text-emerald-950 sm:h-8"
            nativeButton={false}
            render={<Link href="/dashboard" />}
          >
            <LayoutDashboard className="size-3.5" />
            Dashboard
          </Button>
          <Button
            variant="ghost"
            className="h-11 gap-1.5 px-2.5 text-emerald-950 sm:h-8"
            nativeButton={false}
            render={<Link href="/dashboard/my-forest" />}
          >
            <Trees className="size-3.5" />
            My Forest
          </Button>
          <Button
            variant="ghost"
            className="h-11 gap-1.5 px-2.5 text-emerald-950 sm:h-8"
            nativeButton={false}
            render={<Link href="/dashboard/settings" />}
          >
            <Settings className="size-3.5" />
            Account settings
            <ArrowRight className="size-3.5 opacity-70" />
          </Button>
        </div>

        {banner && (
          <p
            className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-950"
            role="status"
          >
            {banner}
          </p>
        )}

        {/* Why upgrade */}
        <section className="mt-8 sm:mt-10">
          <h2 className="font-heading text-xl font-semibold text-primary sm:text-2xl">
            Why upgrade?
          </h2>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
            Three clear reasons Impact Members choose Forest Buddies®.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {UPGRADE_HIGHLIGHTS.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.title}
                  className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 via-cream to-white px-3.5 py-3.5 sm:px-4"
                >
                  <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-800 text-cream">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <p className="mt-2.5 font-heading text-base font-semibold text-emerald-950">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {item.detail}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        {isImpactMember && (
          <Card
            id="manage"
            className="mt-8 scroll-mt-24 border-emerald-200/80 bg-white/90"
          >
            <CardHeader className="space-y-1 px-4 pb-2 sm:px-6">
              <CardTitle className="font-heading text-lg sm:text-xl">
                Manage membership
              </CardTitle>
              <CardDescription className="text-sm">
                Update billing in Stripe when connected, or cancel here. You
                keep Impact benefits through the end of the billing period. Also
                available from your{" "}
                <Link
                  href="/dashboard#membership"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  dashboard
                </Link>
                .
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6">
              {stripeCustomerId && stripeEnabled && (
                <Button
                  variant="outline"
                  className="h-11 w-full gap-2 sm:h-9 sm:w-auto"
                  disabled={busy}
                  onClick={() => void handlePortal()}
                >
                  <CreditCard className="size-4" />
                  Open Stripe billing portal
                </Button>
              )}
              <MembershipCancelControls />
            </CardContent>
          </Card>
        )}

        {/* Plan comparison */}
        <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-6 md:grid-cols-2">
          {MEMBERSHIP_TIERS.map((t) => {
            const active = tier.id === t.id;
            return (
              <Card
                key={t.id}
                className={cn(
                  "relative overflow-hidden",
                  t.highlight
                    ? "border-emerald-700/40 bg-gradient-to-br from-emerald-50 via-cream to-sky-50/40 shadow-sm"
                    : "border-border/70 bg-card",
                  active && "ring-2 ring-emerald-700/30"
                )}
              >
                <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 sm:top-4 sm:right-4">
                  {active && (
                    <Badge className="bg-emerald-800 text-cream">
                      Current plan
                    </Badge>
                  )}
                  {t.highlight && !active && (
                    <Badge className="gap-1 bg-emerald-800/90 text-cream">
                      <Sparkles className="size-3" /> Recommended
                    </Badge>
                  )}
                </div>
                <CardHeader className="space-y-1 px-4 pt-5 sm:px-6 sm:pt-6">
                  <CardTitle className="font-heading pr-24 text-2xl">
                    {t.name}
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    {t.tagline}
                  </CardDescription>
                  <div className="pt-2">
                    <span className="font-heading text-4xl font-semibold text-primary">
                      {t.priceMonthly === 0 ? "$0" : `$${t.priceMonthly}`}
                    </span>
                    <span className="text-muted-foreground"> / month</span>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <ul className="space-y-2.5">
                    {t.perks.map((perk) => {
                      const emphasize =
                        t.highlight &&
                        /(\+25%|\$8|badge|Everything in Free)/i.test(perk);
                      return (
                        <li
                          key={perk}
                          className={cn(
                            "flex gap-2 text-sm sm:text-base",
                            emphasize && "font-medium text-emerald-950"
                          )}
                        >
                          <Check className="mt-0.5 size-4 shrink-0 text-emerald-700" />
                          <span>{perk}</span>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
                <CardFooter className="flex-col gap-2 px-4 pb-5 sm:px-6 sm:pb-6">
                  {t.id === "free" ? (
                    active ? (
                      <Button
                        className="h-12 w-full sm:h-10"
                        disabled
                        variant="outline"
                      >
                        Current plan — Free
                      </Button>
                    ) : cancelScheduled ? (
                      <div className="w-full space-y-2 text-center">
                        <Button
                          className="h-12 w-full sm:h-10"
                          disabled
                          variant="outline"
                        >
                          Switches to Free on{" "}
                          {formatMembershipDate(periodEndsAt)}
                        </Button>
                        <Button
                          className="h-11 w-full sm:h-9"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => void keepMembership()}
                        >
                          Keep Impact Member instead
                        </Button>
                      </div>
                    ) : (
                      <p className="w-full text-center text-sm text-muted-foreground">
                        To leave Impact Member, use{" "}
                        <a
                          href="#manage"
                          className="font-medium text-primary underline-offset-2 hover:underline"
                        >
                          Manage membership
                        </a>{" "}
                        — you keep benefits until period end.
                      </p>
                    )
                  ) : active ? (
                    cancelScheduled ? (
                      <Button
                        className="h-12 w-full gap-2 bg-emerald-800 text-cream hover:bg-emerald-900 sm:h-10"
                        disabled={busy}
                        onClick={() => void keepMembership()}
                      >
                        <Sparkles className="size-4" />
                        Keep Impact Member
                      </Button>
                    ) : (
                      <Button
                        className="h-12 w-full sm:h-10"
                        disabled
                        variant="outline"
                      >
                        You&apos;re an Impact Member
                        {periodEndsAt
                          ? ` · ${daysUntilPeriodEnd(periodEndsAt)}d left`
                          : ""}
                      </Button>
                    )
                  ) : (
                    <Button
                      className="h-12 w-full gap-2 bg-emerald-800 text-cream hover:bg-emerald-900 sm:h-10"
                      disabled={busy}
                      onClick={() => void handleUpgrade()}
                    >
                      <Trees className="size-4" />
                      {stripeEnabled
                        ? "Upgrade with Stripe — $9/mo"
                        : "Become Impact Member (demo)"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {stripeEnabled
            ? "Live Stripe subscriptions — cards are charged securely. Cancel anytime from Manage membership or the Stripe portal."
            : "Demo billing — no card charged until Stripe keys are added. Cancel anytime from this page or your "}
          {!stripeEnabled && (
            <>
              <Link
                href="/dashboard#membership"
                className="text-primary underline-offset-2 hover:underline"
              >
                dashboard
              </Link>
              .
            </>
          )}
        </p>
      </div>
    </div>
  );
}
