"use client";

import { Settings, UserRound } from "lucide-react";
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

export default function DashboardSettingsPage() {
  const { user, profile, loading } = useAuth();
  const { tier, isImpactMember } = useMembership();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return <p className="text-muted-foreground">Loading settings…</p>;
  }

  if (!user) {
    return null;
  }

  const displayName =
    profile?.displayName ?? user.email?.split("@")[0] ?? "Member";

  return (
    <div className="space-y-8">
      <div>
        <Badge variant="secondary" className="mb-2 gap-1">
          <Settings className="size-3" />
          Settings
        </Badge>
        <h1 className="font-heading text-3xl font-semibold text-primary">
          Account &amp; profile
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Manage your Forest Buddies account. Free plan members can deactivate
          here anytime.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <UserRound className="size-5 text-primary" />
            Profile
          </CardTitle>
          <CardDescription>
            Signed-in details from your Forest Buddies account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Name</p>
            <p className="font-medium text-foreground">{displayName}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Email</p>
            <p className="font-medium text-foreground">
              {user.email ?? profile?.email ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Plan</p>
            <p className="font-medium text-foreground">
              {tier.name}
              {isImpactMember ? " · manage on Membership" : " · Free tier"}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<Link href="/dashboard#membership" />}
          >
            Membership settings
          </Button>
        </CardContent>
      </Card>

      <Card
        id="deactivate"
        className="scroll-mt-20 border-destructive/20"
      >
        <CardHeader>
          <CardTitle className="font-heading text-lg">Danger zone</CardTitle>
          <CardDescription>
            Deactivate Account soft-closes your Free plan account. We mark it
            inactive and keep records we need for legal reasons — nothing is
            hard-deleted from this screen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccountDeactivateControls />
        </CardContent>
      </Card>
    </div>
  );
}
