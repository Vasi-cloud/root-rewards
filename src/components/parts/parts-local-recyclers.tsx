import { ArrowRight, Recycle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { partsLocalHref } from "@/lib/local-commerce";
import { cn } from "@/lib/utils";

type PartsLocalRecyclersProps = {
  partName?: string;
  className?: string;
};

/**
 * Compact eco alternative — deep-links Buy Local with a parts/recycler context.
 */
export function PartsLocalRecyclers({
  partName,
  className,
}: PartsLocalRecyclersProps) {
  return (
    <aside
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-dashed border-emerald-300/80 bg-emerald-50/50 px-3.5 py-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-4",
        className
      )}
    >
      <div className="flex min-w-0 gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-800/90 text-cream shadow-sm">
          <Recycle className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-emerald-950">
            Prefer local? Try recyclers & breakers
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-emerald-900/80 sm:text-sm">
            A tested part nearby often beats shipping new stock
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
        render={<Link href={partsLocalHref(partName)} />}
        variant="outline"
        className="h-11 w-full shrink-0 gap-2 border-emerald-300/90 bg-white/95 text-emerald-950 transition-all hover:border-emerald-400 active:scale-[0.98] sm:h-10 sm:w-auto"
      >
        Find local recyclers
        <ArrowRight className="size-3.5 opacity-70" />
      </Button>
    </aside>
  );
}
