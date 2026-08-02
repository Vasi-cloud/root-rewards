"use client";

import { HeartHandshake } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  loadAdminMembers,
  subscribeAdminMembers,
  type AdminMemberRecord,
} from "@/lib/admin-members-ledger";

export function AdminMembersPanel() {
  const [members, setMembers] = useState<AdminMemberRecord[]>([]);

  useEffect(() => {
    const refresh = () => setMembers(loadAdminMembers());
    refresh();
    return subscribeAdminMembers(refresh);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-primary">
          Members
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Impact memberships recorded from upgrades on this device. Read-only
          for v1.
        </p>
      </div>

      <Card className="overflow-hidden border-primary/20">
        <CardHeader className="border-b border-primary/10 bg-emerald-50/40">
          <CardTitle className="font-heading flex items-center gap-2">
            <HeartHandshake className="size-4 text-emerald-800" />
            Membership list
          </CardTitle>
          <CardDescription>Newest first · active / cancelled</CardDescription>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {members.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-muted-foreground">
              No members yet.
            </p>
          ) : (
            members.map((m) => (
              <div
                key={m.id}
                className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">
                      {m.displayName || m.email || "Member"}
                    </span>
                    <Badge
                      className={
                        m.status === "active"
                          ? "bg-emerald-100 text-emerald-950"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {m.status}
                    </Badge>
                    <Badge variant="outline">{m.tierLabel}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {m.email ?? "No email on file"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Started{" "}
                    {new Date(m.startedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                    {m.amountMonthly > 0
                      ? ` · $${m.amountMonthly}/mo`
                      : null}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
