"use client";

import { ArrowLeft, Leaf, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AdminReportsPanel } from "@/components/admin/admin-reports-panel";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { isAdminUser } from "@/lib/admin";

export default function AdminReportsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isAdmin = isAdminUser(user?.email);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/");
    }
  }, [loading, isAdmin, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-cream px-4 text-center">
        <p className="font-heading text-xl font-semibold text-primary">
          Access denied
        </p>
        <p className="text-sm text-muted-foreground">
          Listing reports are only visible to admins.
        </p>
        <Button nativeButton={false} render={<Link href="/" />}>
          Back to site
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sage/20 via-cream to-cream">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-cream/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-3 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Leaf className="size-4" />
            </div>
            <div className="min-w-0">
              <h1 className="font-heading truncate text-lg font-semibold text-primary sm:text-xl">
                Admin · Reports
              </h1>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Listing reports only
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              nativeButton={false}
              render={<Link href="/admin" />}
              variant="outline"
              size="sm"
              className="gap-1"
            >
              <ArrowLeft className="size-3.5" />
              Dashboard
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-3 py-6 sm:px-6 sm:py-8">
        <AdminReportsPanel />
      </main>
    </div>
  );
}
