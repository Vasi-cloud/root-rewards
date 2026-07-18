"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  loadFlags,
  loadReports,
  resolveFlag,
  setReportStatus,
  submitProductReport,
  subscribeModeration,
} from "@/lib/moderation";
import type {
  ModerationFlag,
  ProductReport,
  ReportReason,
  ReportStatus,
} from "@/types/moderation";

interface ModerationContextValue {
  flags: ModerationFlag[];
  reports: ProductReport[];
  openFlags: ModerationFlag[];
  openReports: ProductReport[];
  refresh: () => void;
  submitReport: (input: {
    productId: string;
    productName: string;
    sellerUid?: string;
    shopName?: string;
    reporterUid?: string;
    reason: ReportReason;
    note?: string;
  }) => { escalated: boolean };
  resolveFlag: (flagId: string, status: "resolved" | "dismissed") => void;
  setReportStatus: (reportId: string, status: ReportStatus) => void;
}

const ModerationContext = createContext<ModerationContextValue | undefined>(
  undefined
);

export function ModerationProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState<ModerationFlag[]>([]);
  const [reports, setReports] = useState<ProductReport[]>([]);

  const refresh = useCallback(() => {
    setFlags(loadFlags());
    setReports(loadReports());
  }, []);

  useEffect(() => {
    refresh();
    return subscribeModeration(refresh);
  }, [refresh]);

  const submitReport = useCallback(
    (input: {
      productId: string;
      productName: string;
      sellerUid?: string;
      shopName?: string;
      reporterUid?: string;
      reason: ReportReason;
      note?: string;
    }) => {
      const { escalated } = submitProductReport(input);
      refresh();
      return { escalated };
    },
    [refresh]
  );

  const resolveFlagFn = useCallback(
    (flagId: string, status: "resolved" | "dismissed") => {
      resolveFlag(flagId, status);
      refresh();
    },
    [refresh]
  );

  const setReportStatusFn = useCallback(
    (reportId: string, status: ReportStatus) => {
      setReportStatus(reportId, status);
      refresh();
    },
    [refresh]
  );

  const value = useMemo(
    () => ({
      flags,
      reports,
      openFlags: flags.filter((f) => f.status === "open"),
      openReports: reports.filter((r) => r.status === "open"),
      refresh,
      submitReport,
      resolveFlag: resolveFlagFn,
      setReportStatus: setReportStatusFn,
    }),
    [
      flags,
      reports,
      refresh,
      submitReport,
      resolveFlagFn,
      setReportStatusFn,
    ]
  );

  return (
    <ModerationContext.Provider value={value}>
      {children}
    </ModerationContext.Provider>
  );
}

export function useModeration() {
  const ctx = useContext(ModerationContext);
  if (!ctx) {
    throw new Error("useModeration must be used within a ModerationProvider");
  }
  return ctx;
}
