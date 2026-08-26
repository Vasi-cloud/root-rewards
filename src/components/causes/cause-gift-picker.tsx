"use client";

import { BookOpen, Check, Leaf, PawPrint, Sun, Waves } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  CAUSE_GIFT_MIN_GBP,
  CAUSE_GIFT_PRESETS,
  CAUSES,
  clampCauseGiftGbp,
  formatCauseUnits,
  illustrativeUnitsForGift,
  type CauseGiftAmounts,
  type CauseId,
} from "@/lib/causes";
import { cn } from "@/lib/utils";

const CAUSE_ICONS = {
  trees: Leaf,
  waves: Waves,
  paw: PawPrint,
  book: BookOpen,
  sun: Sun,
} as const;

export function CauseGiftPicker({
  gifts,
  onChange,
  className,
}: {
  gifts: CauseGiftAmounts;
  onChange: (next: CauseGiftAmounts) => void;
  className?: string;
}) {
  function setGift(id: CauseId, amount: number) {
    onChange({ ...gifts, [id]: clampCauseGiftGbp(amount) });
  }

  function toggle(id: CauseId) {
    const current = Number(gifts[id]) || 0;
    if (current >= CAUSE_GIFT_MIN_GBP) {
      setGift(id, 0);
      return;
    }
    setGift(id, CAUSE_GIFT_PRESETS[0]);
  }

  return (
    <div className={cn("space-y-3", className)}>
      {CAUSES.map((cause) => {
        const Icon = CAUSE_ICONS[cause.icon];
        const amount = Number(gifts[cause.id]) || 0;
        const selected = amount >= CAUSE_GIFT_MIN_GBP;
        const units = selected
          ? illustrativeUnitsForGift(cause, amount)
          : 0;

        return (
          <div
            key={cause.id}
            className={cn(
              "rounded-2xl border transition-all",
              selected
                ? `${cause.accentClass} shadow-sm ring-2 ring-emerald-600/35`
                : "border-border/70 bg-white/80"
            )}
          >
            <button
              type="button"
              onClick={() => toggle(cause.id)}
              aria-pressed={selected}
              className="flex w-full items-start gap-3 px-3.5 py-3.5 text-left sm:px-4"
            >
              <span
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                  selected
                    ? "border-emerald-800 bg-emerald-800 text-cream"
                    : "border-emerald-300 bg-white text-transparent"
                )}
                aria-hidden
              >
                <Check className="size-3 stroke-[3]" />
              </span>
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl",
                  selected
                    ? "bg-emerald-800 text-cream"
                    : "bg-emerald-100 text-emerald-900"
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <span className="font-heading text-base font-semibold">
                    {cause.name}
                  </span>
                  {selected ? (
                    <span className="text-sm font-semibold tabular-nums">
                      £{amount.toFixed(2)}
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed opacity-90 sm:text-sm">
                  {cause.tagline}
                </span>
                {selected ? (
                  <Badge
                    variant="outline"
                    className="mt-1.5 border-current/20 text-[10px] font-normal"
                  >
                    ≈ {formatCauseUnits(cause, units)} illustrative
                  </Badge>
                ) : (
                  <span className="mt-1.5 block text-[11px] opacity-75">
                    Tap to add · £{CAUSE_GIFT_PRESETS.join(" / ")} or custom
                  </span>
                )}
              </span>
            </button>

            {selected ? (
              <div className="border-t border-current/10 px-3.5 pb-3.5 pt-3 sm:px-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] opacity-70">
                  Amount for {cause.name}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CAUSE_GIFT_PRESETS.map((preset) => {
                    const active = amount === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setGift(cause.id, preset)}
                        className={cn(
                          "min-h-11 rounded-xl border px-3 py-1.5 text-sm font-medium tabular-nums transition-colors",
                          active
                            ? "border-emerald-800 bg-emerald-800 text-cream"
                            : "border-emerald-300/80 bg-white/85 hover:bg-white"
                        )}
                      >
                        £{preset}
                      </button>
                    );
                  })}
                </div>
                <label
                  htmlFor={`cause-gift-custom-${cause.id}`}
                  className="mt-3 block text-sm font-medium"
                >
                  Custom (£{CAUSE_GIFT_MIN_GBP}+)
                </label>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <input
                    id={`cause-gift-custom-${cause.id}`}
                    type="number"
                    min={CAUSE_GIFT_MIN_GBP}
                    step="1"
                    inputMode="decimal"
                    value={amount > 0 ? String(amount) : ""}
                    onChange={(e) => {
                      const n = parseFloat(e.target.value);
                      if (e.target.value.trim() === "") {
                        setGift(cause.id, CAUSE_GIFT_PRESETS[0]);
                        return;
                      }
                      if (Number.isFinite(n)) setGift(cause.id, n);
                    }}
                    className="h-11 w-full max-w-[10rem] rounded-xl border border-input bg-background px-3 text-base tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => setGift(cause.id, 0)}
                    className="min-h-11 rounded-xl px-3 text-sm font-medium text-emerald-900/80 underline-offset-2 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
