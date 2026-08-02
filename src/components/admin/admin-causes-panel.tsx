"use client";

import { TreePine } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  loadAdminCauseContributions,
  subscribeAdminCauses,
  sumAdminCausesThisMonth,
  type AdminCauseContribution,
} from "@/lib/admin-causes-ledger";

export function AdminCausesPanel() {
  const [rows, setRows] = useState<AdminCauseContribution[]>([]);
  const [monthTotal, setMonthTotal] = useState(0);

  useEffect(() => {
    const refresh = () => {
      setRows(loadAdminCauseContributions());
      setMonthTotal(sumAdminCausesThisMonth());
    };
    refresh();
    return subscribeAdminCauses(refresh);
  }, []);

  const monthLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      }),
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-primary">
          Causes ledger
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Internal batching view for partner cause gifts from Donate and
          checkout — not public.
        </p>
      </div>

      <Card className="border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 via-cream to-white">
        <CardContent className="flex flex-wrap items-end justify-between gap-3 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/70">
              {monthLabel} total
            </p>
            <p className="font-heading mt-1 text-3xl font-semibold tabular-nums text-primary">
              ${monthTotal.toFixed(2)}
            </p>
          </div>
          <p className="max-w-xs text-xs text-muted-foreground">
            Sum of recorded contribute amounts this calendar month.
          </p>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-primary/20">
        <CardHeader className="border-b border-primary/10 bg-emerald-50/40">
          <CardTitle className="font-heading flex items-center gap-2">
            <TreePine className="size-4 text-emerald-800" />
            Contributions
          </CardTitle>
          <CardDescription>
            Cause · amount · date · source · status
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {rows.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-muted-foreground">
              No contributions yet.
            </p>
          ) : (
            rows.map((row) => (
              <div
                key={row.id}
                className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">
                      {row.causeName}
                    </span>
                    <Badge variant="outline" className="capitalize">
                      {row.source}
                    </Badge>
                    <Badge
                      className={
                        row.status === "recorded"
                          ? "bg-emerald-100 text-emerald-950"
                          : "bg-amber-100 text-amber-950"
                      }
                    >
                      {row.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {row.units} unit{row.units === 1 ? "" : "s"} ·{" "}
                    {new Date(row.createdAt).toLocaleString()}
                  </p>
                </div>
                <p className="shrink-0 font-semibold tabular-nums text-primary">
                  ${row.amount.toFixed(2)}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
