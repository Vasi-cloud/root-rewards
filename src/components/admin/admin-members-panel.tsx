"use client";

import { Download, HeartHandshake, Loader2, RefreshCw } from "lucide-react";
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
import type { AdminStripeMember } from "@/lib/admin-stripe-members";
import { ADMIN_EXPORT_CURRENCY } from "@/lib/admin-csv";
import { exportStripeMembersCsv } from "@/lib/admin-export";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

function statusBadge(status: AdminStripeMember["status"]) {
  if (status === "active") {
    return { label: "active", className: "bg-emerald-100 text-emerald-950" };
  }
  if (status === "past_due") {
    return { label: "past_due", className: "bg-amber-100 text-amber-950" };
  }
  return { label: "cancelled", className: "bg-muted text-muted-foreground" };
}

export function AdminMembersPanel() {
  const { user } = useAuth();
  const [members, setMembers] = useState<AdminStripeMember[]>([]);
  const [mode, setMode] = useState<"live" | "demo" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportNote, setExportNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    const email = user?.email?.trim();
    if (!email) {
      setError("Sign in as admin to load Stripe members.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/members?email=${encodeURIComponent(email)}`,
        {
          headers: { "x-admin-email": email },
          cache: "no-store",
        }
      );
      const data = (await res.json().catch(() => ({}))) as {
        members?: AdminStripeMember[];
        mode?: "live" | "demo";
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not load members from Stripe.");
        setMembers([]);
        return;
      }
      setMembers(data.members ?? []);
      setMode(data.mode ?? null);
    } catch {
      setError("Could not load members from Stripe.");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleExport() {
    const result = exportStripeMembersCsv(members);
    setExportNote(
      result.rowCount === 0
        ? `Downloaded ${result.filename} (headers only — no rows yet).`
        : `Downloaded ${result.filename} (${result.rowCount} row${result.rowCount === 1 ? "" : "s"}).`
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-primary">
            Members
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Impact Member subscriptions from Stripe. Export uses{" "}
            {ADMIN_EXPORT_CURRENCY} · monthly plan
            {mode === "demo" ? " · Stripe not configured (demo)" : ""}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            className="h-11 shrink-0 gap-2 sm:h-9"
            disabled={loading}
            onClick={() => void load()}
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            Refresh
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 shrink-0 gap-2 sm:h-9"
            onClick={handleExport}
            disabled={loading}
          >
            <Download className="size-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {exportNote ? (
        <p className="text-xs text-muted-foreground" role="status">
          {exportNote}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Card className="overflow-hidden border-primary/20">
        <CardHeader className="border-b border-primary/10 bg-emerald-50/40">
          <CardTitle className="font-heading flex items-center gap-2">
            <HeartHandshake className="size-4 text-emerald-800" />
            Membership list
          </CardTitle>
          <CardDescription>
            Email · status · Impact Member · period end · started
            {members.length > 0 ? ` · ${members.length} from Stripe` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading from Stripe…
            </p>
          ) : members.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-muted-foreground">
              No Impact Member subscriptions found in Stripe.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-border/80 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Plan</th>
                    <th className="px-4 py-3 font-medium">Period end</th>
                    <th className="px-4 py-3 font-medium">Started</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {members.map((m) => {
                    const badge = statusBadge(m.status);
                    return (
                      <tr key={m.subscriptionId} className="align-top">
                        <td className="px-4 py-3">
                          {m.email ? (
                            <span className="font-medium text-foreground">
                              {m.email}
                            </span>
                          ) : (
                            <div>
                              <span className="font-mono text-xs text-foreground">
                                {m.customerId}
                              </span>
                              <p className="mt-0.5 text-xs text-amber-800">
                                email missing in Stripe
                              </p>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={badge.className}>
                            {badge.label}
                          </Badge>
                          {m.cancelAtPeriodEnd && m.status === "active" ? (
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              Cancels at period end
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {m.plan}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-muted-foreground">
                          {formatDate(m.periodEndsAt)}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-muted-foreground">
                          {formatDate(m.startedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
