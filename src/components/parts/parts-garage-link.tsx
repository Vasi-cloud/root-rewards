"use client";

import { Warehouse } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  loadGarageParts,
  subscribeGarage,
} from "@/lib/leafy-parts-garage";
import { cn } from "@/lib/utils";

type PartsGarageLinkProps = {
  className?: string;
  /** Compact outline control for page headers */
  variant?: "header" | "inline";
};

export function PartsGarageLink({
  className,
  variant = "header",
}: PartsGarageLinkProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const refresh = () => setCount(loadGarageParts().length);
    refresh();
    return subscribeGarage(refresh);
  }, []);

  if (variant === "inline") {
    return (
      <Button
        nativeButton={false}
        render={<Link href="/parts/garage" />}
        variant="outline"
        className={cn(
          "h-11 gap-2 border-emerald-200/90 bg-white/90 text-emerald-950 shadow-xs transition-all hover:border-emerald-300 hover:bg-emerald-50/80 active:scale-[0.98] sm:h-9",
          className
        )}
      >
        <Warehouse className="size-4" />
        My Garage
        {count > 0 ? (
          <span className="min-w-[1.25rem] rounded-md bg-emerald-800 px-1.5 py-0.5 text-center text-[10px] font-semibold tabular-nums text-cream">
            {count}
          </span>
        ) : null}
      </Button>
    );
  }

  return (
    <Button
      nativeButton={false}
      render={<Link href="/parts/garage" />}
      variant="outline"
      size="sm"
      className={cn(
        "h-9 shrink-0 gap-1.5 border-emerald-200/90 bg-white/90 px-2.5 text-emerald-950 shadow-xs transition-all hover:border-emerald-300 hover:bg-emerald-50/80 active:scale-[0.98] sm:px-3",
        className
      )}
    >
      <Warehouse className="size-3.5" />
      My Garage
      {count > 0 ? (
        <span className="min-w-[1.25rem] rounded-md bg-emerald-800 px-1.5 py-0.5 text-center text-[10px] font-semibold tabular-nums text-cream">
          {count}
        </span>
      ) : null}
    </Button>
  );
}
