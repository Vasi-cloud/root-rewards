"use client";

import { Camera, ChevronDown } from "lucide-react";
import { useId, useState } from "react";

import { cn } from "@/lib/utils";

const TIPS = [
  "Use bright, even lighting — avoid strong shadows and glare.",
  "Take 2–4 photos from different angles (front, side, connectors).",
  "Fill the frame with the part; keep the background simple.",
  "Show any stamped or printed part numbers clearly and in focus.",
  "Wipe oil or dirt off labels and connectors if you safely can.",
  "Include the old part’s overall shape — springs, pads, and housings help Leafy most.",
];

export function PhotoTips({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div
      className={cn(
        "rounded-2xl border border-emerald-200/70 bg-emerald-50/50",
        className
      )}
    >
      <button
        type="button"
        className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left text-sm font-medium text-emerald-950 transition-colors hover:bg-emerald-50/80 sm:px-4"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <Camera className="size-4 shrink-0 text-emerald-800" />
        <span className="flex-1">How to take good photos</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-emerald-800/70 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div
          id={panelId}
          className="border-t border-emerald-200/70 px-3.5 pb-3.5 pt-2.5 sm:px-4 sm:pb-4"
        >
          <ul className="space-y-2 text-sm leading-relaxed text-emerald-950/85">
            {TIPS.map((tip) => (
              <li key={tip} className="flex gap-2">
                <span
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-700"
                  aria-hidden
                />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
