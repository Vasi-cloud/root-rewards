import { AlertTriangle, Info, ShieldCheck } from "lucide-react";

import {
  PARTS_AI_DISCLAIMER,
  PARTS_COMPAT_DISCLAIMER,
  PARTS_MOCK_AI_NOTE,
} from "@/lib/leafy-parts";

export function PartsDisclaimers({ className }: { className?: string }) {
  return (
    <aside
      className={
        className ??
        "space-y-2.5 rounded-2xl border border-amber-200/90 bg-amber-50/70 p-3.5 text-sm leading-relaxed text-amber-950 shadow-xs sm:space-y-3 sm:p-5"
      }
    >
      <div className="flex gap-2.5 sm:gap-3">
        <Info className="mt-0.5 size-4 shrink-0 text-amber-800" />
        <p>
          <span className="font-semibold">Mock AI for now.</span>{" "}
          {PARTS_MOCK_AI_NOTE}
        </p>
      </div>
      <div className="flex gap-2.5 border-t border-amber-200/80 pt-2.5 sm:gap-3 sm:pt-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-800" />
        <p>
          <span className="font-semibold">AI disclaimer.</span>{" "}
          {PARTS_AI_DISCLAIMER}
        </p>
      </div>
      <div className="flex gap-2.5 border-t border-amber-200/80 pt-2.5 sm:gap-3 sm:pt-3">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-amber-800" />
        <p>
          <span className="font-semibold">Compatibility.</span>{" "}
          {PARTS_COMPAT_DISCLAIMER}
        </p>
      </div>
    </aside>
  );
}
