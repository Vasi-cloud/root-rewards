import { ArrowRight, Recycle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PartsLocalRecyclersProps = {
  partName?: string;
  className?: string;
};

/**
 * Compact eco alternative — Buy Local for now; later can deep-link breakers search.
 */
export function PartsLocalRecyclers({
  partName,
  className,
}: PartsLocalRecyclersProps) {
  return (
    <aside
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-dashed border-emerald-300/80 bg-emerald-50/40 px-3.5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-4",
        className
      )}
    >
      <div className="flex min-w-0 gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-800/90 text-cream">
          <Recycle className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-emerald-950">
            Prefer local? Try recyclers & breakers yards
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-emerald-900/80 sm:text-sm">
            Reusing a tested part nearby usually beats shipping new stock
            {partName ? (
              <>
                {" "}
                — ask for a{" "}
                <span className="font-medium text-emerald-950">{partName}</span>
              </>
            ) : null}
            . Lower footprint, less waste.
          </p>
        </div>
      </div>
      <Button
        nativeButton={false}
        render={<Link href="/local" />}
        variant="outline"
        className="h-10 w-full shrink-0 gap-2 border-emerald-300/90 bg-white/90 text-emerald-950 hover:border-emerald-400 sm:w-auto"
      >
        Find local recyclers
        <ArrowRight className="size-3.5 opacity-70" />
      </Button>
    </aside>
  );
}
