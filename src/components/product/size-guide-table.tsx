import { Ruler } from "lucide-react";
import Link from "next/link";

import type { SizeChart } from "@/types";
import { sizeChartHasBodyMeasures } from "@/lib/product-details";

export function SizeGuideTable({
  chart,
  title = "Size guide · EU / UK / US",
  showReturnsLink = true,
  className = "",
}: {
  chart: SizeChart;
  title?: string;
  showReturnsLink?: boolean;
  className?: string;
}) {
  if (!chart.rows.length) return null;
  const showBody = sizeChartHasBodyMeasures(chart);

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-border/70 bg-white/80 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Ruler className="size-4 text-emerald-800" />
          {title}
        </p>
        {showReturnsLink && (
          <Link
            href="/returns#size-guide"
            className="text-xs font-medium text-primary underline-offset-2 hover:underline"
          >
            Full returns &amp; sizing
          </Link>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[18rem] text-left text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-secondary/40 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">EU</th>
              <th className="px-4 py-2.5 font-medium">UK</th>
              <th className="px-4 py-2.5 font-medium">US</th>
              {showBody && (
                <>
                  <th className="px-4 py-2.5 font-medium">Chest (cm)</th>
                  <th className="px-4 py-2.5 font-medium">Waist (cm)</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {chart.rows.map((row) => (
              <tr
                key={`${row.eu}-${row.uk}-${row.us}`}
                className="border-b border-border/40 last:border-0"
              >
                <td className="px-4 py-2.5 tabular-nums text-foreground">
                  {row.eu}
                </td>
                <td className="px-4 py-2.5 tabular-nums text-foreground">
                  {row.uk}
                </td>
                <td className="px-4 py-2.5 tabular-nums text-foreground">
                  {row.us}
                </td>
                {showBody && (
                  <>
                    <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                      {row.chestCm ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                      {row.waistCm ?? "—"}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {chart.note && (
        <p className="border-t border-border/50 px-4 py-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {chart.note}
        </p>
      )}
    </div>
  );
}
