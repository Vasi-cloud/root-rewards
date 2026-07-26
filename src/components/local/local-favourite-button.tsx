"use client";

import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LocalFavouriteButtonProps = {
  saved: boolean;
  onToggle: () => void;
  label?: string;
  className?: string;
};

export function LocalFavouriteButton({
  saved,
  onToggle,
  label,
  className,
}: LocalFavouriteButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-pressed={saved}
      aria-label={
        label ?? (saved ? "Remove from favourites" : "Save to favourites")
      }
      title={saved ? "Saved — tap to remove" : "Save favourite"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "size-11 shrink-0 rounded-xl border-emerald-200/90 bg-white/95 shadow-sm sm:size-10",
        saved &&
          "border-rose-300/90 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800",
        className
      )}
    >
      <Heart
        className={cn("size-4", saved && "fill-current")}
        aria-hidden
      />
    </Button>
  );
}
