"use client";

import { Camera, ChevronDown } from "lucide-react";
import { useId, useState } from "react";

import { cn } from "@/lib/utils";

const QUICK_HINT =
  "Bright light · several angles · clear part numbers · steady, sharp shots";

const TIPS: { title: string; detail: string }[] = [
  {
    title: "Good lighting",
    detail:
      "Shoot in bright, even light. Avoid harsh shadows, flash glare on metal, and dim garage corners.",
  },
  {
    title: "Multiple angles",
    detail:
      "Take 2–4 photos: overall shape, side view, connectors / plugs, and any mounting points.",
  },
  {
    title: "Show connectors & numbers",
    detail:
      "Get close so stamped or printed OEM numbers, barcodes, and electrical connectors are sharp and readable. You can also add a separate optional part-number photo below.",
  },
  {
    title: "Clean if you can",
    detail:
      "Wipe oil, grease, or dirt off labels and connector faces when it’s safe — cleaner surfaces match better.",
  },
  {
    title: "Avoid blur",
    detail:
      "Hold steady or rest your phone; wait for focus. Blurry photos are the most common miss.",
  },
  {
    title: "Simple background",
    detail:
      "Fill the frame with the part on a plain surface. Keep other tools and clutter out of shot.",
  },
];

type PhotoTipsProps = {
  className?: string;
  /** Start expanded (default false — keeps the form tidy) */
  defaultOpen?: boolean;
};

export function PhotoTips({ className, defaultOpen = false }: PhotoTipsProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-cream/40 to-white",
        className
      )}
    >
      <button
        type="button"
        className="flex w-full items-start gap-2.5 px-3.5 py-3 text-left transition-colors hover:bg-emerald-50/70 sm:items-center sm:px-4"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-cream sm:mt-0">
          <Camera className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-emerald-950">
            How to take good photos
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-emerald-900/75">
            {QUICK_HINT}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "mt-1 size-4 shrink-0 text-emerald-800/70 transition-transform duration-200 sm:mt-0",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div
          id={panelId}
          className="border-t border-emerald-200/70 px-3.5 pb-3.5 pt-1 sm:px-4 sm:pb-4"
        >
          <ul className="divide-y divide-emerald-100/90">
            {TIPS.map((tip) => (
              <li key={tip.title} className="py-2.5 first:pt-2 last:pb-0">
                <p className="text-sm font-medium text-emerald-950">
                  {tip.title}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-emerald-950/80">
                  {tip.detail}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
