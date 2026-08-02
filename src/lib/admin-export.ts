/**
 * Accountant-friendly CSV builders for Admin ledgers.
 */

import {
  loadAdminCauseContributions,
  type AdminCauseContribution,
} from "@/lib/admin-causes-ledger";
import {
  ADMIN_EXPORT_CURRENCY,
  downloadCsv,
  stampFilename,
  toCsv,
} from "@/lib/admin-csv";
import {
  loadAdminMembers,
  type AdminMemberRecord,
} from "@/lib/admin-members-ledger";

function isoDate(iso: string): string {
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return iso.slice(0, 10);
  }
}

export function buildCausesCsv(
  rows: AdminCauseContribution[] = loadAdminCauseContributions()
): string {
  const headers = [
    "date",
    "cause",
    "amount",
    "currency",
    "source",
    "status",
    "userEmail",
    "referenceId",
  ];
  const data = rows.map((r) => [
    isoDate(r.createdAt),
    r.causeName,
    r.amount.toFixed(2),
    ADMIN_EXPORT_CURRENCY,
    r.source,
    r.status,
    r.userEmail?.trim() || "guest",
    r.id || r.batchId || "",
  ]);
  return toCsv(headers, data);
}

export function exportCausesCsv(
  rows?: AdminCauseContribution[]
): { ok: true; filename: string; rowCount: number } {
  const list = rows ?? loadAdminCauseContributions();
  const filename = stampFilename("forest-buddies-causes");
  downloadCsv(filename, buildCausesCsv(list));
  return { ok: true, filename, rowCount: list.length };
}

export function buildMembersCsv(
  rows: AdminMemberRecord[] = loadAdminMembers()
): string {
  const headers = [
    "startDate",
    "emailOrName",
    "amount",
    "currency",
    "status",
    "plan",
  ];
  const data = rows.map((m) => [
    isoDate(m.startedAt),
    m.email?.trim() || m.displayName?.trim() || "guest",
    m.amountMonthly.toFixed(2),
    ADMIN_EXPORT_CURRENCY,
    m.status,
    "monthly",
  ]);
  return toCsv(headers, data);
}

export function exportMembersCsv(
  rows?: AdminMemberRecord[]
): { ok: true; filename: string; rowCount: number } {
  const list = rows ?? loadAdminMembers();
  const filename = stampFilename("forest-buddies-members");
  downloadCsv(filename, buildMembersCsv(list));
  return { ok: true, filename, rowCount: list.length };
}

/** Combined income-style rows from members + causes (v1 optional). */
export function buildIncomeSummaryCsv(): string {
  const headers = [
    "date",
    "type",
    "amount",
    "currency",
    "source",
    "referenceId",
  ];
  const rows: Array<Array<string | number>> = [];

  for (const m of loadAdminMembers()) {
    rows.push([
      isoDate(m.startedAt),
      "membership",
      m.amountMonthly.toFixed(2),
      ADMIN_EXPORT_CURRENCY,
      "membership",
      m.id,
    ]);
  }
  for (const c of loadAdminCauseContributions()) {
    rows.push([
      isoDate(c.createdAt),
      "cause",
      c.amount.toFixed(2),
      ADMIN_EXPORT_CURRENCY,
      c.source,
      c.id,
    ]);
  }

  rows.sort((a, b) => String(b[0]).localeCompare(String(a[0])));
  return toCsv(headers, rows);
}

export function exportIncomeSummaryCsv(): {
  ok: true;
  filename: string;
  rowCount: number;
} {
  const csv = buildIncomeSummaryCsv();
  const rowCount = Math.max(0, csv.trim().split(/\r?\n/).length - 1);
  const filename = stampFilename("forest-buddies-income-summary");
  downloadCsv(filename, csv);
  return { ok: true, filename, rowCount };
}
