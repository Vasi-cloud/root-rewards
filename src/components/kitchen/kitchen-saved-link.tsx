"use client";

import { BookMarked } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  loadSavedKitchenLists,
  subscribeSavedKitchenLists,
} from "@/lib/leafy-kitchen-saved";
import { cn } from "@/lib/utils";

type KitchenSavedLinkProps = {
  className?: string;
};

export function KitchenSavedLink({ className }: KitchenSavedLinkProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const refresh = () => setCount(loadSavedKitchenLists().length);
    refresh();
    return subscribeSavedKitchenLists(refresh);
  }, []);

  return (
    <Button
      nativeButton={false}
      render={<Link href="/kitchen/saved" />}
      variant="outline"
      size="sm"
      className={cn(
        "h-9 shrink-0 gap-1.5 border-emerald-200/90 bg-white/90 px-2.5 text-emerald-950 shadow-xs transition-all hover:border-emerald-300 hover:bg-emerald-50/80 active:scale-[0.98] sm:px-3",
        className
      )}
    >
      <BookMarked className="size-3.5" />
      My Kitchen
      {count > 0 ? (
        <span className="min-w-[1.25rem] rounded-md bg-emerald-800 px-1.5 py-0.5 text-center text-[10px] font-semibold tabular-nums text-cream">
          {count}
        </span>
      ) : null}
    </Button>
  );
}
