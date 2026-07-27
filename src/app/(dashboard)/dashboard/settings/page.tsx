"use client";

import {
  ArrowRight,
  Bell,
  Check,
  Leaf,
  Loader2,
  Lock,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AccountDeactivateControls } from "@/components/settings/account-deactivate-controls";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { useAppToast } from "@/components/ui/app-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { useMembership } from "@/contexts/membership-context";
import {
  getProfileOverrides,
  setProfileOverrides,
} from "@/lib/profile-storage";
import { cn } from "@/lib/utils";

const SETTINGS_SECTIONS = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "security", label: "Security", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
  { id: "deactivate", label: "Danger zone", icon: ShieldCheck },
] as const;

const DEFAULT_NOTIFS = {
  orders: true,
  affiliates: true,
  cartReminders: false,
  impact: true,
};

/**
 * Account Settings — lives at `/dashboard/settings` (dashboard layout).
 */
export default function AccountSettingsPage() {
  return <AccountSettingsPageInner />;
}

function AccountSettingsPageInner() {
  const { user, loading } = useAuth();
  const { tier, isImpactMember } = useMembership();
  const { showSuccess } = useAppToast();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string>("profile");
  const [notifs, setNotifs] = useState(DEFAULT_NOTIFS);
  const [units, setUnits] = useState<"mi" | "km">("mi");
  const [savingNotifs, setSavingNotifs] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [notifsSaved, setNotifsSaved] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?next=/dashboard/settings");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const o = getProfileOverrides(user.uid);
    if (o.notifications) setNotifs({ ...DEFAULT_NOTIFS, ...o.notifications });
    if (o.preferredUnits) setUnits(o.preferredUnits);
  }, [user]);

  useEffect(() => {
    const onHash = () => {
      const id = window.location.hash.replace("#", "");
      if (SETTINGS_SECTIONS.some((s) => s.id === id)) setActiveSection(id);
    };
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const ids = SETTINGS_SECTIONS.map((s) => s.id);
    const observers: IntersectionObserver[] = [];

    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) setActiveSection(id);
        },
        { rootMargin: "-30% 0px -55% 0px", threshold: 0 }
      );
      observer.observe(el);
      observers.push(observer);
    }

    return () => observers.forEach((o) => o.disconnect());
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-muted" />
        <div className="mt-6 grid gap-4 lg:grid-cols-[12rem_1fr]">
          <div className="hidden h-48 animate-pulse rounded-xl bg-muted lg:block" />
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  async function persistNotifications(
    next: typeof DEFAULT_NOTIFS,
    { toast = true }: { toast?: boolean } = {}
  ) {
    setNotifs(next);
    setSavingNotifs(true);
    setNotifsSaved(false);
    try {
      await new Promise((r) => window.setTimeout(r, 280));
      setProfileOverrides(user!.uid, { notifications: next });
      setNotifsSaved(true);
      if (toast) {
        showSuccess(
          "Notifications saved",
          "Your email preferences were updated on this device."
        );
      }
      window.setTimeout(() => setNotifsSaved(false), 2000);
    } finally {
      setSavingNotifs(false);
    }
  }

  async function persistUnits(
    next: "mi" | "km",
    { toast = true }: { toast?: boolean } = {}
  ) {
    setUnits(next);
    setSavingPrefs(true);
    setPrefsSaved(false);
    try {
      await new Promise((r) => window.setTimeout(r, 280));
      setProfileOverrides(user!.uid, { preferredUnits: next });
      setPrefsSaved(true);
      if (toast) {
        showSuccess(
          "Preferences saved",
          `Distance units set to ${next === "mi" ? "miles" : "kilometres"} for Buy Local.`
        );
      }
      window.setTimeout(() => setPrefsSaved(false), 2000);
    } finally {
      setSavingPrefs(false);
    }
  }

  function goToSection(id: string) {
    setActiveSection(id);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${id}`);
    }
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      <div>
        <Badge variant="secondary" className="mb-2 gap-1">
          <Settings className="size-3" />
          Account
        </Badge>
        <h1 className="font-heading text-3xl font-semibold text-primary">
          Account settings
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
          Profile, security, notifications, and preferences — plus a clear path
          to membership.
        </p>
      </div>

      {/* Membership cross-link */}
      <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/80 via-cream to-white px-3.5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800/70">
            Membership
          </p>
          <p className="mt-0.5 font-medium text-emerald-950">
            {tier.name}
            <span className="font-normal text-emerald-900/75">
              {" "}
              · {isImpactMember ? "Impact Member" : "Free plan"}
            </span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isImpactMember
              ? "Manage billing, cause credit, or cancel from Membership."
              : "Upgrade for +25% commissions, monthly cause credit, and a badge."}
          </p>
        </div>
        <Button
          className="h-11 w-full shrink-0 gap-1.5 bg-emerald-800 text-cream hover:bg-emerald-900 sm:h-9 sm:w-auto"
          nativeButton={false}
          render={<Link href="/membership" />}
        >
          <Sparkles className="size-3.5" />
          {isImpactMember ? "Manage membership" : "View membership"}
          <ArrowRight className="size-3.5 opacity-80" />
        </Button>
      </div>

      {/* Impact cross-link */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/60 px-3.5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800/70">
            Your impact
          </p>
          <p className="mt-0.5 font-medium text-foreground">
            Trees, CO₂ estimates, and causes you’ve funded
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Based on your Forest Buddies activity on this device.
          </p>
        </div>
        <Button
          className="h-11 w-full shrink-0 gap-1.5 sm:h-9 sm:w-auto"
          variant="outline"
          nativeButton={false}
          render={<Link href="/dashboard/impact" />}
        >
          <Leaf className="size-3.5" />
          Open impact
          <ArrowRight className="size-3.5 opacity-80" />
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-8">
        <div className="sticky top-[3.25rem] z-30 -mx-3 border-b border-border/50 bg-cream/95 px-3 py-2.5 backdrop-blur-md sm:top-16 lg:static lg:z-auto lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <p className="mb-2 hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-800/70 lg:block">
            Sections
          </p>
          <nav
            className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] lg:sticky lg:top-24 lg:flex-col lg:gap-1 lg:self-start lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden"
            aria-label="Settings sections"
          >
            {SETTINGS_SECTIONS.map(({ id, label, icon: Icon }, index) => (
              <button
                key={id}
                type="button"
                onClick={() => goToSection(id)}
                aria-current={activeSection === id ? "true" : undefined}
                className={cn(
                  "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-200 lg:min-h-10 lg:w-full lg:justify-start lg:rounded-xl lg:border-transparent lg:px-3",
                  activeSection === id
                    ? "border-emerald-300 bg-emerald-800 text-cream shadow-sm lg:border-transparent lg:bg-emerald-800/10 lg:text-emerald-950 lg:shadow-none"
                    : "border-border/70 bg-card/80 text-muted-foreground hover:border-emerald-200 hover:bg-emerald-50/80 hover:text-foreground lg:bg-transparent"
                )}
              >
                <span
                  className={cn(
                    "hidden size-5 items-center justify-center rounded-md text-[10px] font-bold tabular-nums lg:inline-flex",
                    activeSection === id
                      ? "bg-emerald-800 text-cream"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {index + 1}
                </span>
                <Icon className="size-3.5 shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="min-w-0 space-y-5 sm:space-y-6">
          <Card
            id="profile"
            className="scroll-mt-40 border-border/70 shadow-sm sm:scroll-mt-28"
          >
            <CardHeader className="space-y-1 px-4 sm:px-6">
              <CardTitle className="font-heading flex items-center gap-2 text-xl">
                <UserRound className="size-5 text-primary" />
                Profile
              </CardTitle>
              <CardDescription>
                How you appear across Forest Buddies® — edit your name and add a
                photo preview on this device.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <ProfileSettingsForm />
            </CardContent>
          </Card>

          <Card
            id="security"
            className="scroll-mt-40 border-border/70 shadow-sm sm:scroll-mt-28"
          >
            <CardHeader className="space-y-1 px-4 sm:px-6">
              <CardTitle className="font-heading flex items-center gap-2 text-xl">
                <Lock className="size-5 text-primary" />
                Security
              </CardTitle>
              <CardDescription>
                Password, sessions, and account protection.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-4 text-sm sm:px-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/70 bg-card p-4">
                  <p className="font-medium text-foreground">Password</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Change password from your email provider for now. In-app
                    reset is on the roadmap.
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 bg-card p-4">
                  <p className="font-medium text-foreground">Sign-in method</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {user.providerData?.[0]?.providerId === "google.com"
                      ? "Google"
                      : "Email & password"}{" "}
                    · Two-factor authentication coming soon.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            id="notifications"
            className="scroll-mt-40 border-border/70 shadow-sm sm:scroll-mt-28"
          >
            <CardHeader className="space-y-1 px-4 sm:px-6">
              <CardTitle className="font-heading flex items-center gap-2 text-xl">
                <Bell className="size-5 text-primary" />
                Notifications
              </CardTitle>
              <CardDescription>
                Toggle what we email you about. Changes save on this device
                right away.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 px-4 sm:px-6">
              {(
                [
                  ["orders", "Order and shipping updates"],
                  ["affiliates", "Affiliate earnings digests"],
                  ["cartReminders", "Abandoned cart reminders"],
                  ["impact", "Impact and cause highlights"],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-3.5 py-3 transition-colors hover:bg-muted/40"
                >
                  <span className="text-sm text-foreground">{label}</span>
                  <input
                    type="checkbox"
                    className="size-5 accent-emerald-800"
                    checked={notifs[key]}
                    disabled={savingNotifs}
                    onChange={(e) => {
                      const next = { ...notifs, [key]: e.target.checked };
                      void persistNotifications(next);
                    }}
                  />
                </label>
              ))}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  type="button"
                  className="h-11 min-w-[10.5rem] sm:h-9"
                  disabled={savingNotifs}
                  onClick={() => void persistNotifications(notifs)}
                >
                  {savingNotifs ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Saving…
                    </>
                  ) : notifsSaved ? (
                    <>
                      <Check className="size-3.5" />
                      Saved
                    </>
                  ) : (
                    "Save notifications"
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Toggles auto-save · account sync coming later.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            id="preferences"
            className="scroll-mt-40 border-border/70 shadow-sm sm:scroll-mt-28"
          >
            <CardHeader className="space-y-1 px-4 sm:px-6">
              <CardTitle className="font-heading flex items-center gap-2 text-xl">
                <SlidersHorizontal className="size-5 text-primary" />
                Preferences
              </CardTitle>
              <CardDescription>
                Distance units for Buy Local and maps — saved on this device.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 text-sm sm:px-6">
              <div className="space-y-2">
                <Label>Distance units</Label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["mi", "Miles"],
                      ["km", "Kilometres"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      disabled={savingPrefs}
                      onClick={() => void persistUnits(value)}
                      className={cn(
                        "min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition-all disabled:opacity-60 sm:min-h-0 sm:px-3 sm:py-1.5",
                        units === value
                          ? "border-emerald-800 bg-emerald-800 text-white shadow-sm"
                          : "border-border bg-background hover:bg-muted"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Language is controlled from the site header. Preferred cause
                sync will land here later.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 min-w-[9.5rem] sm:h-9"
                  disabled={savingPrefs}
                  onClick={() => void persistUnits(units)}
                >
                  {savingPrefs ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Saving…
                    </>
                  ) : prefsSaved ? (
                    <>
                      <Check className="size-3.5" />
                      Saved
                    </>
                  ) : (
                    "Save preferences"
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Units auto-save when you tap Miles or Kilometres.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            id="deactivate"
            className="scroll-mt-40 border-destructive/25 shadow-sm sm:scroll-mt-28"
          >
            <CardHeader className="space-y-1 px-4 sm:px-6">
              <CardTitle className="font-heading flex items-center gap-2 text-lg text-destructive">
                <ShieldCheck className="size-5" />
                Danger zone
              </CardTitle>
              <CardDescription>
                Deactivate soft-closes a Free plan account. Records needed for
                legal reasons are kept — nothing is hard-deleted from this
                screen.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <AccountDeactivateControls />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
