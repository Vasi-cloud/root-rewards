"use client";

import {
  ArrowRight,
  BookOpen,
  Copy,
  DollarSign,
  Leaf,
  MousePointerClick,
  PawPrint,
  ShoppingCart,
  Sparkles,
  Sun,
  Target,
  Users,
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
import { MembershipCancelControls } from "@/components/membership/membership-cancel-controls";
import { useAuth } from "@/contexts/auth-context";
import { useMembership } from "@/contexts/membership-context";
import { ATTRIBUTION_WINDOW_LABEL, buildReferralUrl } from "@/lib/affiliate";
import {
  ensureMyAffiliateCode,
  describeEvent,
  getMyAffiliateEvents,
  getMyAffiliateStats,
} from "@/lib/affiliate-storage";
import { CAUSES, formatCauseUnits } from "@/lib/causes";
import {
  loadUserImpact,
  totalImpactCo2,
  totalImpactUnits,
  type UserImpact,
} from "@/lib/impact-storage";
import {
  daysUntilPeriodEnd,
  formatMembershipDate,
} from "@/lib/membership-storage";
import type { AffiliateEvent, AffiliateStats } from "@/types";

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
  const [impact, setImpact] = useState<UserImpact | null>(null);
  const [stats, setStats] = useState<AffiliateStats>({
    clicks: 0,
    conversions: 0,
    earnings: 0,
    pendingPayout: 0,
  });
  const [events, setEvents] = useState<AffiliateEvent[]>([]);
  const [code, setCode] = useState("YOUR_CODE");
  const [origin, setOrigin] = useState("https://forestbuddies.app");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setImpact(loadUserImpact());
    const mine = ensureMyAffiliateCode(profile?.affiliateCode);
    setCode(mine);
    setStats(getMyAffiliateStats(mine));
    setEvents(getMyAffiliateEvents(8));
    setOrigin(window.location.origin);

    const refresh = () => {
      setStats(getMyAffiliateStats(mine));
      setEvents(getMyAffiliateEvents(8));
    };
    window.addEventListener("forest-buddies-affiliate-updated", refresh);
    return () =>
      window.removeEventListener("forest-buddies-affiliate-updated", refresh);
  }, [profile?.affiliateCode]);

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

  const shareUrl = buildReferralUrl({ origin, code, path: "/marketplace" });

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Dashboard</Badge>
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
        </div>
        <h1 className="font-heading text-3xl font-semibold text-primary">
          Hello, {displayName}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {user
            ? "Track membership, causes, and live affiliate performance."
            : "Sign in to sync your profile. Affiliate tracking works locally in this browser."}
        </p>
      </div>

      <Card
        id="membership"
        className="overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50 via-cream to-sky-50/40 scroll-mt-20"
      >
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <CardTitle className="font-heading flex items-center gap-2 text-emerald-950">
              <Sparkles className="size-5" /> Membership
            </CardTitle>
            <CardDescription className="text-emerald-800/80">
              {cancelScheduled
                ? `Canceling — benefits continue until ${formatMembershipDate(periodEndsAt)}${
                    daysUntilPeriodEnd(periodEndsAt) > 0
                      ? ` (${daysUntilPeriodEnd(periodEndsAt)} days left)`
                      : ""
                  }.`
                : isImpactMember
                  ? `Impact Member · ${tier.affiliateBoost}× affiliate boost${
                      causeCreditAvailable
                        ? " · monthly cause credit available"
                        : ""
                    }${
                      periodEndsAt
                        ? ` · renews ${formatMembershipDate(periodEndsAt)}`
                        : ""
                    }`
                  : "Upgrade to Impact Member for +25% commissions and a monthly cause credit."}
            </CardDescription>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              nativeButton={false}
              render={<Link href="/membership" />}
              variant={isImpactMember ? "outline" : "default"}
            >
              {isImpactMember ? "View plans" : "Become Impact Member"}
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/dashboard/settings" />}
              variant="ghost"
              size="sm"
              className="text-emerald-900/80"
            >
              Account settings
            </Button>
          </div>
        </CardHeader>
        {isImpactMember && (
          <CardContent className="space-y-4 border-t border-emerald-200/60 pt-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900/70">
                Manage subscription
              </p>
              <p className="mt-1 text-sm text-emerald-900/80">
                Unsubscribe anytime. If you cancel, you keep Impact benefits
                until the end of your billing period.
              </p>
            </div>
            <MembershipCancelControls />
          </CardContent>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={MousePointerClick}
          label="Link clicks"
          value={stats.clicks.toLocaleString()}
        />
        <StatCard
          icon={ShoppingCart}
          label="Conversions"
          value={stats.conversions.toString()}
        />
        <StatCard
          icon={DollarSign}
          label="Total earnings"
          value={`$${stats.earnings.toFixed(2)}`}
          highlight
        />
        <StatCard
          icon={Users}
          label="Pending payout"
          value={`$${stats.pendingPayout.toFixed(2)}`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading">Your affiliate link</CardTitle>
            <CardDescription>
              Share this URL — clicks and checkouts attribute for{" "}
              {ATTRIBUTION_WINDOW_LABEL.toLowerCase()}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <code className="block w-full overflow-x-auto rounded-lg border border-border bg-muted px-4 py-3 text-sm">
              {shareUrl}
            </code>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" className="gap-2" onClick={copyLink}>
                <Copy className="size-4" />
                {copied ? "Copied" : "Copy link"}
              </Button>
              <Button
                nativeButton={false}
                render={<Link href="/marketplace" />}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                Browse products to share <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              nativeButton={false}
              render={<Link href="/marketplace" />}
              className="w-full justify-start gap-2"
              variant="outline"
            >
              <ShoppingCart className="size-4" /> Shop sustainable products
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/checkout" />}
              className="w-full justify-start gap-2"
              variant="outline"
            >
              <Leaf className="size-4" /> Support a cause at checkout
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/affiliates" />}
              className="w-full justify-start gap-2"
              variant="outline"
            >
              <Target className="size-4" /> Affiliate tracking
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/shop/green-grove" />}
              className="w-full justify-start gap-2"
              variant="outline"
            >
              <Leaf className="size-4" /> Visit a seller shop
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50 via-cream to-sky-50/50">
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2 text-emerald-900">
              <Leaf className="size-5" /> Your cause impact
            </CardTitle>
            <CardDescription className="text-emerald-800/80">
              From checkout donations across Trees, Ocean, Animals, and more.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="font-heading text-5xl font-semibold tabular-nums text-emerald-900">
                {units}
              </div>
              <div className="text-emerald-800">impact units</div>
            </div>
            <div className="mt-2 text-sm text-emerald-800">
              ~{co2} kg CO₂ equivalent funded
            </div>

            {causeRows.length === 0 ? (
              <p className="mt-4 text-sm text-emerald-800/80">
                Make your next checkout count — pick a cause and watch this
                grow.
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
                          {formatCauseUnits(cause, u)}
                        </span>
                      </div>
                      <span className="tabular-nums text-emerald-900">
                        ${cost.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Recent affiliate activity</CardTitle>
            <CardDescription>
              Live events from your referral ledger.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Share your link to start tracking clicks and conversions.
              </p>
            ) : (
              <div className="divide-y text-sm">
                {events.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div>
                      <div className="font-medium">{describeEvent(item)}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.productName || item.productId || "Referral"}
                        {item.status === "pending" ? " · awaiting partner" : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                      <div
                        className={
                          item.type === "conversion" && item.status !== "reversed"
                            ? item.status === "pending"
                              ? "font-medium text-amber-800"
                              : "font-medium text-primary"
                            : ""
                        }
                      >
                        {item.type === "conversion"
                          ? `${item.status === "pending" ? "~" : "+"}$${(
                              item.commission ?? 0
                            ).toFixed(2)}`
                          : "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-gold/50 bg-gold/5" : undefined}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription>{label}</CardDescription>
          <Icon className="size-4 text-primary" />
        </div>
        <CardTitle className="text-2xl font-semibold tabular-nums">
          {value}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
