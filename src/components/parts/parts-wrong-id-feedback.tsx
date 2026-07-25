"use client";

import { Check, Loader2, MessageCircleWarning } from "lucide-react";
import { useState } from "react";

import { useAppToast } from "@/components/ui/app-toast";
import { Button } from "@/components/ui/button";
import { submitFeedback } from "@/lib/feedback-storage";
import { cn } from "@/lib/utils";

type PartsWrongIdFeedbackProps = {
  partName: string;
  vehicleLabel: string;
  kind: string;
  className?: string;
};

export function PartsWrongIdFeedback({
  partName,
  vehicleLabel,
  kind,
  className,
}: PartsWrongIdFeedbackProps) {
  const { showSuccess } = useAppToast();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleReport() {
    if (sent || sending) return;
    setSending(true);
    submitFeedback({
      category: "issue",
      message: `Leafy Parts Finder: wrong identification. Suggested “${partName}” (${kind}) for ${vehicleLabel}.`,
      pagePath: "/parts",
    });
    await new Promise((r) => window.setTimeout(r, 380));
    setSending(false);
    setSent(true);
    showSuccess(
      "Feedback sent",
      "Thanks — we've noted this ID looked wrong."
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-white/95 px-3.5 py-3.5 shadow-sm sm:px-5 sm:py-4",
        className
      )}
    >
      {sent ? (
        <p
          className="flex items-start gap-2.5 animate-[fb-fade-up_0.3s_ease-out] text-sm leading-relaxed text-emerald-900"
          role="status"
        >
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Check className="size-3.5" />
          </span>
          <span>
            Thanks — we&apos;ve noted this ID looked wrong. Your feedback helps
            Leafy improve.
          </span>
        </p>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              Not the right part?
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Report a mis-ID — you can still override the part type above.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full shrink-0 gap-2 bg-background transition-all active:scale-[0.98] sm:w-auto"
            onClick={() => void handleReport()}
            disabled={sending}
          >
            {sending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <MessageCircleWarning className="size-4" />
                Report wrong ID
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
