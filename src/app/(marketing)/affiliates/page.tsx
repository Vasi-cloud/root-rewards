"use client";

import {
  BarChart3,
  Copy,
  ExternalLink,
  Gift,
  Link2,
  MousePointerClick,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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
import { ATTRIBUTION_WINDOW_LABEL, buildReferralUrl } from "@/lib/affiliate";
import {
  AFFILIATE_PLATFORMS,
  attributionWindowLabel,
} from "@/lib/affiliate-platforms";
import {
  confirmPendingPartnerReports,
  describeEvent,
  ensureMyAffiliateCode,
  getMyAffiliateEvents,
  getMyAffiliateStats,
  getStatsByPlatform,
} from "@/lib/affiliate-storage";
import { affiliateRateWithMembership } from "@/lib/membership";
import type {
  AffiliateEvent,
  AffiliatePlatformId,
  AffiliateStats,
} from "@/types";

const steps = [
  {
    icon: Link2,
    title: "Share first-party or partner links",
    description:
      "Use your Forest Buddies ?ref= URL, or outbound Amazon / Target / REI tags from the marketplace.",
  },
  {
    icon: MousePointerClick,
    title: "Track by platform",
    description: `${ATTRIBUTION_WINDOW_LABEL} — Amazon is often ~24 hours; other networks vary.`,
  },
  {
    icon: Wallet,
    title: "Confirm when partners report",
    description:
      "External sales stay pending until the platform posts them. First-party checkout confirms instantly.",
  },
];

export default function AffiliatesPage() {
  const { profile } = useAuth();
  const { tier, isImpactMember } = useMembership();
  const [code, setCode] = useState("…");
  const [stats, setStats] = useState<AffiliateStats>({
    clicks: 0,
    conversions: 0,
    earnings: 0,
    pendingPayout: 0,
    pendingPartnerReports: 0,
  });
  const [byPlatform, setByPlatform] = useState<
    Partial<Record<AffiliatePlatformId, AffiliateStats>>
  >({});
  const [events, setEvents] = useState<AffiliateEvent[]>([]);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("https://forestbuddies.app");
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const mine = ensureMyAffiliateCode(profile?.affiliateCode);
    setCode(mine);
    setStats(getMyAffiliateStats(mine));
    setByPlatform(getStatsByPlatform(mine));
    setEvents(getMyAffiliateEvents(14));
  }, [profile?.affiliateCode]);

  useEffect(() => {
    refresh();
    setOrigin(window.location.origin);
    const onUpdate = () => refresh();
    window.addEventListener("forest-buddies-affiliate-updated", onUpdate);
    return () =>
      window.removeEventListener("forest-buddies-affiliate-updated", onUpdate);
  }, [refresh]);

  const shareUrl = buildReferralUrl({ origin, code, path: "/marketplace" });
  const sampleRate = affiliateRateWithMembership(12, tier.id);
  const pendingExternal = stats.pendingPartnerReports ?? 0;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  function handleConfirmReports() {
    const n = confirmPendingPartnerReports();
    setConfirmMsg(
      n > 0
        ? `Confirmed ${n} partner report${n === 1 ? "" : "s"} (demo of delayed Amazon-style posting).`
        : "No pending partner reports right now. Open a Via Amazon link from the marketplace first."
    );
    refresh();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Badge className="mb-3 bg-gold/20 text-primary">Affiliate program</Badge>
      <h1 className="font-heading text-3xl font-semibold text-primary sm:text-4xl">
        Earn while you advocate for the planet
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        First-party Forest Buddies links plus external partners (Amazon,
        Target, REI). Attribution lasts {ATTRIBUTION_WINDOW_LABEL.toLowerCase()}
        . Impact Members boost first-party rates only
        {isImpactMember ? " (active)" : ""}.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Clicks / outbounds" value={stats.clicks.toLocaleString()} />
        <Stat label="Confirmed conversions" value={String(stats.conversions)} />
        <Stat
          label="Confirmed earnings"
          value={`$${stats.earnings.toFixed(2)}`}
          highlight
        />
        <Stat
          label="Pending partner reports"
          value={`$${pendingExternal.toFixed(2)}`}
        />
      </div>

      <Card className="mt-8 border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-cream to-cream">
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <Link2 className="size-5 text-primary" /> Your Forest Buddies link
          </CardTitle>
          <CardDescription>
            Code <strong className="text-foreground">{code}</strong> · sample
            first-party rate on a 12% product: <strong>{sampleRate}%</strong>
            {isImpactMember ? " with Impact boost" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <code className="block w-full overflow-x-auto rounded-xl border bg-white px-4 py-3 text-sm">
            {shareUrl}
          </code>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button className="gap-2" onClick={copyLink}>
              <Copy className="size-4" />
              {copied ? "Copied" : "Copy link"}
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/marketplace" />}
              className="gap-2"
            >
              <ExternalLink className="size-4" />
              Marketplace partner links
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/membership" />}
            >
              {isImpactMember ? "Membership perks" : "Boost with Impact Member"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="mt-12">
        <h2 className="font-heading text-2xl font-semibold text-primary">
          Partner platforms
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Windows and rates mirror common public program norms. External sales
          are cookie- or network-reported — not instant like our checkout.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {AFFILIATE_PLATFORMS.map((platform) => {
            const row = byPlatform[platform.id];
            return (
              <Card
                key={platform.id}
                className={
                  platform.kind === "first_party"
                    ? "border-emerald-200 bg-emerald-50/40"
                    : undefined
                }
              >
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="font-heading text-lg">
                      {platform.name}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {platform.kind === "first_party" ? "First-party" : "External"}
                    </Badge>
                  </div>
                  <CardDescription>
                    {attributionWindowLabel(platform)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">{platform.trackingNote}</p>
                  <p className="text-muted-foreground">{platform.commissionNote}</p>
                  <p className="text-xs text-muted-foreground">
                    {platform.payoutNote}
                  </p>
                  <div className="flex flex-wrap gap-3 border-t pt-3 text-xs">
                    <span>
                      Clicks:{" "}
                      <strong className="tabular-nums">
                        {row?.clicks ?? 0}
                      </strong>
                    </span>
                    <span>
                      Confirmed:{" "}
                      <strong className="tabular-nums">
                        {row?.conversions ?? 0}
                      </strong>
                    </span>
                    <span>
                      Earned:{" "}
                      <strong className="tabular-nums">
                        ${(row?.earnings ?? 0).toFixed(2)}
                      </strong>
                    </span>
                    {(row?.pendingPartnerReports ?? 0) > 0 && (
                      <span className="text-amber-800">
                        Pending: $
                        {(row?.pendingPartnerReports ?? 0).toFixed(2)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {steps.map((step, index) => (
          <Card key={step.title}>
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {index + 1}
              </div>
              <step.icon className="size-6 text-primary" />
              <CardTitle className="font-heading">{step.title}</CardTitle>
              <CardDescription>{step.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="mt-10">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="font-heading flex items-center gap-2">
              <BarChart3 className="size-5" /> Tracking activity
            </CardTitle>
            <CardDescription>
              First-party clicks, outbound partner tags, and delayed reports.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleConfirmReports}>
            Confirm pending reports (demo)
          </Button>
        </CardHeader>
        <CardContent>
          {confirmMsg && (
            <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-900">
              {confirmMsg}
            </p>
          )}
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No events yet. Share your link or tap{" "}
              <strong>Via Amazon</strong> on a marketplace product to log an
              outbound click.
            </p>
          ) : (
            <div className="divide-y text-sm">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="font-medium">{describeEvent(ev)}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {ev.productName || ev.productId || ev.destination || "—"}
                      {ev.status === "pending" ? " · awaiting partner" : ""}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono text-xs text-muted-foreground">
                      {new Date(ev.createdAt).toLocaleDateString()}
                    </div>
                    <div
                      className={
                        ev.type === "conversion" && ev.status !== "reversed"
                          ? ev.status === "pending"
                            ? "font-medium text-amber-800"
                            : "font-medium text-primary"
                          : ""
                      }
                    >
                      {ev.type === "conversion"
                        ? `${ev.status === "pending" ? "~" : "+"}$${(
                            ev.commission ?? 0
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

      <div className="mt-12 rounded-2xl border border-border bg-card p-8 text-center">
        <Gift className="mx-auto size-8 text-primary" />
        <h2 className="font-heading mt-3 text-2xl font-semibold text-primary">
          Start earning today
        </h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Create an account, copy your link, and track Forest Buddies plus
          external partners from one ledger.
        </p>
        <Button
          nativeButton={false}
          render={<Link href="/register" />}
          className="mt-6"
          size="lg"
        >
          Join as affiliate
        </Button>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight ? "border-gold/40 bg-gold/5" : "bg-card"
      }`}
    >
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 font-heading text-2xl font-semibold tabular-nums">
        {value}
      </div>
    </div>
  );
}
