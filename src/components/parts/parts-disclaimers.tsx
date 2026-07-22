import { AlertTriangle, ShieldCheck } from "lucide-react";

import {
  PARTS_AI_DISCLAIMER,
  PARTS_COMPAT_DISCLAIMER,
} from "@/lib/leafy-parts";

export function PartsDisclaimers({ className }: { className?: string }) {
  return (
    <aside
      className={
        className ??
        "space-y-3 rounded-2xl border border-amber-200/90 bg-amber-50/70 p-4 text-sm text-amber-950 sm:p-5"
      }
    >
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-800" />
        <p>
          <span className="font-semibold">AI identification disclaimer.</span>{" "}
          {PARTS_AI_DISCLAIMER}
        </p>
      </div>
      <div className="flex gap-3 border-t border-amber-200/80 pt-3">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-amber-800" />
        <p>
          <span className="font-semibold">Compatibility check.</span>{" "}
          {PARTS_COMPAT_DISCLAIMER}
        </p>
      </div>
    </aside>
  );
}
