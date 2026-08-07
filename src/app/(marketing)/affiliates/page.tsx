"use client";

import { ChevronDown, Copy, ExternalLink, Link2 } from "lucide-react";
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
import { buildReferralUrl } from "@/lib/affiliate";
import {
  describeEvent,
  ensureMyAffiliateCode,
  getMyAffiliateEvents,
  getMyAffiliateStats,
} from "@/lib/affiliate-storage";
import type { AffiliateEvent, AffiliateStats } from "@/types";

export default function AffiliatesPage() {
  const { profile } = useAuth();
  const { isImpactMember } = useMembership();
  const [code, setCode] = useState("…");
  const [stats, setStats] = useState<AffiliateStats>({
    clicks: 0,
    conversions: 0,
    earnings: 0,
    pendingPayout: 0,
    pendingPartnerReports: 0,
  });
  const [events, setEvents] = useState<AffiliateEvent[]>([]);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("https://www.forestbuddies.com");
  const [showActivity, setShowActivity] = useState(false);

  const refresh = useCallback(() => {
    if (!isImpactMember) return;
    const mine = ensureMyAffiliateCode(profile?.affiliateCode);
    setCode(mine);
    setStats(getMyAffiliateStats(mine));
    setEvents(getMyAffiliateEvents(15));
  }, [profile?.affiliateCode, isImpactMember]);

  useEffect(() => {
    if (!isImpactMember) return;
    refresh();
    setOrigin(window.location.origin);
    const onUpdate = () => refresh();
    window.addEventListener("forest-buddies-affiliate-updated", onUpdate);
    return () =>
      window.removeEventListener("forest-buddies-affiliate-updated", onUpdate);
  }, [refresh, isImpactMember]);

  const shareUrl = buildReferralUrl({ origin, code, path: "/marketplace" });
  const pending = stats.pendingPartnerReports ?? 0;
  const confirmed = stats.earnings;
  const lifetime = Number((confirmed + pending).toFixed(2));

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  if (!isImpactMember) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <Badge className="mb-3 bg-gold/20 text-primary">Affiliate program</Badge>
        <h1 className="font-heading text-3xl font-semibold text-primary sm:text-4xl">
          Affiliate tools for Impact Members
        </h1>
        <p className="mt-3 text-muted-foreground">
          Upgrade to unlock your share link and 25% of eligible commissions we
          receive, as account credit, after partners pay us. Not a cash wallet.
        </p>
        <Card className="mt-8 border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-cream to-cream">
          <CardHeader>
            <CardTitle className="font-heading text-xl">
              Unlock sharing with Impact Member
            </CardTitle>
            <CardDescription>
              Free plans have no commission share. Marketplace, Buy Local,
              Kitchen, Parts, and Ask Leafy stay free.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              nativeButton={false}
              render={<Link href="/membership" />}
              size="lg"
            >
              Upgrade to earn
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/membership#how-earnings-work" />}
              variant="outline"
              size="lg"
            >
              How earnings work
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Badge className="mb-3 bg-gold/20 text-primary">Your earnings</Badge>
      <h1 className="font-heading text-3xl font-semibold text-primary sm:text-4xl">
        Affiliate credit
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Account credit after partners pay us — not a cash wallet.
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        You earn 25% of eligible commissions we receive.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <CreditStat
          label="Pending"
          value={`£${pending.toFixed(2)}`}
          hint="Estimates until partners confirm"
          tone="pending"
        />
        <CreditStat
          label="Confirmed"
          value={`£${confirmed.toFixed(2)}`}
          hint="Account credit available when confirmed"
          tone="confirmed"
        />
        <CreditStat
          label="Lifetime"
          value={`£${lifetime.toFixed(2)}`}
          hint="Pending + confirmed"
        />
      </div>

      <Card className="mt-8 border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-cream to-cream">
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2 text-lg">
            <Link2 className="size-5 text-primary" /> Your share link
          </CardTitle>
          <CardDescription>
            Share this link. Credit appears here after partners pay us — empty
            until then is normal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <code className="block w-full overflow-x-auto rounded-xl border bg-white px-4 py-3 text-sm">
            {shareUrl}
          </code>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button className="gap-2" onClick={() => void copyLink()}>
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
              Browse products to share
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => setShowActivity((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
          aria-expanded={showActivity}
        >
          Recent activity
          <ChevronDown
            className={`size-4 shrink-0 text-muted-foreground transition-transform ${
              showActivity ? "rotate-180" : ""
            }`}
          />
        </button>
        {showActivity ? (
          <Card className="mt-2 border-border/80">
            <CardContent className="pt-4">
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No activity yet. Copy your link or share a marketplace product
                  — zeros are fine until partners report.
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
                          {ev.productName ||
                            ev.productId ||
                            ev.destination ||
                            "—"}
                          {ev.status === "pending"
                            ? " · awaiting partner"
                            : ""}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="font-mono text-xs text-muted-foreground">
                          {new Date(ev.createdAt).toLocaleDateString()}
                        </div>
                        {ev.type === "conversion" ? (
                          <div
                            className={
                              ev.status === "pending"
                                ? "font-medium text-amber-800"
                                : ev.status !== "reversed"
                                  ? "font-medium text-primary"
                                  : "text-muted-foreground"
                            }
                          >
                            {ev.status === "pending" ? "~" : "+"}£
                            {(ev.commission ?? 0).toFixed(2)}
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

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Membership fees support the platform. Cause payments fund partner
        programmes — not cashback.{" "}
        <Link
          href="/membership#how-earnings-work"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          How earnings work
        </Link>
      </p>
    </div>
  );
}

function CreditStat({
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
    <div
      className={`rounded-2xl border p-4 ${
        tone === "confirmed"
          ? "border-emerald-200 bg-emerald-50/50"
          : tone === "pending"
            ? "border-amber-200/80 bg-amber-50/40"
            : "bg-card"
      }`}
    >
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 font-heading text-2xl font-semibold tabular-nums">
        {value}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
