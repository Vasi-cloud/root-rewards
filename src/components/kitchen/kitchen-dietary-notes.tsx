import { AlertTriangle, Info, ShieldAlert } from "lucide-react";

import type { DietaryNote } from "@/lib/leafy-kitchen";
import { cn } from "@/lib/utils";

type KitchenDietaryNotesProps = {
  notes: DietaryNote[];
  className?: string;
};

export function KitchenDietaryNotes({
  notes,
  className,
}: KitchenDietaryNotesProps) {
  if (notes.length === 0) return null;

  const warnings = notes.filter((n) => n.tone === "warning");
  const infos = notes.filter((n) => n.tone === "info");

  return (
    <aside
      className={cn(
        "rounded-2xl border border-amber-200/90 bg-amber-50/80 p-3.5 shadow-xs sm:p-4",
        className
      )}
      aria-label="Allergen and dietary notes"
    >
      <div className="flex items-start gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-600/15 text-amber-900">
          <ShieldAlert className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-950">
            Allergen & dietary notes
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-amber-900/80">
            Inferred from your list — helpful, not a medical check. Always read
            packaging.
          </p>
        </div>
      </div>

      {warnings.length > 0 && (
        <ul className="mt-3 space-y-2">
          {warnings.map((note) => (
            <li
              key={note.id}
              className="flex gap-2 rounded-xl border border-amber-200/80 bg-white/70 px-2.5 py-2"
            >
              <AlertTriangle
                className="mt-0.5 size-3.5 shrink-0 text-amber-800"
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-amber-950">
                  {note.label}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-amber-900/85">
                  {note.detail}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {infos.length > 0 && (
        <ul className={cn("space-y-1.5", warnings.length > 0 ? "mt-2.5" : "mt-3")}>
          {infos.map((note) => (
            <li key={note.id} className="flex gap-2 text-xs leading-relaxed text-amber-900/85">
              <Info className="mt-0.5 size-3.5 shrink-0 text-amber-800/80" aria-hidden />
              <span>
                <span className="font-medium text-amber-950">{note.label}.</span>{" "}
                {note.detail}
              </span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
