"use client";

import { ExternalLink, Flag } from "lucide-react";
import Link from "next/link";

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
import {
  REPORT_REASON_LABELS,
  REPORT_STATUS_LABELS,
  formatReportReporter,
  type ReportStatus,
} from "@/types/moderation";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: ReportStatus[] = ["new", "reviewed", "resolved"];

function statusBadgeClass(status: ReportStatus) {
  if (status === "new") return "bg-amber-100 text-amber-950";
  if (status === "reviewed") return "bg-sky-100 text-sky-950";
  return "bg-emerald-100 text-emerald-950";
}

/**
 * Admin-only listing reports queue — not shown on public marketplace.
 */
export function AdminReportsPanel({
  className,
  showHeader = true,
}: {
  className?: string;
  showHeader?: boolean;
}) {
  const { reports, setReportStatus, openReports } = useModeration();

  return (
    <div className={cn("space-y-6", className)}>
      {showHeader ? (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl font-semibold text-primary">
              Listing reports
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Shopper “Report listing” submissions — newest first. Not visible
              on the public marketplace.
            </p>
          </div>
          {openReports.length > 0 ? (
            <Badge className="bg-amber-100 font-normal text-amber-950">
              {openReports.length} new
            </Badge>
          ) : null}
        </div>
      ) : null}

      <Card className="overflow-hidden border-primary/20">
        <CardHeader className="border-b border-primary/10 bg-emerald-50/40">
          <CardTitle className="font-heading flex items-center gap-2">
            <Flag className="size-4 text-emerald-800" />
            Reports inbox
          </CardTitle>
          <CardDescription>
            Product, reason, details, reporter, and status. Link opens the
            marketplace (search by product name if needed).
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {reports.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-muted-foreground">
              No reports yet.
            </p>
          ) : (
            reports.map((report) => {
              const details =
                report.note.trim().length > 120
                  ? `${report.note.trim().slice(0, 117)}…`
                  : report.note.trim();
              return (
                <div
                  key={report.id}
                  className="flex flex-col gap-3 px-4 py-4 sm:px-5 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">
                        {report.productName}
                      </span>
                      <Badge className={statusBadgeClass(report.status)}>
                        {REPORT_STATUS_LABELS[report.status]}
                      </Badge>
                      <Badge variant="outline">
                        {REPORT_REASON_LABELS[report.reason]}
                      </Badge>
                    </div>
                    {details ? (
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {details}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground/80">
                        No details provided.
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(report.createdAt).toLocaleString()} · Reporter:{" "}
                      {formatReportReporter(report)}
                      {report.shopName ? ` · ${report.shopName}` : ""}
                      {" · "}
                      <span className="tabular-nums">id {report.productId}</span>
                    </p>
                    <Button
                      nativeButton={false}
                      render={
                        <Link
                          href={`/marketplace?product=${encodeURIComponent(report.productId)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      }
                      variant="outline"
                      size="sm"
                      className="mt-1 h-9 gap-1.5"
                    >
                      View product
                      <ExternalLink className="size-3.5 opacity-70" />
                    </Button>
                  </div>
                  <div className="shrink-0">
                    <label
                      htmlFor={`report-status-${report.id}`}
                      className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      Status
                    </label>
                    <select
                      id={`report-status-${report.id}`}
                      value={report.status}
                      onChange={(e) =>
                        setReportStatus(
                          report.id,
                          e.target.value as ReportStatus
                        )
                      }
                      className="h-10 w-full min-w-[9.5rem] rounded-lg border border-input bg-background px-2.5 text-sm sm:h-9"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {REPORT_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
