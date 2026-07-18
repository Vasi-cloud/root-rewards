import type {
  FlagHit,
  FlagSource,
  ModerationFlag,
  ProductReport,
  ReportReason,
  ReportStatus,
  FlagStatus,
} from "@/types/moderation";

const FLAGS_KEY = "forest-buddies-moderation-flags";
const REPORTS_KEY = "forest-buddies-product-reports";
const EVENT = "forest-buddies-moderation-updated";

/** Auto-escalate to a flag after this many open reports on one product. */
export const REPORT_FLAG_THRESHOLD = 2;

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT));
  }
}

export function subscribeModeration(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    emit();
  } catch {
    // ignore quota
  }
}

export function loadFlags(): ModerationFlag[] {
  return loadJson<ModerationFlag[]>(FLAGS_KEY, []);
}

export function saveFlags(flags: ModerationFlag[]) {
  saveJson(FLAGS_KEY, flags);
}

export function loadReports(): ProductReport[] {
  return loadJson<ProductReport[]>(REPORTS_KEY, []);
}

export function saveReports(reports: ProductReport[]) {
  saveJson(REPORTS_KEY, reports);
}

export function countOpenReportsForProduct(productId: string): number {
  return loadReports().filter(
    (r) => r.productId === productId && r.status === "open"
  ).length;
}

export function countOpenReportsForSeller(sellerUid: string): number {
  return loadReports().filter(
    (r) => r.sellerUid === sellerUid && r.status === "open"
  ).length;
}

export function recordFlagHits(params: {
  hits: FlagHit[];
  productId: string;
  productName: string;
  sellerUid?: string;
  shopName?: string;
  source?: FlagSource;
}): ModerationFlag[] {
  if (params.hits.length === 0) return [];

  const existing = loadFlags();
  const now = Date.now();
  const created: ModerationFlag[] = params.hits.map((hit, index) => ({
    id: `flag-${now}-${index}`,
    ruleId: hit.ruleId,
    severity: hit.severity,
    source: params.source ?? "rule",
    message: hit.message,
    productId: params.productId,
    productName: params.productName,
    sellerUid: params.sellerUid,
    shopName: params.shopName,
    status: "open" as FlagStatus,
    createdAt: new Date().toISOString(),
  }));

  // Drop prior open rule flags for this product (fresh scan on submit/edit)
  const kept = existing.filter(
    (f) =>
      !(
        f.productId === params.productId &&
        f.status === "open" &&
        f.source === "rule"
      )
  );

  saveFlags([...created, ...kept]);
  return created;
}

export function resolveFlag(flagId: string, status: "resolved" | "dismissed") {
  const next = loadFlags().map((f) =>
    f.id === flagId
      ? { ...f, status, resolvedAt: new Date().toISOString() }
      : f
  );
  saveFlags(next);
}

export function resolveFlagsForProduct(
  productId: string,
  status: "resolved" | "dismissed" = "resolved"
) {
  const next = loadFlags().map((f) =>
    f.productId === productId && f.status === "open"
      ? { ...f, status, resolvedAt: new Date().toISOString() }
      : f
  );
  saveFlags(next);
}

export function submitProductReport(input: {
  productId: string;
  productName: string;
  sellerUid?: string;
  shopName?: string;
  reporterUid?: string;
  reason: ReportReason;
  note?: string;
}): { report: ProductReport; escalated: boolean } {
  const report: ProductReport = {
    id: `rep-${Date.now()}`,
    productId: input.productId,
    productName: input.productName,
    sellerUid: input.sellerUid,
    shopName: input.shopName,
    reporterUid: input.reporterUid,
    reason: input.reason,
    note: (input.note ?? "").trim(),
    status: "open",
    createdAt: new Date().toISOString(),
  };

  const reports = [report, ...loadReports()];
  saveReports(reports);

  const openCount = reports.filter(
    (r) => r.productId === input.productId && r.status === "open"
  ).length;

  let escalated = false;
  if (openCount >= REPORT_FLAG_THRESHOLD) {
    const flags = loadFlags();
    const already = flags.some(
      (f) =>
        f.productId === input.productId &&
        f.ruleId === "user_reports" &&
        f.status === "open"
    );
    if (!already) {
      saveFlags([
        {
          id: `flag-rep-${Date.now()}`,
          ruleId: "user_reports",
          severity: "high",
          source: "report",
          message: `${openCount} open user reports on this listing.`,
          productId: input.productId,
          productName: input.productName,
          sellerUid: input.sellerUid,
          shopName: input.shopName,
          status: "open",
          createdAt: new Date().toISOString(),
        },
        ...flags,
      ]);
      escalated = true;
    }
  }

  return { report, escalated };
}

export function setReportStatus(reportId: string, status: ReportStatus) {
  const next = loadReports().map((r) =>
    r.id === reportId
      ? {
          ...r,
          status,
          reviewedAt: status === "open" ? undefined : new Date().toISOString(),
        }
      : r
  );
  saveReports(next);
}

export function listOpenFlags(): ModerationFlag[] {
  return loadFlags().filter((f) => f.status === "open");
}

export function listOpenReports(): ProductReport[] {
  return loadReports().filter((r) => r.status === "open");
}
