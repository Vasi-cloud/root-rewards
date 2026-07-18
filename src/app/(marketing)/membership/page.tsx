"use client";

import { Check, Leaf, Sparkles, Trees } from "lucide-react";
import Link from "next/link";

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
import { useMembership } from "@/contexts/membership-context";
import { MEMBERSHIP_TIERS } from "@/lib/membership";
import {
  daysUntilPeriodEnd,
  formatMembershipDate,
} from "@/lib/membership-storage";

export default function MembershipPage() {
  const {
    tier,
    isImpactMember,
    upgradeToImpact,
    causeCreditAvailable,
    cancelScheduled,
    periodEndsAt,
    keepMembership,
  } = useMembership();

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sage/30 via-cream to-cream" />
      <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <Badge className="mb-3 bg-emerald-800/10 text-emerald-900">
          Membership
        </Badge>
        <h1 className="font-heading max-w-2xl text-3xl font-semibold text-primary sm:text-5xl">
          Grow with Forest Buddies
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
          Start free, or become an Impact Member to boost affiliate earnings and
          auto-fund causes every month. Cancel anytime — benefits last until
          your period ends.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-3 py-1.5 text-sm text-emerald-900">
            <Leaf className="size-4" />
            Current plan: <strong>{tier.name}</strong>
            {isImpactMember && causeCreditAvailable && (
              <span className="text-emerald-700">· cause credit ready</span>
            )}
          </div>
          {cancelScheduled && (
            <Badge className="bg-amber-100 text-amber-950">
              Canceling · ends {formatMembershipDate(periodEndsAt)}
            </Badge>
          )}
        </div>

        {isImpactMember && (
          <Card
            id="cancel"
            className="mt-8 scroll-mt-24 border-emerald-200/80 bg-white/80"
          >
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg">
                Manage your subscription
              </CardTitle>
              <CardDescription>
                Unsubscribe from Impact Member here, or from your{" "}
                <Link
                  href="/dashboard#membership"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  dashboard Membership section
                </Link>
                . You keep benefits through the end of the billing period.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MembershipCancelControls />
            </CardContent>
          </Card>
        )}

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {MEMBERSHIP_TIERS.map((t) => {
            const active = tier.id === t.id;
            return (
              <Card
                key={t.id}
                className={`relative overflow-hidden ${
                  t.highlight
                    ? "border-emerald-700/40 bg-gradient-to-br from-emerald-50 via-cream to-sky-50/40 shadow-sm"
                    : "bg-card"
                }`}
              >
                {t.highlight && (
                  <div className="absolute top-4 right-4">
                    <Badge className="gap-1 bg-emerald-800 text-white">
                      <Sparkles className="size-3" /> Popular
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="font-heading text-2xl">{t.name}</CardTitle>
                  <CardDescription className="text-base">
                    {t.tagline}
                  </CardDescription>
                  <div className="pt-2">
                    <span className="font-heading text-4xl font-semibold text-primary">
                      {t.priceMonthly === 0 ? "$0" : `$${t.priceMonthly}`}
                    </span>
                    <span className="text-muted-foreground"> / month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2.5">
                    {t.perks.map((perk) => (
                      <li key={perk} className="flex gap-2 text-sm sm:text-base">
                        <Check className="mt-0.5 size-4 shrink-0 text-emerald-700" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                  {t.id === "free" ? (
                    active ? (
                      <Button className="w-full" disabled variant="outline">
                        Current plan
                      </Button>
                    ) : cancelScheduled ? (
                      <div className="w-full space-y-2 text-center">
                        <Button className="w-full" disabled variant="outline">
                          Switches to Free on {formatMembershipDate(periodEndsAt)}
                        </Button>
                        <Button
                          className="w-full"
                          variant="ghost"
                          size="sm"
                          onClick={keepMembership}
                        >
                          Keep Impact Member instead
                        </Button>
                      </div>
                    ) : (
                      <p className="w-full text-center text-sm text-muted-foreground">
                        To leave Impact Member, use{" "}
                        <a
                          href="#cancel"
                          className="font-medium text-primary underline-offset-2 hover:underline"
                        >
                          Cancel membership
                        </a>{" "}
                        above — you keep benefits until{" "}
                        {formatMembershipDate(periodEndsAt) !== "—"
                          ? formatMembershipDate(periodEndsAt)
                          : "period end"}
                        .
                      </p>
                    )
                  ) : active ? (
                    cancelScheduled ? (
                      <Button className="w-full gap-2" onClick={keepMembership}>
                        <Sparkles className="size-4" />
                        Keep Impact Member
                      </Button>
                    ) : (
                      <Button className="w-full" disabled>
                        You&apos;re an Impact Member
                        {periodEndsAt
                          ? ` · ${daysUntilPeriodEnd(periodEndsAt)}d left in period`
                          : ""}
                      </Button>
                    )
                  ) : (
                    <Button className="w-full gap-2" onClick={upgradeToImpact}>
                      <Trees className="size-4" /> Become Impact Member
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Demo billing — no card charged. Cancel anytime from your{" "}
          <Link
            href="/dashboard#membership"
            className="text-primary underline-offset-2 hover:underline"
          >
            dashboard
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
