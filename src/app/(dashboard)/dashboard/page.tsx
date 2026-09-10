"use client";

import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Leaf,
  PawPrint,
  Shield,
  Sparkles,
  Store,
  Sun,
  Waves,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useMembership } from "@/contexts/membership-context";
import { useSeller } from "@/contexts/seller-context";
import { isAdminUser } from "@/lib/admin";
import { CAUSES, formatCauseUnits } from "@/lib/causes";
import {
  getPersonalImpactSummary,
  loadUserImpact,
  subscribeUserImpact,
  totalImpactCo2,
  totalImpactUnits,
  type PersonalImpactSummary,
  type UserImpact,
} from "@/lib/impact-storage";
import {
  daysUntilPeriodEnd,
  formatMembershipDate,
} from "@/lib/membership-storage";

const CAUSE_ICONS = {
  trees: Leaf,
  waves: Waves,
  paw: PawPrint,
  book: BookOpen,
  sun: Sun,
} as const;

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const {
    tier,
    isImpactMember,
    causeCreditAvailable,
    cancelScheduled,
    periodEndsAt,
  } = useMembership();
  const { seller } = useSeller();
  const [impact, setImpact] = useState<UserImpact | null>(null);
  const [impactSummary, setImpactSummary] =
    useState<PersonalImpactSummary | null>(null);

  const isAdmin = isAdminUser(user?.email);
  const isApprovedSeller = seller?.status === "approved";

  useEffect(() => {
    const refreshImpact = () => {
      setImpact(loadUserImpact());
      setImpactSummary(getPersonalImpactSummary());
    };
    refreshImpact();
    return subscribeUserImpact(refreshImpact);
  }, []);

  if (loading) {
    return <p className="text-muted-foreground">Loading your dashboard…</p>;
  }

  const displayName =
    profile?.displayName ?? user?.email?.split("@")[0] ?? "Guest";

  const units = impact ? totalImpactUnits(impact) : 0;
  const co2 = impact ? totalImpactCo2(impact) : 0;
  const causeRows = impact
    ? CAUSES.map((cause) => ({
        cause,
        units: impact.byCause[cause.id].units,
        cost: impact.byCause[cause.id].cost,
      })).filter((row) => row.units > 0)
    : [];

  const treesLabel =
    impactSummary && impactSummary.treesEquivalent > 0
      ? impactSummary.treesEquivalent % 1 === 0
        ? String(impactSummary.treesEquivalent)
        : impactSummary.treesEquivalent.toFixed(1)
      : "0";

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Overview</Badge>
          <Badge
            className={
              isImpactMember
                ? cancelScheduled
                  ? "gap-1 bg-amber-100 text-amber-950"
                  : "gap-1 bg-emerald-800 text-white"
                : "gap-1 bg-muted text-foreground"
            }
          >
            {isImpactMember && !cancelScheduled && (
              <Sparkles className="size-3" />
            )}
            {cancelScheduled ? "Impact · canceling" : tier.name}
          </Badge>
          {isApprovedSeller && (
            <Badge variant="outline" className="gap-1 border-emerald-300">
              <Store className="size-3" />
              Seller
            </Badge>
          )}
        </div>
        <h1 className="font-heading text-3xl font-semibold text-primary">
          Hello, {displayName}
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Your plan and impact. Use the logo above to return to Marketplace.
        </p>
      </section>

      <Card className="overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50 via-cream to-sky-50/40">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <CardTitle className="font-heading flex items-center gap-2 text-emerald-950">
              <Sparkles className="size-5" />
              Your plan
            </CardTitle>
            <CardDescription className="mt-1.5 space-y-1.5 text-emerald-800/85">
              {isImpactMember ? (
                <>
                  <span className="block font-medium text-emerald-950">
                    Impact Member
                    {cancelScheduled
                      ? ` · canceling · benefits until ${formatMembershipDate(periodEndsAt)}`
                      : periodEndsAt
                        ? ` · renews ${formatMembershipDate(periodEndsAt)}${
                            daysUntilPeriodEnd(periodEndsAt) > 0
                              ? ` (${daysUntilPeriodEnd(periodEndsAt)} days left)`
                              : ""
                          }`
                        : ""}
                  </span>
                  <span className="flex flex-wrap items-center gap-2">
                    <Badge className="gap-1 bg-emerald-800 text-cream">
                      <BadgeCheck className="size-3" />
                      Impact badge
                    </Badge>
                    {causeCreditAvailable && tier.monthlyCauseCredit > 0 ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-300 bg-white/80 text-emerald-950"
                      >
                        £{tier.monthlyCauseCredit} cause credit ready (toward
                        causes)
                      </Badge>
                    ) : null}
                  </span>
                </>
              ) : (
                <span className="block">
                  <span className="font-medium text-emerald-950">Free plan</span>
                  {" — "}
                  shop and fund partner programmes. Membership adds cause credit
                  and supports the platform — not product cashback.
                </span>
              )}
              <span className="block text-xs text-emerald-800/70">
                Cause gifts fund partner programmes — illustrative impact, not a
                GPS pin for a planted tree.
              </span>
            </CardDescription>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              nativeButton={false}
              render={<Link href="/membership" />}
              variant={isImpactMember ? "outline" : "default"}
            >
              {isImpactMember
                ? "Manage billing"
                : "Become an Impact Member"}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card className="overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50 via-cream to-sky-50/50">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="font-heading flex items-center gap-2 text-emerald-900">
              <Leaf className="size-5" /> Your impact
            </CardTitle>
            <CardDescription className="text-emerald-800/80">
              Illustrative totals from partner programmes on this device — not a
              planted-tree claim.
            </CardDescription>
          </div>
          <Button
            nativeButton={false}
            render={<Link href="/dashboard/impact" />}
            size="sm"
            variant="outline"
            className="h-10 shrink-0 gap-1.5 border-emerald-300 bg-white/80 text-emerald-950 hover:bg-white sm:h-8"
          >
            Full impact
            <ArrowRight className="size-3.5" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ImpactTile label="Tree units" value={treesLabel} />
            <ImpactTile
              label="CO₂ (kg)"
              value={`~${Math.round(co2 * 10) / 10}`}
            />
            <ImpactTile
              label="Purchases"
              value={String(impactSummary?.ecoPurchases ?? 0)}
            />
            <ImpactTile
              label="Cart"
              value={String(impactSummary?.cartActions ?? 0)}
            />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <div className="font-heading text-3xl font-semibold tabular-nums text-emerald-900">
              {units}
            </div>
            <div className="text-sm text-emerald-800">
              cause units funded (illustrative)
            </div>
          </div>
          {causeRows.length === 0 ? (
            <p className="mt-3 text-sm text-emerald-800/80">
              Support a cause at{" "}
              <Link
                href="/donate"
                className="font-medium underline underline-offset-2"
              >
                Donate
              </Link>{" "}
              or checkout — payments fund partner programmes.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {causeRows.map(({ cause, units: u, cost }) => {
                const Icon = CAUSE_ICONS[cause.icon];
                return (
                  <div
                    key={cause.id}
                    className="flex items-center justify-between rounded-xl border border-emerald-200/70 bg-white/60 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2 text-emerald-900">
                      <Icon className="size-4" />
                      <span className="font-medium">{cause.name}</span>
                      <span className="text-xs text-emerald-800/80">
                        ≈ {formatCauseUnits(cause, u)} (illustrative)
                      </span>
                    </div>
                    <span className="tabular-nums text-emerald-900">
                      £{cost.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {isAdmin ? (
        <Card className="border-dashed border-amber-300/80 bg-amber-50/40">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="font-heading flex items-center gap-2 text-lg text-amber-950">
                <Shield className="size-5" />
                Admin
              </CardTitle>
              <CardDescription className="text-amber-900/80">
                Site tools for allowlisted admins only — separate from your
                member dashboard.
              </CardDescription>
            </div>
            <Button
              nativeButton={false}
              render={<Link href="/admin" />}
              size="sm"
              className="h-10 shrink-0 gap-1.5 bg-amber-900 text-cream hover:bg-amber-950 sm:h-9"
            >
              Open admin
              <ArrowRight className="size-3.5" />
            </Button>
          </CardHeader>
        </Card>
      ) : null}
    </div>
  );
}

function ImpactTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-emerald-200/70 bg-white/70 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800/70">
        {label}
      </p>
      <p className="mt-0.5 font-heading text-2xl font-semibold tabular-nums text-emerald-950">
        {value}
      </p>
    </div>
  );
}
