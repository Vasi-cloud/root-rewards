import { ArrowRight, Recycle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PartsLocalRecyclersProps = {
  partName?: string;
  className?: string;
};

/**
 * Lightweight eco alternative CTA — links to Buy Local for now;
 * later can deep-link to breakers / recycler search.
 */
export function PartsLocalRecyclers({
  partName,
  className,
}: PartsLocalRecyclersProps) {
  // Placeholder: Buy Local for now; later can deep-link to breakers search.
  const href = "/local";

  return (
    <aside
      className={cn(
        "rounded-2xl border border-emerald-200/80 bg-white/90 p-3.5 sm:p-5",
        className
      )}
    >
      <div className="flex gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-cream shadow-sm">
          <Recycle className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800/70">
            Eco alternative
          </p>
          <h3 className="font-heading mt-0.5 text-base font-semibold text-foreground sm:text-lg">
            Check local recyclers & breakers yards
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            A used part from a local yard often has a lower footprint than
            shipping new stock — and keeps good components in service longer.
            {partName ? (
              <>
                {" "}
                Ask for a tested{" "}
                <span className="font-medium text-foreground">{partName}</span>{" "}
                for your vehicle.
              </>
            ) : null}
          </p>
          <Button
            nativeButton={false}
            render={<Link href={href} />}
            variant="outline"
            className="mt-3.5 h-10 w-full gap-2 bg-emerald-50/60 hover:border-emerald-300 sm:w-auto"
          >
            Find local recyclers
            <ArrowRight className="size-3.5 opacity-70" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
