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
import type { AdminStripeMember } from "@/lib/admin-stripe-members";
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

/** Legacy device ledger CSV — prefer buildStripeMembersCsv. */
export function buildMembersCsv(
  rows: AdminMemberRecord[] = loadAdminMembers()
): string {
  const headers = [
    "startDate",
    "email",
    "amount",
    "currency",
    "status",
    "plan",
    "periodEnd",
  ];
  const data = rows.map((m) => [
    isoDate(m.startedAt),
    m.email?.trim() || m.stripeCustomerId || "email missing",
    m.amountMonthly.toFixed(2),
    ADMIN_EXPORT_CURRENCY,
    m.status,
    "Impact Member",
    "",
  ]);
  return toCsv(headers, data);
}

export function buildStripeMembersCsv(rows: AdminStripeMember[]): string {
  const headers = [
    "startDate",
    "email",
    "customerId",
    "amount",
    "currency",
    "status",
    "plan",
    "periodEnd",
    "subscriptionId",
  ];
  const data = rows.map((m) => [
    isoDate(m.startedAt),
    m.email?.trim() || "email missing in Stripe",
    m.customerId,
    m.amountMonthly.toFixed(2),
    ADMIN_EXPORT_CURRENCY,
    m.status,
    m.plan,
    m.periodEndsAt ? isoDate(m.periodEndsAt) : "",
    m.subscriptionId,
  ]);
  return toCsv(headers, data);
}

export function exportStripeMembersCsv(
  rows: AdminStripeMember[]
): { ok: true; filename: string; rowCount: number } {
  const filename = stampFilename("forest-buddies-members");
  downloadCsv(filename, buildStripeMembersCsv(rows));
  return { ok: true, filename, rowCount: rows.length };
}

/** Legacy — prefer exportStripeMembersCsv with Stripe rows. */
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
