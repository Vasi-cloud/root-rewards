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
import { buildLoginHref } from "@/lib/auth-redirect";
import { IMPACT_MEMBER_PRIMARY, MEMBERSHIP_TIERS } from "@/lib/membership";
import {
  daysUntilPeriodEnd,
  formatMembershipDate,
} from "@/lib/membership-storage";
import { fetchPaymentsStatus } from "@/lib/stripe/client";
import { cn } from "@/lib/utils";

const INCLUDED_HIGHLIGHTS = [
  {
    title: "£5 monthly cause credit",
    detail:
      "Applies at checkout toward trees and causes (partner programmes) — not product cashback or a shopping balance.",
    icon: Trees,
  },
  {
    title: "Support the platform",
    detail:
      "Your £5/mo helps run Forest Buddies — membership fees support the platform, not cashback.",
    icon: Sparkles,
  },
  {
    title: "Impact Member badge",
    detail: "Show your support on your profile. Cancel anytime.",
    icon: BadgeCheck,
  },
] as const;

export default function MembershipPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const {
    tier,
    isImpactMember,
    upgradeToImpact,
    causeCreditAvailable,
    cancelScheduled,
    periodEndsAt,
    keepMembership,
    manageBilling,
    reconcileFromStripe,
  } = useMembership();
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const signedIn = Boolean(user?.uid);
  const loginHref = buildLoginHref("/membership");
  /** Manage view for active Impact (active / trialing / past_due → isImpactMember). */
  const showManage = signedIn && isImpactMember;

  useEffect(() => {
    void fetchPaymentsStatus().then((s) => setStripeEnabled(s.stripeEnabled));
  }, []);

  // Every visit: Stripe subscription status is source of truth for this account.
  useEffect(() => {
    if (authLoading || !user?.uid || !profile) return;
    void reconcileFromStripe();
  }, [authLoading, user?.uid, user?.email, profile, reconcileFromStripe]);

  async function handleUpgrade() {
    if (!signedIn) return;
    if (isImpactMember) return;
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
    } else if (result === "already") {
      setBanner(
        "You’re already an Impact Member on this email — no new charge."
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
      setBanner(
        "Could not open the billing portal for this signed-in email. Try again after refresh."
      );
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
          {stripeEnabled ? (
            <Badge
              variant="outline"
              className="border-emerald-300 text-emerald-900"
            >
              Stripe billing
            </Badge>
          ) : null}
        </div>

        <h1 className="font-heading mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-primary sm:text-5xl">
          {showManage ? "Your Impact Member plan" : "Free vs Impact Member"}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:mt-4 sm:text-lg">
          {showManage
            ? "Cause credit, platform support, and your badge — manage billing or cancel anytime. Benefits last until your period ends."
            : `${IMPACT_MEMBER_PRIMARY} Not product cashback or a shopping balance. Cancel anytime; benefits last until your period ends.`}
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
                {!signedIn ? "Sign in to see your plan" : tier.name}
                {signedIn && isImpactMember && (
                  <Badge className="bg-emerald-800 text-cream">
                    Impact Member
                  </Badge>
                )}
                {signedIn && cancelScheduled && (
                  <Badge className="bg-amber-100 text-amber-950">
                    Canceling · ends {formatMembershipDate(periodEndsAt)}
                  </Badge>
                )}
              </p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {!signedIn
                  ? "Already an Impact Member on this email? Sign in to restore your plan — we won’t ask you to pay again."
                  : isImpactMember
                    ? cancelScheduled
                      ? `Benefits continue until ${formatMembershipDate(periodEndsAt)}.`
                      : causeCreditAvailable
                        ? "Cause credit ready this month · manage billing below."
                        : periodEndsAt
                          ? `Period renews ${formatMembershipDate(periodEndsAt)} · ${daysUntilPeriodEnd(periodEndsAt)} days left.`
                          : "You’re on Impact Member — manage or cancel below."
                    : "You’re on Free — upgrade anytime for cause credit, platform support, and badge."}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {!signedIn ? (
                <Button
                  className="h-11 gap-2 bg-emerald-800 text-cream hover:bg-emerald-900 sm:h-9"
                  nativeButton={false}
                  render={<Link href={loginHref} />}
                >
                  Sign in
                </Button>
              ) : null}
              {signedIn && !isImpactMember ? (
                <Button
                  className="h-11 gap-2 bg-emerald-800 text-cream hover:bg-emerald-900 sm:h-9"
                  disabled={busy || authLoading}
                  onClick={() => void handleUpgrade()}
                >
                  <Sparkles className="size-3.5" />
                  Upgrade to Impact
                </Button>
              ) : null}
            </div>
          </div>

          {/* Impact: one billing row — portal + cancel (no duplicate Manage buttons) */}
          {showManage ? (
            <div
              id="manage"
              className="mt-4 scroll-mt-24 space-y-3 border-t border-emerald-100 pt-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800/70">
                Billing
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
                {stripeEnabled && signedIn ? (
                  <Button
                    variant="outline"
                    className="h-11 gap-2 sm:h-9"
                    disabled={busy}
                    onClick={() => void handlePortal()}
                  >
                    <CreditCard className="size-3.5" />
                    Open Stripe billing portal
                  </Button>
                ) : null}
                <div className="min-w-0 flex-1">
                  <MembershipCancelControls />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {signedIn ? (
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
        ) : null}

        {banner && (
          <p
            className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-950"
            role="status"
          >
            {banner}
          </p>
        )}

        {/* What's included — same cards for members and signed-out explain */}
        <section className="mt-8 sm:mt-10">
          <h2 className="font-heading text-xl font-semibold text-primary sm:text-2xl">
            What’s included
          </h2>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
            Cause credit and platform support — the heart of Impact Member.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {INCLUDED_HIGHLIGHTS.map((item) => {
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

        {/* Free vs Impact comparison — prospects only (no Checkout pitch for members) */}
        {!showManage ? (
          <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-6 md:grid-cols-2">
            {MEMBERSHIP_TIERS.map((t) => {
              const active = signedIn && tier.id === t.id;
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
                        {t.priceMonthly === 0
                          ? "£0"
                          : `£${t.priceMonthly}`}
                      </span>
                      <span className="text-muted-foreground"> / month</span>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6">
                    <ul className="space-y-2.5">
                      {t.perks.map((perk) => {
                        const emphasize =
                          t.highlight &&
                          /(£5|platform|badge|Everything in Free|Cancel anytime)/i.test(
                            perk
                          );
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
                    {!signedIn ? (
                      t.id === "free" ? (
                        <p className="w-full text-center text-sm text-muted-foreground">
                          No account needed to browse. Sign in above to see a
                          saved plan.
                        </p>
                      ) : (
                        <Button
                          className="h-12 w-full gap-2 bg-emerald-800 text-cream hover:bg-emerald-900 sm:h-10"
                          nativeButton={false}
                          render={<Link href={loginHref} />}
                        >
                          Sign in to join or restore
                        </Button>
                      )
                    ) : t.id === "free" ? (
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
                          Upgrade with Impact Member for cause credit and
                          platform support.
                        </p>
                      )
                    ) : (
                      <Button
                        className="h-12 w-full gap-2 bg-emerald-800 text-cream hover:bg-emerald-900 sm:h-10"
                        disabled={busy || authLoading}
                        onClick={() => void handleUpgrade()}
                      >
                        <Trees className="size-4" />
                        {stripeEnabled
                          ? "Upgrade with Stripe — £5/mo"
                          : "Become Impact Member"}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : null}

        <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {showManage
            ? "Manage billing in the Stripe portal, or cancel above — you keep benefits until period end."
            : !signedIn
              ? "Sign in to join Impact Member or restore a plan already on your email — we won’t charge twice."
              : "Cancel anytime from this page or your dashboard. Benefits last until your period ends."}
        </p>
      </div>
    </div>
  );
}
