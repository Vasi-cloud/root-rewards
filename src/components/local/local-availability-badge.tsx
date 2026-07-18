import { Badge } from "@/components/ui/badge";
import {
  availabilityLabel,
  type LocalAvailabilityStatus,
  type LocalProductAvailability,
} from "@/lib/local-commerce";

const STATUS_CLASS: Record<LocalAvailabilityStatus, string> = {
  in_stock: "bg-emerald-100 text-emerald-900 border-emerald-200",
  limited: "bg-amber-100 text-amber-950 border-amber-200",
  pickup_only: "bg-sky-100 text-sky-950 border-sky-200",
  out_of_stock: "bg-muted text-muted-foreground border-border",
};

export function LocalAvailabilityBadge({
  availability,
  showNote = false,
  className = "",
}: {
  availability: LocalProductAvailability;
  showNote?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex flex-col gap-0.5 ${className}`}>
      <Badge
        variant="outline"
        className={`w-fit text-xs ${STATUS_CLASS[availability.status]}`}
      >
        {availabilityLabel(availability.status)}
        {availability.qtyHint != null &&
        availability.status !== "out_of_stock"
          ? ` · ${availability.qtyHint}`
          : ""}
      </Badge>
      {showNote && (
        <span className="text-[11px] leading-snug text-muted-foreground">
          {availability.etaNote}
        </span>
      )}
    </span>
  );
}
