"use client";

import { Flag } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useModeration } from "@/contexts/moderation-context";
import { consumeRateLimit } from "@/lib/rate-limit";
import { validateMessage } from "@/lib/validation";
import {
  REPORT_REASON_LABELS,
  type ReportReason,
} from "@/types/moderation";

const REASONS = Object.keys(REPORT_REASON_LABELS) as ReportReason[];

export function ReportProductButton({
  productId,
  productName,
  sellerUid,
  shopName,
  compact,
}: {
  productId: string;
  productName: string;
  sellerUid?: string;
  shopName?: string;
  compact?: boolean;
}) {
  const { user } = useAuth();
  const { submitReport } = useModeration();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("misleading_eco");
  const [note, setNote] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!REASONS.includes(reason)) {
      setError("Choose a valid report reason.");
      return;
    }
    const noteResult = validateMessage(note, {
      required: false,
      min: 0,
      max: 1000,
      label: "Details",
    });
    if (!noteResult.ok) {
      setError(noteResult.error);
      return;
    }

    const rate = consumeRateLimit("report");
    if (!rate.allowed) {
      setError(rate.message);
      return;
    }

    const { escalated } = submitReport({
      productId,
      productName,
      sellerUid,
      shopName,
      reporterUid: user?.uid,
      reason,
      note: noteResult.value,
    });
    setDone(
      escalated
        ? "Thanks — this listing was escalated for admin review."
        : "Thanks — your report was sent to our moderation queue."
    );
    setNote("");
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={`gap-1 text-muted-foreground hover:text-destructive ${
          compact ? "h-8 px-2" : ""
        }`}
        onClick={() => {
          setDone(null);
          setOpen(true);
        }}
        aria-label={`Report ${productName}`}
      >
        <Flag className="size-3.5" />
        {!compact && <span className="text-xs">Report</span>}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/20 p-3 sm:items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`report-${productId}`}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-border bg-cream p-5 shadow-lg sm:rounded-2xl"
          >
            <h3
              id={`report-${productId}`}
              className="font-heading text-lg font-semibold text-primary"
            >
              Report listing
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Help keep Forest Buddies trustworthy. Reports are reviewed by
              admins.
            </p>

            {done ? (
              <div className="mt-4 space-y-4">
                <p className="rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-900">
                  {done}
                </p>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => setOpen(false)}
                >
                  Close
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Reason
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value as ReportReason)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    {REASONS.map((r) => (
                      <option key={r} value={r}>
                        {REPORT_REASON_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Details (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="What looked off about this product?"
                    maxLength={1000}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-base"
                  />
                </div>
                {error && (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 gap-1.5">
                    <Flag className="size-3.5" />
                    Submit report
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
