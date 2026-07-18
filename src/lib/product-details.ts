import type { SizeChart, SizeChartRow } from "@/types";

/** Standard unisex apparel conversion table (EU · UK · US) with body hints. */
export const STANDARD_APPAREL_ROWS: SizeChartRow[] = [
  { eu: "34", uk: "6", us: "2", chestCm: "80–84", waistCm: "62–66" },
  { eu: "36", uk: "8", us: "4", chestCm: "84–88", waistCm: "66–70" },
  { eu: "38", uk: "10", us: "6", chestCm: "88–92", waistCm: "70–74" },
  { eu: "40", uk: "12", us: "8", chestCm: "92–96", waistCm: "74–78" },
  { eu: "42", uk: "14", us: "10", chestCm: "96–100", waistCm: "78–82" },
  { eu: "44", uk: "16", us: "12", chestCm: "100–104", waistCm: "82–86" },
];

export const STANDARD_SIZE_CHART: SizeChart = {
  rows: STANDARD_APPAREL_ROWS,
  note: "Unisex conversion guide. Measure over undergarments; if between sizes, size up for a relaxed fit.",
};

export function apparelSizeChart(note?: string): SizeChart {
  return {
    rows: STANDARD_APPAREL_ROWS,
    note:
      note ??
      "True to size. If between sizes, size up for a relaxed fit or down for a closer fit.",
  };
}

export function outerwearSizeChart(): SizeChart {
  return apparelSizeChart(
    "Designed for layering. If you usually wear a mid-layer underneath, size up one."
  );
}

export function hasProductSpecs(p: {
  materials?: string;
  madeIn?: string;
  careNotes?: string;
  fitGuide?: string;
  dimensions?: string;
  sizeChart?: SizeChart;
  duration?: string;
  deliveryMode?: string;
  availabilityNote?: string;
  listingType?: string;
}): boolean {
  return Boolean(
    p.materials ||
      p.madeIn ||
      p.careNotes ||
      p.fitGuide ||
      p.dimensions ||
      (p.sizeChart && p.sizeChart.rows.length > 0) ||
      p.duration ||
      p.deliveryMode ||
      p.availabilityNote
  );
}

export function sizeChartHasBodyMeasures(chart: SizeChart): boolean {
  return chart.rows.some((r) => r.chestCm || r.waistCm);
}
