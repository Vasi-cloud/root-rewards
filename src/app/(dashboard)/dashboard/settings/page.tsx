"use client";

import {
  Bell,
  Lock,
  Settings,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AccountDeactivateControls } from "@/components/settings/account-deactivate-controls";
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

/**
 * Account Settings — lives at `/dashboard/settings` (dashboard layout).
 */
export default function AccountSettingsPage() {
  const { user, profile, loading } = useAuth();
  const { tier, isImpactMember } = useMembership();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?next=/dashboard/settings");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Loading account settings…</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName =
    profile?.displayName ?? user.email?.split("@")[0] ?? "Member";
  const email = user.email ?? profile?.email ?? "—";

  return (
    <div className="space-y-8">
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
          preferences.
        </p>
      </div>

      <Card id="profile">
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2 text-xl">
            <UserRound className="size-5 text-primary" />
            Profile Information
          </CardTitle>
          <CardDescription>
            How you appear across Forest Buddies®.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Display name
              </p>
              <p className="mt-0.5 font-medium text-foreground">{displayName}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Email</p>
              <p className="mt-0.5 font-medium text-foreground">{email}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Plan</p>
              <p className="mt-0.5 font-medium text-foreground">
                {tier.name}
                {isImpactMember ? " · Impact Member" : " · Free"}
              </p>
            </div>
          </div>
          <p className="rounded-xl border border-dashed border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
            Edit name and photo — coming soon.
          </p>
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<Link href="/membership" />}
          >
            Manage membership
          </Button>
        </CardContent>
      </Card>

      <Card id="security">
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
          <p className="text-muted-foreground">
            Change password and two-factor authentication will live here. If you
            use email/password via Firebase, recover access through your email
            provider for now.
          </p>
          <p className="rounded-xl border border-dashed border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
            Placeholder — security controls coming soon.
          </p>
        </CardContent>
      </Card>

      <Card id="notifications">
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2 text-xl">
            <Bell className="size-5 text-primary" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Email and in-app alerts for orders, affiliates, and impact.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ul className="list-inside list-disc space-y-1 text-muted-foreground">
            <li>Order and shipping updates</li>
            <li>Affiliate earnings digests</li>
            <li>Abandoned cart reminders</li>
            <li>Impact and cause highlights</li>
          </ul>
          <p className="rounded-xl border border-dashed border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
            Placeholder — notification toggles coming soon.
          </p>
        </CardContent>
      </Card>

      <Card id="preferences">
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2 text-xl">
            <SlidersHorizontal className="size-5 text-primary" />
            Account Preferences
          </CardTitle>
          <CardDescription>
            Language, shopping defaults, and cause preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Use the language switcher in the site header for now. Saved defaults
            (preferred cause, units) will sync here later.
          </p>
          <p className="rounded-xl border border-dashed border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
            Placeholder — preference controls coming soon.
          </p>
        </CardContent>
      </Card>

      <Card id="deactivate" className="scroll-mt-20 border-destructive/25">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Danger zone</CardTitle>
          <CardDescription>
            Deactivate soft-closes a Free plan account. Records needed for legal
            reasons are kept — nothing is hard-deleted from this screen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccountDeactivateControls />
        </CardContent>
      </Card>
    </div>
  );
}
