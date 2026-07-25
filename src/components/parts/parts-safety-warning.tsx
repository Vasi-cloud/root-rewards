import { AlertTriangle } from "lucide-react";

import { PARTS_SAFETY_WARNING } from "@/lib/leafy-parts";
import { cn } from "@/lib/utils";

type PartsSafetyWarningProps = {
  partLabel?: string;
  className?: string;
};

export function PartsSafetyWarning({
  partLabel,
  className,
}: PartsSafetyWarningProps) {
  return (
    <aside
      role="alert"
      className={cn(
        "rounded-2xl border-2 border-amber-500/80 bg-gradient-to-br from-amber-50 via-orange-50/80 to-amber-50 p-3.5 shadow-sm sm:p-5",
        className
      )}
    >
      <div className="flex gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-600 text-white shadow-sm">
          <AlertTriangle className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-900/80">
            Safety-critical fitment
          </p>
          <p className="font-heading text-base font-semibold leading-snug text-amber-950 sm:text-lg">
            {partLabel
              ? `Double-check ${partLabel} before you buy or install`
              : "Double-check this part before you buy or install"}
          </p>
          <p className="text-sm leading-relaxed text-amber-950/90">
            {PARTS_SAFETY_WARNING}
          </p>
          <p className="text-xs leading-relaxed font-medium text-amber-900/85">
            Confirm with a mechanic or official OEM / parts sources — not photo
            ID alone.
          </p>
        </div>
      </div>
    </aside>
  );
}
