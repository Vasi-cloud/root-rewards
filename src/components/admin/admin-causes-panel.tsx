"use client";

import { Download, TreePine } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ADMIN_EXPORT_CURRENCY } from "@/lib/admin-csv";
import {
  loadAdminCauseContributions,
  subscribeAdminCauses,
  sumAdminCausesThisMonth,
  type AdminCauseContribution,
} from "@/lib/admin-causes-ledger";
import { exportCausesCsv } from "@/lib/admin-export";
import {
  illustrativeUnitNote,
  listCauseProgrammes,
  setCauseActiveOnDonate,
  subscribeCauseActive,
} from "@/lib/cause-visibility";

type CausesSubView = "programmes" | "ledger";

export function AdminCausesPanel() {
  const [subView, setSubView] = useState<CausesSubView>("programmes");
  const [rows, setRows] = useState<AdminCauseContribution[]>([]);
  const [monthTotal, setMonthTotal] = useState(0);
  const [exportNote, setExportNote] = useState<string | null>(null);
  const [programmes, setProgrammes] = useState(() => listCauseProgrammes());

  useEffect(() => {
    const refreshLedger = () => {
      setRows(loadAdminCauseContributions());
      setMonthTotal(sumAdminCausesThisMonth());
    };
    refreshLedger();
    const unsubLedger = subscribeAdminCauses(refreshLedger);
    const unsubActive = subscribeCauseActive(() =>
      setProgrammes(listCauseProgrammes())
    );
    return () => {
      unsubLedger();
      unsubActive();
    };
  }, []);

  const monthLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      }),
    []
  );

  function handleExport() {
    const result = exportCausesCsv(rows);
    setExportNote(
      result.rowCount === 0
        ? `Downloaded ${result.filename} (headers only — no rows yet).`
        : `Downloaded ${result.filename} (${result.rowCount} row${result.rowCount === 1 ? "" : "s"}).`
    );
  }

  function toggleActive(id: (typeof programmes)[number]["id"], next: boolean) {
    setCauseActiveOnDonate(id, next);
    setProgrammes(listCauseProgrammes());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-primary">
            Causes
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {subView === "programmes"
              ? "Donate catalogue programmes — toggle which appear on /donate."
              : `Contribution ledger from Donate and checkout · ${ADMIN_EXPORT_CURRENCY}.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["programmes", "Programmes"],
              ["ledger", "Ledger"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSubView(id)}
              className={`inline-flex h-10 items-center rounded-lg px-3.5 text-sm font-medium transition-colors ${
                subView === id
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-foreground/70 ring-1 ring-border hover:text-primary"
              }`}
            >
              {label}
            </button>
          ))}
          {subView === "ledger" ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 shrink-0 gap-2"
              onClick={handleExport}
            >
              <Download className="size-3.5" />
              Export CSV
            </Button>
          ) : null}
        </div>
      </div>

      {exportNote && subView === "ledger" ? (
        <p className="text-xs text-muted-foreground" role="status">
          {exportNote}
        </p>
      ) : null}

      {subView === "programmes" ? (
        <Card className="overflow-hidden border-primary/20">
          <CardHeader className="border-b border-primary/10 bg-emerald-50/40">
            <CardTitle className="font-heading flex items-center gap-2">
              <TreePine className="size-4 text-emerald-800" />
              Programmes
            </CardTitle>
            <CardDescription>
              Same catalogue as /donate (Trees, Ocean, Animals, Education,
              Climate). Off = hidden on /donate; ledger history stays.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-border/80 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Short blurb</th>
                    <th className="px-4 py-3 font-medium">Active on /donate</th>
                    <th className="px-4 py-3 font-medium">Unit note</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {programmes.map((cause) => (
                    <tr key={cause.id}>
                      <td className="px-4 py-3 font-medium text-primary">
                        {cause.name}
                      </td>
                      <td className="max-w-xs px-4 py-3 text-muted-foreground">
                        {cause.tagline}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={cause.activeOnDonate}
                          aria-label={`${cause.name} active on donate`}
                          onClick={() =>
                            toggleActive(cause.id, !cause.activeOnDonate)
                          }
                          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                            cause.activeOnDonate
                              ? "bg-emerald-700"
                              : "bg-muted"
                          }`}
                        >
                          <span
                            className={`inline-block size-5 rounded-full bg-white shadow transition-transform ${
                              cause.activeOnDonate
                                ? "translate-x-6"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {cause.activeOnDonate ? "On" : "Off"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {illustrativeUnitNote(cause)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 via-cream to-white">
            <CardContent className="flex flex-wrap items-end justify-between gap-3 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/70">
                  {monthLabel} total
                </p>
                <p className="font-heading mt-1 text-3xl font-semibold tabular-nums text-primary">
                  £{monthTotal.toFixed(2)}
                </p>
              </div>
              <p className="max-w-xs text-xs text-muted-foreground">
                Sum of recorded contribute amounts this calendar month (
                {ADMIN_EXPORT_CURRENCY}).
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
                        {row.userEmail ? ` · ${row.userEmail}` : " · guest"}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold tabular-nums text-primary">
                      £{row.amount.toFixed(2)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
