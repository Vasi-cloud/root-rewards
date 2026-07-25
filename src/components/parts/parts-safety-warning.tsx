import { AlertTriangle, ShieldAlert } from "lucide-react";

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
        "rounded-2xl border-2 border-red-600 bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 p-3.5 shadow-md ring-2 ring-red-500/25 sm:p-5",
        className
      )}
    >
      <div className="flex gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-red-600 text-white shadow-sm">
          <ShieldAlert className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-red-800">
              Safety-critical part
            </p>
            <span className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              <AlertTriangle className="size-3" aria-hidden />
              Verify before install
            </span>
          </div>
          <p className="font-heading text-base font-semibold leading-snug text-red-950 sm:text-lg">
            {partLabel
              ? `Do not rely on photo ID alone for ${partLabel}`
              : "Do not rely on photo ID alone for this part"}
          </p>
          <p className="text-sm leading-relaxed text-red-950/90">
            {PARTS_SAFETY_WARNING}
          </p>
          <p className="rounded-xl border border-red-300/80 bg-white/85 px-3 py-2 text-sm font-medium leading-relaxed text-red-950 shadow-xs">
            Always verify fitment with a trusted mechanic or official OEM /
            parts catalogue before ordering or installing.
          </p>
        </div>
      </div>
    </aside>
  );
}
