"use client";

import { CalendarClock, CheckCircle2, Sparkles } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMembership } from "@/contexts/membership-context";
import {
  daysUntilPeriodEnd,
  formatMembershipDate,
} from "@/lib/membership-storage";

/**
 * Cancel / keep membership controls for Impact Members.
 * Used on the dashboard Membership section (and optionally /membership).
 */
export function MembershipCancelControls({
  compact = false,
}: {
  compact?: boolean;
}) {
  const {
    isImpactMember,
    cancelScheduled,
    periodEndsAt,
    cancelMembership,
    keepMembership,
    tier,
  } = useMembership();
  const [confirming, setConfirming] = useState(false);

  if (!isImpactMember) return null;

  const endsLabel = formatMembershipDate(periodEndsAt);
  const daysLeft = daysUntilPeriodEnd(periodEndsAt);

  if (cancelScheduled) {
    return (
      <div
        className={`rounded-xl border border-amber-200/90 bg-amber-50/70 ${
          compact ? "p-3" : "p-4"
        }`}
      >
        <div className="flex flex-wrap items-start gap-2">
          <Badge className="bg-amber-100 text-amber-950">Canceling</Badge>
          <p className={`font-medium text-amber-950 ${compact ? "text-sm" : "text-sm sm:text-base"}`}>
            Your Impact Member plan ends on {endsLabel}
          </p>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-amber-950/85">
          You keep all benefits until then
          {daysLeft > 0 ? ` (${daysLeft} day${daysLeft === 1 ? "" : "s"} left)` : ""}
          : {tier.affiliateBoost}× affiliate boost
          {tier.monthlyCauseCredit > 0
            ? `, $${tier.monthlyCauseCredit} cause credit`
            : ""}
          , and your Impact badge.
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-amber-950/90">
          {tier.perks.slice(1).map((perk) => (
            <li key={perk} className="flex gap-2">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-amber-800" />
              <span>{perk}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => void keepMembership()}
            className="gap-1.5"
          >
            <Sparkles className="size-3.5" />
            Keep Impact Member
          </Button>
        </div>
        <p className="mt-2 text-xs text-amber-900/70">
          Changed your mind? Reactivate anytime before {endsLabel}.
        </p>
      </div>
    );
  }

  if (confirming) {
    return (
      <div
        className={`rounded-xl border border-border bg-background/90 ${
          compact ? "p-3" : "p-4"
        }`}
        role="dialog"
        aria-labelledby="cancel-membership-title"
      >
        <p
          id="cancel-membership-title"
          className="flex items-center gap-2 font-medium text-primary"
        >
          <CalendarClock className="size-4 shrink-0" />
          Cancel Impact Member?
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Your membership will stay active until{" "}
          <strong className="text-foreground">{endsLabel}</strong>
          {daysLeft > 0
            ? ` (${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining)`
            : ""}
          . You won&apos;t be billed again after that.
        </p>
        <div className="mt-3 rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-3 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">
            You keep until {endsLabel}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-emerald-950/90">
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-700" />
              +25% first-party affiliate boost
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-700" />
              ${tier.monthlyCauseCredit} monthly cause credit
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-700" />
              Impact Member badge &amp; insights
            </li>
          </ul>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/5"
            onClick={() => {
              void cancelMembership().then(() => setConfirming(false));
            }}
          >
            Confirm cancel
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setConfirming(false)}
          >
            Never mind — keep plan
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {!compact && periodEndsAt && (
        <p className="text-sm text-muted-foreground">
          Current period ends{" "}
          <span className="font-medium text-foreground">{endsLabel}</span>
          {daysLeft > 0
            ? ` · ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`
            : ""}
          .
        </p>
      )}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-auto px-0 text-sm font-medium text-muted-foreground underline-offset-4 hover:bg-transparent hover:text-destructive hover:underline"
        onClick={() => setConfirming(true)}
      >
        Cancel membership / unsubscribe
      </Button>
      <p className="text-xs text-muted-foreground">
        Easy to undo. Benefits continue through the end of your billing period.
      </p>
    </div>
  );
}
