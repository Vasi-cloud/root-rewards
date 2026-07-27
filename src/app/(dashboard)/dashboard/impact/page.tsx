"use client";

import {
  ArrowRight,
  BookOpen,
  ChefHat,
  Leaf,
  MapPin,
  MessageSquareText,
  PawPrint,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Sun,
  Trees,
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
import { formatCauseUnits, getCause } from "@/lib/causes";
import {
  getPersonalImpactSummary,
  subscribeUserImpact,
  type PersonalImpactSummary,
} from "@/lib/impact-storage";

const CAUSE_ICONS = {
  trees: Leaf,
  waves: Waves,
  paw: PawPrint,
  book: BookOpen,
  sun: Sun,
} as const;

const EMPTY_CTAS = [
  {
    href: "/marketplace",
    label: "Shop marketplace",
    hint: "Eco finds that fund causes at checkout",
    icon: ShoppingBag,
  },
  {
    href: "/kitchen",
    label: "Use Leafy Kitchen",
    hint: "Plan a cook and shop more intentionally",
    icon: ChefHat,
  },
  {
    href: "/local",
    label: "Check Buy Local",
    hint: "Find nearby stores & makers",
    icon: MapPin,
  },
  {
    href: "/recommend",
    label: "Ask Leafy",
    hint: "Photo or question → greener picks",
    icon: MessageSquareText,
  },
] as const;

export default function PersonalImpactPage() {
  const { profile, user, loading } = useAuth();
  const [summary, setSummary] = useState<PersonalImpactSummary | null>(null);

  useEffect(() => {
    const refresh = () => setSummary(getPersonalImpactSummary());
    refresh();
    return subscribeUserImpact(refresh);
  }, []);

  if (loading || !summary) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-8 w-52 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-muted" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const name =
    profile?.displayName ?? user?.email?.split("@")[0] ?? "friend";

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge className="gap-1 bg-emerald-800/10 font-normal text-emerald-900">
            <Sparkles className="size-3.5" />
            Your impact
          </Badge>
          {summary.isEstimated && (
            <Badge variant="outline" className="text-muted-foreground">
              Includes estimates
            </Badge>
          )}
        </div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
          Personal impact
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Nice work, {name}. Here’s a simple look at what your Forest Buddies®
          activity has supported so far — based on checkouts, causes, and
          shopping on this device.
        </p>
      </div>

      {!summary.hasActivity ? (
        <Card className="border-dashed border-emerald-300/80 bg-emerald-50/40">
          <CardContent className="flex flex-col items-center px-4 py-10 text-center sm:px-6 sm:py-12">
            <span className="mb-3 flex size-14 items-center justify-center rounded-full bg-emerald-800 text-cream shadow-sm">
              <Trees className="size-6" />
            </span>
            <h2 className="font-heading text-xl font-semibold text-emerald-950">
              Your impact story starts here
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Shop the marketplace, plan a recipe, or ask Leafy — when you fund
              a cause or complete an eco purchase, your totals will show up
              here.
            </p>
            <ul className="mt-6 grid w-full max-w-lg gap-2 sm:grid-cols-2">
              {EMPTY_CTAS.map((cta) => {
                const Icon = cta.icon;
                return (
                  <li key={cta.href}>
                    <Button
                      nativeButton={false}
                      render={<Link href={cta.href} />}
                      variant="outline"
                      className="h-auto min-h-14 w-full justify-start gap-3 border-emerald-200/90 bg-white px-3 py-2.5 text-left whitespace-normal hover:bg-emerald-50"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-800 text-cream">
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-emerald-950">
                          {cta.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {cta.hint}
                        </span>
                      </span>
                    </Button>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              icon={Trees}
              label="Trees planted"
              value={
                summary.treesEquivalent > 0
                  ? summary.treesEquivalent % 1 === 0
                    ? String(summary.treesEquivalent)
                    : summary.treesEquivalent.toFixed(1)
                  : "0"
              }
              detail={
                summary.isEstimated
                  ? "Tree-equivalent from funded CO₂ (estimate)"
                  : "From Trees cause contributions"
              }
            />
            <MetricCard
              icon={Leaf}
              label="CO₂ estimate"
              value={`~${summary.co2Kg}`}
              detail="kg CO₂e from cause units (illustrative)"
            />
            <MetricCard
              icon={ShoppingBag}
              label="Eco purchases"
              value={String(summary.ecoPurchases)}
              detail="Completed Forest Buddies checkouts"
            />
            <MetricCard
              icon={ShoppingCart}
              label="Cart actions"
              value={String(summary.cartActions)}
              detail="Adds & updates that helped build impact"
            />
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Based on your Forest Buddies activity on this device. Cause CO₂
            figures are illustrative estimates — not a full carbon audit.
          </p>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 via-cream to-white">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="font-heading text-lg text-emerald-950 sm:text-xl">
                  Causes funded
                </CardTitle>
                <CardDescription>
                  Trees, Ocean, Animals, Education, and Climate when you’ve
                  contributed at checkout.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                {summary.byCause.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No cause units yet — pick a cause on your next checkout.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {summary.byCause.map((row) => {
                      const cause = getCause(row.id);
                      if (!cause) return null;
                      const Icon = CAUSE_ICONS[cause.icon];
                      return (
                        <li
                          key={row.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200/70 bg-white/80 px-3 py-2.5"
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-800/90 text-cream">
                              <Icon className="size-3.5" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-emerald-950">
                                {row.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatCauseUnits(cause, row.units)} · ~
                                {row.co2Kg} kg CO₂e
                              </p>
                            </div>
                          </div>
                          <span className="shrink-0 text-sm font-medium tabular-nums text-emerald-950">
                            ${row.cost.toFixed(2)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <Button
                  nativeButton={false}
                  render={<Link href="/checkout" />}
                  variant="outline"
                  className="mt-4 h-11 w-full gap-2 sm:h-9 sm:w-auto"
                >
                  <Leaf className="size-3.5" />
                  Fund a cause at checkout
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="font-heading text-lg sm:text-xl">
                  Recent impact
                </CardTitle>
                <CardDescription>
                  Latest cause gifts, purchases, and Leafy Kitchen plans.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                {summary.recent.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Activity will appear here as you shop and support causes.
                  </p>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {summary.recent.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                            {item.detail}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[11px] tabular-nums text-muted-foreground">
                            {new Date(item.at).toLocaleDateString()}
                          </p>
                          {typeof item.co2Kg === "number" && item.co2Kg > 0 && (
                            <p className="text-xs font-medium text-emerald-800">
                              ~{item.co2Kg} kg
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              nativeButton={false}
              render={<Link href="/marketplace" />}
              className="h-11 gap-2 bg-emerald-800 text-cream hover:bg-emerald-900 sm:h-9"
            >
              Keep shopping
              <ArrowRight className="size-3.5" />
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/dashboard" />}
              variant="outline"
              className="h-11 sm:h-9"
            >
              Back to overview
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/dashboard/settings" />}
              variant="ghost"
              className="h-11 sm:h-9"
            >
              Account settings
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="border-emerald-200/70 bg-gradient-to-br from-white via-emerald-50/40 to-cream">
      <CardHeader className="space-y-2 px-4 pb-4 sm:px-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800/70">
            {label}
          </p>
          <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-800 text-cream">
            <Icon className="size-3.5" />
          </span>
        </div>
        <p className="font-heading text-3xl font-semibold tabular-nums tracking-tight text-emerald-950">
          {value}
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">{detail}</p>
      </CardHeader>
    </Card>
  );
}
