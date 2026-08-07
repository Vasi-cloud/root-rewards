"use client";

import { Leaf, MapPin, Recycle, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

export type AskLeafyExample = {
  id: string;
  label: string;
  hint: string;
  query: string;
  budget: number;
  icon: "eco" | "local" | "materials" | "care";
};

export const ASK_LEAFY_EXAMPLES: AskLeafyExample[] = [
  {
    id: "eco",
    label: "Eco alternatives",
    hint: "Greener swaps for everyday plastic",
    query: "eco alternatives to plastic kitchen gadgets",
    budget: 40,
    icon: "eco",
  },
  {
    id: "local",
    label: "Local options",
    hint: "What can I pick up nearby?",
    query: "eco home essentials I could buy local or refill",
    budget: 50,
    icon: "local",
  },
  {
    id: "materials",
    label: "Materials",
    hint: "Natural, durable, easy to care for",
    query: "natural materials durable easy care home products",
    budget: 45,
    icon: "materials",
  },
  {
    id: "care",
    label: "Care tips",
    hint: "Self-care finds & gentle routines",
    query: "self-care beauty under £35",
    budget: 35,
    icon: "care",
  },
];

const ICONS = {
  eco: Recycle,
  local: MapPin,
  materials: Leaf,
  care: Sparkles,
} as const;

type AskLeafyExamplesProps = {
  onSelect: (example: AskLeafyExample) => void;
  className?: string;
  compact?: boolean;
};

export function AskLeafyExamples({
  onSelect,
  className,
  compact,
}: AskLeafyExamplesProps) {
  return (
    <div className={cn("space-y-2.5", className)}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800/70">
          What you can ask
        </p>
        {!compact && (
          <p className="mt-1 text-sm text-muted-foreground">
            Tap an idea to get started — or write your own question.
          </p>
        )}
      </div>
      <ul
        className={cn(
          "grid gap-2",
          compact ? "sm:grid-cols-2" : "sm:grid-cols-2"
        )}
      >
        {ASK_LEAFY_EXAMPLES.map((example) => {
          const Icon = ICONS[example.icon];
          return (
            <li key={example.id}>
              <button
                type="button"
                onClick={() => onSelect(example)}
                className="flex min-h-14 w-full items-start gap-3 rounded-xl border border-emerald-200/90 bg-white/90 px-3 py-2.5 text-left transition-all hover:border-emerald-400 hover:bg-emerald-50/80 active:scale-[0.99] sm:min-h-[3.5rem]"
              >
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-800 text-cream">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-emerald-950">
                    {example.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                    {example.hint}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
