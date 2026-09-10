"use client";

import {
  Download,
  Flag,
  HeartHandshake,
  Store,
  TreePine,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
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
import { useModeration } from "@/contexts/moderation-context";
import { ADMIN_EXPORT_CURRENCY } from "@/lib/admin-csv";
import {
  exportCausesCsv,
  exportIncomeSummaryCsv,
  exportMembersCsv,
} from "@/lib/admin-export";
import {
  countActiveAdminMembers,
  loadAdminMembers,
  subscribeAdminMembers,
} from "@/lib/admin-members-ledger";
import {
  loadAdminCauseContributions,
  subscribeAdminCauses,
  sumAdminCausesThisMonth,
} from "@/lib/admin-causes-ledger";
import { listAllSellers, SELLERS_STORAGE_KEY } from "@/lib/seller-storage";

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="border-border/70">
      <CardContent className="flex items-start gap-3 p-4 sm:p-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-800/10 text-emerald-900">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="font-heading mt-0.5 text-2xl font-semibold tabular-nums text-primary">
            {value}
          </p>
          {hint ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export type OverviewNavigateTab =
  | "reports"
  | "members"
  | "causes"
  | "sellers";

type AdminOverviewPanelProps = {
  onNavigate: (tab: OverviewNavigateTab) => void;
};

export function AdminOverviewPanel({ onNavigate }: AdminOverviewPanelProps) {
  const { openReports } = useModeration();
  const [memberCount, setMemberCount] = useState(0);
  const [causesMonth, setCausesMonth] = useState(0);
  const [knownAccounts, setKnownAccounts] = useState(0);
  const [storeStats, setStoreStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    paused: 0,
  });
  const [exportNote, setExportNote] = useState<string | null>(null);

  const refresh = () => {
    setMemberCount(countActiveAdminMembers());
    setCausesMonth(sumAdminCausesThisMonth());
    const sellers = listAllSellers();
    const members = loadAdminMembers();
    const emails = new Set<string>();
    for (const s of sellers) {
      if (s.email?.trim()) emails.add(s.email.trim().toLowerCase());
    }
    for (const m of members) {
      if (m.email?.trim()) emails.add(m.email.trim().toLowerCase());
    }
    setKnownAccounts(emails.size);
    setStoreStats({
      total: sellers.length,
      pending: sellers.filter((s) => s.status === "pending").length,
      approved: sellers.filter((s) => s.status === "approved").length,
      paused: sellers.filter((s) => s.status === "paused").length,
    });
  };

  useEffect(() => {
    refresh();
    const unsubM = subscribeAdminMembers(refresh);
    const unsubC = subscribeAdminCauses(refresh);
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key !== SELLERS_STORAGE_KEY) return;
      refresh();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("forest-buddies-sellers-updated", refresh);
    return () => {
      unsubM();
      unsubC();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("forest-buddies-sellers-updated", refresh);
    };
  }, []);

  const links = useMemo(
    () =>
      [
        {
          id: "sellers" as const,
          label: "Stores",
          description: "Seller shops table",
          count: storeStats.total,
        },
        {
          id: "reports" as const,
          label: "Reports",
          description: "Listing reports inbox",
          count: openReports.length,
        },
        {
          id: "members" as const,
          label: "Members",
          description: "Impact memberships",
          count: memberCount,
        },
        {
          id: "causes" as const,
          label: "Causes",
          description: "Tree & cause ledger",
          count: loadAdminCauseContributions().length,
        },
      ] as const,
    [openReports.length, memberCount, storeStats.total]
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-primary">
            Overview
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Lean admin snapshot — zeros are fine until real activity lands.
            CSV exports use {ADMIN_EXPORT_CURRENCY}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 gap-2 sm:h-9"
            onClick={() => {
              const r = exportCausesCsv();
              setExportNote(
                r.rowCount === 0
                  ? `Causes CSV: headers only (${r.filename}).`
                  : `Causes CSV: ${r.rowCount} rows (${r.filename}).`
              );
            }}
          >
            <Download className="size-3.5" />
            Export causes
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 gap-2 sm:h-9"
            onClick={() => {
              const r = exportMembersCsv();
              setExportNote(
                r.rowCount === 0
                  ? `Members CSV: headers only (${r.filename}).`
                  : `Members CSV: ${r.rowCount} rows (${r.filename}).`
              );
            }}
          >
            <Download className="size-3.5" />
            Export members
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-11 gap-2 sm:h-9"
            onClick={() => {
              const r = exportIncomeSummaryCsv();
              setExportNote(
                r.rowCount === 0
                  ? `Income summary: headers only (${r.filename}).`
                  : `Income summary: ${r.rowCount} rows (${r.filename}).`
              );
            }}
          >
            <Download className="size-3.5" />
            Income summary
          </Button>
        </div>
      </div>

      {exportNote ? (
        <p className="text-xs text-muted-foreground" role="status">
          {exportNote}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatTile
          icon={Store}
          label="Stores"
          value={String(storeStats.total)}
          hint={`${storeStats.pending} awaiting · ${storeStats.approved} approved · ${storeStats.paused} paused`}
        />
        <StatTile
          icon={Users}
          label="Known accounts"
          value={String(knownAccounts)}
          hint="Firebase accounts visible to admin"
        />
        <StatTile
          icon={HeartHandshake}
          label="Active members"
          value={String(memberCount)}
          hint="Impact Member (ledger)"
        />
        <StatTile
          icon={Flag}
          label="New listing reports"
          value={String(openReports.length)}
          hint="Awaiting review"
        />
        <StatTile
          icon={TreePine}
          label="Causes this month"
          value={`£${causesMonth.toFixed(2)}`}
          hint={`Donate + checkout · ${ADMIN_EXPORT_CURRENCY}`}
        />
      </div>

      <Card className="border-primary/15">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-lg">Quick links</CardTitle>
          <CardDescription>
            Jump to Stores, Reports, Members, or the causes ledger.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {links.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => onNavigate(link.id)}
              className="flex min-h-14 flex-col items-start rounded-xl border border-border/70 bg-white/80 px-3.5 py-3 text-left transition-colors hover:border-emerald-300 hover:bg-emerald-50/50"
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="font-medium text-primary">{link.label}</span>
                <Badge variant="secondary" className="tabular-nums">
                  {link.count}
                </Badge>
              </span>
              <span className="mt-0.5 text-xs text-muted-foreground">
                {link.description}
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Prefer a focused reports page?{" "}
        <Link
          href="/admin/reports"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          Open /admin/reports
        </Link>
        .
      </p>
    </div>
  );
}
