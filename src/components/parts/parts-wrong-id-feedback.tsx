"use client";

import { Check, MessageCircleWarning } from "lucide-react";
import { useState } from "react";

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
  const [sent, setSent] = useState(false);

  function handleReport() {
    if (sent) return;
    submitFeedback({
      category: "issue",
      message: `Leafy Parts Finder: wrong identification. Suggested “${partName}” (${kind}) for ${vehicleLabel}.`,
      pagePath: "/parts",
    });
    setSent(true);
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-white/90 px-3.5 py-3.5 sm:px-5 sm:py-4",
        className
      )}
    >
      {sent ? (
        <p
          className="flex items-start gap-2.5 text-sm leading-relaxed text-emerald-900"
          role="status"
        >
          <Check className="mt-0.5 size-4 shrink-0 text-emerald-700" />
          <span>
            Thanks — we&apos;ve noted that this identification looked wrong.
            Your feedback helps Leafy get sharper over time.
          </span>
        </p>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              Not the right part?
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Tell us if Leafy misidentified this — you can still override the
              part type above.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full shrink-0 gap-2 bg-background sm:w-auto"
            onClick={handleReport}
          >
            <MessageCircleWarning className="size-4" />
            Report wrong ID
          </Button>
        </div>
      )}
    </div>
  );
}
