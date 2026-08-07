"use client";

import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  ChefHat,
  ChevronDown,
  Copy,
  Leaf,
  MapPin,
  PawPrint,
  Shield,
  ShoppingBag,
  Sparkles,
  Store,
  Sun,
  Waves,
  Wrench,
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useMembership } from "@/contexts/membership-context";
import { useSeller } from "@/contexts/seller-context";
import { ATTRIBUTION_WINDOW_LABEL, buildReferralUrl } from "@/lib/affiliate";
import {
  ensureMyAffiliateCode,
  describeEvent,
  getMyAffiliateEvents,
  getMyAffiliateStats,
} from "@/lib/affiliate-storage";
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
import { cn } from "@/lib/utils";
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
  const { seller } = useSeller();
  const [impact, setImpact] = useState<UserImpact | null>(null);
  const [impactSummary, setImpactSummary] =
    useState<PersonalImpactSummary | null>(null);
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
  const [showShareActivity, setShowShareActivity] = useState(false);

  const isAdmin = isAdminUser(user?.email);
  const isApprovedSeller = seller?.status === "approved";
  const sellerPending = seller?.status === "pending";

  useEffect(() => {
    const mine = ensureMyAffiliateCode(profile?.affiliateCode);
    setCode(mine);
    setStats(getMyAffiliateStats(mine));
    setEvents(getMyAffiliateEvents(8));
    setOrigin(window.location.origin);

    const refreshImpact = () => {
      setImpact(loadUserImpact());
      setImpactSummary(getPersonalImpactSummary());
    };
    refreshImpact();

    const refreshAffiliate = () => {
      setStats(getMyAffiliateStats(mine));
      setEvents(getMyAffiliateEvents(8));
    };
    window.addEventListener("forest-buddies-affiliate-updated", refreshAffiliate);
    const unsubImpact = subscribeUserImpact(refreshImpact);
    return () => {
      window.removeEventListener(
        "forest-buddies-affiliate-updated",
        refreshAffiliate
      );
      unsubImpact();
    };
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
  const treesLabel =
    impactSummary && impactSummary.treesEquivalent > 0
      ? impactSummary.treesEquivalent % 1 === 0
        ? String(impactSummary.treesEquivalent)
        : impactSummary.treesEquivalent.toFixed(1)
      : "0";

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
      {/* Overview */}
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
          Your plan and impact — Marketplace, Buy Local, Kitchen, Parts, and
          Ask Leafy stay available on Free. Affiliate tools unlock with Impact
          Member.
        </p>
      </section>

      {/* Plan block */}
      <Card
        id="membership"
        className="scroll-mt-20 overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50 via-cream to-sky-50/40"
      >
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
                  no commission share. Upgrade to Impact Member to unlock your
                  share link and 25% of eligible commissions as account credit
                  (after partners pay us).
                </span>
              )}
              <span className="block text-xs text-emerald-800/70">
                Membership fees support the platform. Cause and tree payments
                fund partner programmes — not cashback.
              </span>
            </CardDescription>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              nativeButton={false}
              render={<Link href="/membership" />}
              variant={isImpactMember ? "outline" : "default"}
            >
              {isImpactMember ? "Manage plan" : "Upgrade to earn"}
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
                Cancel anytime. You keep Impact benefits until the end of your
                billing period.
              </p>
            </div>
            <MembershipCancelControls />
          </CardContent>
        )}
      </Card>

      {/* Affiliate / sharing — Impact Members only */}
      {isImpactMember ? (
        <section className="space-y-4" id="sharing">
          <div>
            <h2 className="font-heading text-xl font-semibold text-primary">
              Affiliate &amp; sharing
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You earn 25% of eligible commissions we receive. Account credit
              after partners pay us — not a cash wallet.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <CreditMiniStat
              label="Pending"
              value={`£${(stats.pendingPartnerReports ?? 0).toFixed(2)}`}
              hint="Waiting on partner confirmation"
              tone="pending"
            />
            <CreditMiniStat
              label="Confirmed"
              value={`£${stats.earnings.toFixed(2)}`}
              hint="Account credit available"
              tone="confirmed"
            />
            <CreditMiniStat
              label="Lifetime"
              value={`£${(
                stats.earnings + (stats.pendingPartnerReports ?? 0)
              ).toFixed(2)}`}
              hint="Pending + confirmed"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-lg">
                Your share link
              </CardTitle>
              <CardDescription>
                Attribution for {ATTRIBUTION_WINDOW_LABEL.toLowerCase()}. 25% of
                eligible commissions we receive, as account credit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <code className="block w-full overflow-x-auto rounded-lg border border-border bg-muted px-4 py-3 text-sm">
                {shareUrl}
              </code>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => void copyLink()}
                >
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
                <Button
                  nativeButton={false}
                  render={<Link href="/affiliates" />}
                  size="sm"
                  variant="ghost"
                >
                  Affiliate tools
                </Button>
              </div>
            </CardContent>
          </Card>

          <div>
            <button
              type="button"
              onClick={() => setShowShareActivity((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted/50"
              aria-expanded={showShareActivity}
            >
              Recent activity
              <ChevronDown
                className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                  showShareActivity ? "rotate-180" : ""
                }`}
              />
            </button>
            {showShareActivity ? (
              <Card className="mt-2">
                <CardContent className="pt-4">
                  {events.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No activity yet. Zeros are fine until partners report —
                      no fake balances.
                    </p>
                  ) : (
                    <div className="divide-y text-sm">
                      {events.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                        >
                          <div>
                            <div className="font-medium">
                              {describeEvent(item)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.productName ||
                                item.productId ||
                                "Referral"}
                              {item.status === "pending"
                                ? " · awaiting partner"
                                : ""}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-xs text-muted-foreground">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </div>
                            {item.type === "conversion" ? (
                              <div
                                className={
                                  item.status === "pending"
                                    ? "font-medium text-amber-800"
                                    : item.status !== "reversed"
                                      ? "font-medium text-primary"
                                      : ""
                                }
                              >
                                {item.status === "pending" ? "~" : "+"}£
                                {(item.commission ?? 0).toFixed(2)}
                              </div>
                            ) : (
                              <div className="text-muted-foreground">—</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </section>
      ) : (
        <Card id="sharing" className="scroll-mt-20">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="font-heading text-lg">
                Affiliate &amp; sharing
              </CardTitle>
              <CardDescription>
                Impact Members unlock a share link and 25% of eligible
                commissions as account credit (after partners pay us). Not a
                cash wallet.
              </CardDescription>
            </div>
            <Button
              nativeButton={false}
              render={<Link href="/membership" />}
              size="sm"
              className="h-10 shrink-0 gap-1.5 sm:h-9"
            >
              Upgrade to earn
              <ArrowRight className="size-3.5" />
            </Button>
          </CardHeader>
        </Card>
      )}

      {/* Your impact (illustrative) */}
      <Card className="overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50 via-cream to-sky-50/50">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="font-heading flex items-center gap-2 text-emerald-900">
              <Leaf className="size-5" /> Your impact
            </CardTitle>
            <CardDescription className="text-emerald-800/80">
              Illustrative totals from causes and shopping on this device —
              partner-funded programmes, not affiliate cashback.
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
            <ImpactTile label="Trees" value={treesLabel} />
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
            <div className="text-sm text-emerald-800">cause units funded</div>
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
                        {formatCauseUnits(cause, u)}
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

      {/* Seller block — independent of membership */}
      <Card id="seller">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="font-heading flex items-center gap-2 text-lg">
              <Store className="size-5 text-primary" />
              Selling
            </CardTitle>
            <CardDescription>
              {isApprovedSeller
                ? "Your seller hub — listings and shop status."
                : sellerPending
                  ? "Your seller application is under review."
                  : "Optional — sell on Forest Buddies® anytime, on Free or Impact."}
            </CardDescription>
          </div>
          <Button
            nativeButton={false}
            render={<Link href="/seller" />}
            variant={isApprovedSeller ? "default" : "outline"}
            size="sm"
            className="h-10 shrink-0 gap-1.5 sm:h-9"
          >
            {isApprovedSeller
              ? "Open seller hub"
              : sellerPending
                ? "Check status"
                : "Become a seller"}
            <ArrowRight className="size-3.5" />
          </Button>
        </CardHeader>
      </Card>

      {/* Always-available tools */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Explore</CardTitle>
          <CardDescription>
            Available on Free — no membership required.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <ExploreLink href="/marketplace" icon={ShoppingBag} label="Marketplace" />
          <ExploreLink href="/local" icon={MapPin} label="Buy Local" />
          <ExploreLink href="/kitchen" icon={ChefHat} label="Leafy Kitchen" />
          <ExploreLink href="/parts" icon={Wrench} label="Leafy Parts" />
          <ExploreLink href="/recommend" icon={Sparkles} label="Ask Leafy" />
          <ExploreLink href="/donate" icon={Leaf} label="Support a cause" />
        </CardContent>
      </Card>

      {/* Admin — isolated */}
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

function CreditMiniStat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "pending" | "confirmed";
}) {
  return (
    <Card
      className={cn(
        tone === "confirmed" && "border-emerald-200 bg-emerald-50/40",
        tone === "pending" && "border-amber-200/80 bg-amber-50/30"
      )}
    >
      <CardHeader className="pb-3">
        <CardDescription className="text-xs leading-snug">{label}</CardDescription>
        <CardTitle className="text-xl font-semibold tabular-nums sm:text-2xl">
          {value}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardHeader>
    </Card>
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

function ExploreLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Button
      nativeButton={false}
      render={<Link href={href} />}
      className="h-11 w-full justify-start gap-2"
      variant="outline"
    >
      <Icon className="size-4" />
      {label}
    </Button>
  );
}
