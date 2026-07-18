"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ShieldOff,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useMembership } from "@/contexts/membership-context";

/**
 * Soft-deactivate account — free tier only.
 * Keeps profile data; marks inactive and signs the user out.
 */
export function AccountDeactivateControls() {
  const { user, deactivateAccount } = useAuth();
  const { isImpactMember, cancelScheduled } = useMembership();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <p className="text-sm text-muted-foreground">
        Sign in to manage your account.{" "}
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          Sign in
        </Link>
      </p>
    );
  }

  if (isImpactMember) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
        <p className="flex items-center gap-2 text-sm font-medium text-amber-950">
          <Sparkles className="size-4 shrink-0" />
          Cancel Impact Member first
        </p>
        <p className="mt-2 text-sm leading-relaxed text-amber-950/85">
          {cancelScheduled
            ? "Your Impact plan ends soon. After you move to Free, you can deactivate your account from Settings. Until then, Impact benefits stay active."
            : "Deactivate Account is for Free plan users. Cancel Impact Member first (you keep benefits until the billing period ends), then return here to deactivate."}
        </p>
        <Button
          size="sm"
          variant="outline"
          className="mt-3"
          nativeButton={false}
          render={<Link href="/dashboard#membership" />}
        >
          Go to Membership
        </Button>
      </div>
    );
  }

  if (confirming) {
    return (
      <div
        className="rounded-xl border border-destructive/30 bg-destructive/5 p-4"
        role="dialog"
        aria-labelledby="deactivate-account-title"
      >
        <p
          id="deactivate-account-title"
          className="flex items-center gap-2 font-medium text-destructive"
        >
          <AlertTriangle className="size-4 shrink-0" />
          Deactivate your account?
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          This is a soft deactivation. Your account will be marked inactive and
          you&apos;ll be signed out. We keep necessary profile and transaction
          records for legal and compliance reasons — we do not hard-delete your
          data from this step.
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-foreground/85">
          <li className="flex gap-2">
            <ShieldOff className="mt-0.5 size-3.5 shrink-0 text-destructive/80" />
            You won&apos;t be able to sign in until an admin restores access
          </li>
          <li className="flex gap-2">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-700" />
            Profile &amp; history retained (not publicly shown)
          </li>
          <li className="flex gap-2">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-700" />
            You can contact support later if you need help reactivating
          </li>
        </ul>
        {error && (
          <p className="mt-3 rounded-lg border border-destructive/30 bg-background px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/5"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await deactivateAccount();
                router.push("/login");
              } catch (e) {
                setError(
                  e instanceof Error
                    ? e.message
                    : "Could not deactivate account. Try again."
                );
                setBusy(false);
              }
            }}
          >
            {busy ? "Deactivating…" : "Confirm deactivate"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => {
              setConfirming(false);
              setError(null);
            }}
          >
            Never mind — keep account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-auto px-0 text-sm font-medium text-muted-foreground underline-offset-4 hover:bg-transparent hover:text-destructive hover:underline"
        onClick={() => setConfirming(true)}
      >
        Deactivate account
      </Button>
      <p className="text-xs text-muted-foreground">
        Soft delete for Free plan users. Your data is kept for legal reasons;
        the account is marked inactive.
      </p>
    </div>
  );
}
