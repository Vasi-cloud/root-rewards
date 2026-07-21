"use client";

import {
  Bell,
  Check,
  Loader2,
  Lock,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AccountDeactivateControls } from "@/components/settings/account-deactivate-controls";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import {
  SettingsToastProvider,
  useSettingsToast,
} from "@/components/settings/settings-toast";
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
  return (
    <SettingsToastProvider>
      <AccountSettingsPageInner />
    </SettingsToastProvider>
  );
}

function AccountSettingsPageInner() {
  const { user, loading } = useAuth();
  const { tier, isImpactMember } = useMembership();
  const { showSuccess } = useSettingsToast();
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

  // Highlight section as user scrolls (mobile + desktop)
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

  async function saveNotifications() {
    setSavingNotifs(true);
    setNotifsSaved(false);
    try {
      await new Promise((r) => window.setTimeout(r, 350));
      setProfileOverrides(user!.uid, { notifications: notifs });
      setNotifsSaved(true);
      showSuccess("Notifications saved", "Your email preferences were updated.");
      window.setTimeout(() => setNotifsSaved(false), 2000);
    } finally {
      setSavingNotifs(false);
    }
  }

  async function savePreferences() {
    setSavingPrefs(true);
    setPrefsSaved(false);
    try {
      await new Promise((r) => window.setTimeout(r, 350));
      setProfileOverrides(user!.uid, { preferredUnits: units });
      setPrefsSaved(true);
      showSuccess("Preferences saved", "Distance units are ready for Buy Local.");
      window.setTimeout(() => setPrefsSaved(false), 2000);
    } finally {
      setSavingPrefs(false);
    }
  }

  function goToSection(id: string) {
    setActiveSection(id);
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <Badge variant="secondary" className="mb-2 gap-1">
          <Settings className="size-3" />
          Account
        </Badge>
        <h1 className="font-heading text-3xl font-semibold text-primary">
          Account settings
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Manage your Forest Buddies® profile, security, notifications, and
          shopping preferences — built for clarity and trust.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8">
        {/* Mobile: sticky horizontal chip bar; Desktop: sticky sidebar */}
        <div className="sticky top-[3.25rem] z-30 -mx-3 border-b border-border/50 bg-cream/95 px-3 py-2 backdrop-blur-md sm:top-16 lg:static lg:z-auto lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <nav
            className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] lg:sticky lg:top-24 lg:flex-col lg:self-start lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden"
            aria-label="Settings sections"
          >
            {SETTINGS_SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => goToSection(id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-200 lg:rounded-lg lg:border-transparent",
                  activeSection === id
                    ? "border-emerald-300 bg-emerald-800 text-cream shadow-sm lg:border-transparent lg:bg-primary/10 lg:text-primary lg:shadow-none"
                    : "border-border/70 bg-card/80 text-muted-foreground hover:border-emerald-200 hover:bg-emerald-50/80 hover:text-foreground lg:bg-transparent"
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="min-w-0 space-y-6">
          <Card id="profile" className="scroll-mt-36 border-border/70 shadow-sm sm:scroll-mt-28">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2 text-xl">
                <UserRound className="size-5 text-primary" />
                Profile Information
              </CardTitle>
              <CardDescription>
                How you appear across Forest Buddies® — edit your name and add a
                photo preview.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/50 px-3 py-2.5 text-xs text-emerald-950 sm:text-sm">
                <span className="font-medium">{tier.name}</span>
                <span className="text-emerald-800/70">·</span>
                <span>
                  {isImpactMember ? "Impact Member" : "Free plan"}
                </span>
                <Button
                  size="xs"
                  variant="outline"
                  className="ml-auto"
                  nativeButton={false}
                  render={<Link href="/membership" />}
                >
                  Manage membership
                </Button>
              </div>
              <ProfileSettingsForm />
            </CardContent>
          </Card>

          <Card id="security" className="scroll-mt-36 border-border/70 shadow-sm sm:scroll-mt-28">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2 text-xl">
                <Lock className="size-5 text-primary" />
                Security
              </CardTitle>
              <CardDescription>
                Password, sessions, and account protection.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/70 bg-card p-4 transition-colors hover:border-emerald-200">
                  <p className="font-medium text-foreground">Password</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Change password from your email provider for now. In-app
                    reset is on the roadmap.
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 bg-card p-4 transition-colors hover:border-emerald-200">
                  <p className="font-medium text-foreground">Sign-in method</p>
                  <p className="mt-1 text-xs text-muted-foreground">
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
            className="scroll-mt-36 border-border/70 shadow-sm sm:scroll-mt-28"
          >
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2 text-xl">
                <Bell className="size-5 text-primary" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose what we email you about. Saved on this device until
                account sync ships.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
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
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 transition-colors hover:bg-muted/40"
                >
                  <span className="text-sm text-foreground">{label}</span>
                  <input
                    type="checkbox"
                    className="size-4 accent-emerald-800"
                    checked={notifs[key]}
                    disabled={savingNotifs}
                    onChange={(e) =>
                      setNotifs((n) => ({ ...n, [key]: e.target.checked }))
                    }
                  />
                </label>
              ))}
              <Button
                type="button"
                size="sm"
                className="min-w-[10.5rem]"
                disabled={savingNotifs}
                onClick={() => void saveNotifications()}
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
            </CardContent>
          </Card>

          <Card
            id="preferences"
            className="scroll-mt-36 border-border/70 shadow-sm sm:scroll-mt-28"
          >
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2 text-xl">
                <SlidersHorizontal className="size-5 text-primary" />
                Account Preferences
              </CardTitle>
              <CardDescription>
                Distance units and shopping defaults for Buy Local and maps.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
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
                      onClick={() => setUnits(value)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60",
                        units === value
                          ? "border-emerald-800 bg-emerald-800 text-white"
                          : "border-border bg-background hover:bg-muted"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Language is controlled from the site header. Preferred cause
                sync will land here later.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-w-[9.5rem]"
                disabled={savingPrefs}
                onClick={() => void savePreferences()}
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
            </CardContent>
          </Card>

          <Card
            id="deactivate"
            className="scroll-mt-36 border-destructive/25 shadow-sm sm:scroll-mt-28"
          >
            <CardHeader>
              <CardTitle className="font-heading text-lg">Danger zone</CardTitle>
              <CardDescription>
                Deactivate soft-closes a Free plan account. Records needed for
                legal reasons are kept — nothing is hard-deleted from this
                screen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AccountDeactivateControls />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
