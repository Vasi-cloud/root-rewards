import {
  craftVisionPicks,
  productsByIds,
} from "@/lib/vision/catalog-match";
import type {
  VisionEngine,
  VisionLabel,
  VisionResult,
} from "@/lib/vision/types";

export type { VisionEngine, VisionLabel, VisionResult };

/**
 * Mock vision agent — classify via filename + optional note.
 * Live path: POST /api/vision/analyze → Grok Vision when XAI_API_KEY is set.
 */

type Cue = {
  tokens: string[];
  labels: string[];
  productIds: string[];
  category: string;
};

const VISION_CUES: Cue[] = [
  {
    tokens: ["tote", "bag", "market", "canvas", "shopping"],
    labels: ["tote bag", "canvas", "accessories"],
    productIds: ["1", "4"],
    category: "Accessories",
  },
  {
    tokens: ["cutlery", "utensil", "fork", "spoon", "chopsticks", "bamboo"],
    labels: ["utensils", "bamboo", "kitchen"],
    productIds: ["2"],
    category: "Kitchen",
  },
  {
    tokens: ["cleaner", "spray", "glass", "refill", "cleaning"],
    labels: ["cleaner bottle", "home care"],
    productIds: ["3"],
    category: "Home",
  },
  {
    tokens: ["backpack", "rucksack", "pack", "schoolbag"],
    labels: ["backpack", "hemp canvas"],
    productIds: ["4", "17"],
    category: "Apparel",
  },
  {
    tokens: ["wrap", "beeswax", "cheese", "foodwrap"],
    labels: ["food wrap", "beeswax"],
    productIds: ["5"],
    category: "Kitchen",
  },
  {
    tokens: ["notebook", "journal", "paper", "stationery", "sketch"],
    labels: ["notebook", "stationery"],
    productIds: ["6", "13"],
    category: "Stationery",
  },
  {
    tokens: ["balm", "lip", "tin", "chapstick"],
    labels: ["lip balm", "beauty tin"],
    productIds: ["7", "15"],
    category: "Beauty",
  },
  {
    tokens: ["lantern", "solar", "lamp", "light", "camping"],
    labels: ["lantern", "solar gear"],
    productIds: ["8", "17"],
    category: "Home",
  },
  {
    tokens: ["bottle", "flask", "water", "drink", "thermos"],
    labels: ["water bottle", "insulated"],
    productIds: ["9", "1"],
    category: "Kitchen",
  },
  {
    tokens: ["toothbrush", "brush", "dental", "teeth"],
    labels: ["toothbrush", "bamboo"],
    productIds: ["10", "15"],
    category: "Beauty",
  },
  {
    tokens: ["shirt", "tee", "tshirt", "t-shirt", "hemp", "apparel"],
    labels: ["t-shirt", "apparel"],
    productIds: ["11", "17"],
    category: "Apparel",
  },
  {
    tokens: ["candle", "wax", "soy", "scent"],
    labels: ["candle", "home fragrance"],
    productIds: ["12"],
    category: "Home",
  },
  {
    tokens: ["card", "greeting", "seed", "postcard", "envelope"],
    labels: ["greeting card", "seed paper"],
    productIds: ["13", "6"],
    category: "Stationery",
  },
  {
    tokens: ["skillet", "pan", "cast", "iron", "cookware"],
    labels: ["cast iron", "cookware"],
    productIds: ["14", "2"],
    category: "Kitchen",
  },
  {
    tokens: ["round", "pad", "cotton", "facial", "makeup"],
    labels: ["cotton rounds", "beauty"],
    productIds: ["15", "7"],
    category: "Beauty",
  },
  {
    tokens: ["dryer", "wool", "laundry", "ball"],
    labels: ["dryer balls", "laundry"],
    productIds: ["16", "3"],
    category: "Home",
  },
  {
    tokens: ["jacket", "rain", "coat", "shell", "waterproof"],
    labels: ["rain jacket", "outerwear"],
    productIds: ["17", "4"],
    category: "Apparel",
  },
  {
    tokens: ["jar", "storage", "glassware", "container", "pantry"],
    labels: ["storage jars", "glass"],
    productIds: ["18", "5"],
    category: "Kitchen",
  },
  {
    tokens: ["kitchen", "cooking", "dish", "food"],
    labels: ["kitchenware"],
    productIds: ["2", "5", "9", "14", "18"],
    category: "Kitchen",
  },
  {
    tokens: ["eco", "green", "sustainable", "organic", "reuse"],
    labels: ["eco product"],
    productIds: ["1", "9", "11", "5"],
    category: "Accessories",
  },
];

const FALLBACK_IDS = ["1", "9", "11", "5", "2"];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
}

function pickCueScores(haystack: string): { cue: Cue; hits: number }[] {
  const tokens = new Set(tokenize(haystack));
  const scored: { cue: Cue; hits: number }[] = [];
  for (const cue of VISION_CUES) {
    let hits = 0;
    for (const t of cue.tokens) {
      if (tokens.has(t) || haystack.toLowerCase().includes(t)) hits += 1;
    }
    if (hits > 0) scored.push({ cue, hits });
  }
  return scored.sort((a, b) => b.hits - a.hits);
}

function buildLabels(
  cues: { cue: Cue; hits: number }[],
  categoryHint: string | null
): VisionLabel[] {
  const labels: VisionLabel[] = [];
  for (const { cue, hits } of cues.slice(0, 3)) {
    for (const label of cue.labels.slice(0, 2)) {
      if (labels.some((l) => l.label === label)) continue;
      labels.push({
        label,
        confidence: Math.min(0.96, 0.55 + hits * 0.12 + labels.length * 0.02),
      });
    }
  }
  if (
    categoryHint &&
    !labels.some((l) => l.label === categoryHint.toLowerCase())
  ) {
    labels.push({ label: categoryHint.toLowerCase(), confidence: 0.62 });
  }
  if (labels.length === 0) {
    return [
      { label: "everyday eco goods", confidence: 0.48 },
      { label: "reusable product", confidence: 0.42 },
    ];
  }
  return labels.slice(0, 5);
}

/**
 * Classify a photo using filename + optional note (mock CV).
 */
export function classifyPhotoMock(input: {
  fileName: string;
  fileSize?: number;
  note?: string;
  limit?: number;
}): VisionResult {
  const haystack = `${input.fileName} ${input.note ?? ""}`.trim();
  const cueScores = pickCueScores(haystack);
  const limit = input.limit ?? 4;

  let productIds: string[] = [];
  let categoryHint: string | null = null;

  if (cueScores.length > 0) {
    categoryHint = cueScores[0].cue.category;
    for (const { cue } of cueScores) {
      for (const id of cue.productIds) {
        if (!productIds.includes(id)) productIds.push(id);
      }
    }
  } else {
    const seed =
      (input.fileName.length + (input.fileSize ?? 0)) % FALLBACK_IDS.length;
    productIds = [
      ...FALLBACK_IDS.slice(seed),
      ...FALLBACK_IDS.slice(0, seed),
    ];
    categoryHint = "Accessories";
  }

  productIds = productIds.slice(0, Math.max(limit, 4));
  const products = productsByIds(productIds).slice(0, limit);
  const labels = buildLabels(cueScores, categoryHint);
  const topLabel = labels[0]?.label ?? "eco product";

  const summary =
    cueScores.length > 0
      ? `I spotted something like “${topLabel}” in your photo. Here are similar Forest Buddies finds.`
      : `Couldn’t read a clear object from the file name — here are leafy stand-ins. Upload a real photo for Grok Vision, or try a demo chip.`;

  return {
    labels,
    summary,
    picks: craftVisionPicks(products, labels, categoryHint),
    productIds: products.map((p) => p.id),
    categoryHint,
    sourceName: input.fileName,
    engine: "mock",
    confidence: labels[0]?.confidence ?? 0.5,
  };
}

export async function classifyPhotoMockAsync(
  input: {
    fileName: string;
    fileSize?: number;
    note?: string;
    limit?: number;
  },
  delayMs = 700
): Promise<VisionResult> {
  await new Promise((r) => setTimeout(r, delayMs));
  return classifyPhotoMock(input);
}

/** Resize / convert to JPEG data URL for the vision API (jpg/png preferred). */
export async function fileToVisionDataUrl(file: File): Promise<{
  dataUrl: string;
  mimeType: string;
}> {
  const bitmap = await createImageBitmap(file);
  const maxEdge = 1280;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare the photo for Leafy.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  return { dataUrl, mimeType: "image/jpeg" };
}

/**
 * Client helper: send photo to /api/vision/analyze (Grok when configured).
 * Falls back to mock on network / demo errors so Ask Leafy never hard-fails.
 */
export async function classifyPhotoAsync(input: {
  file?: File | null;
  fileName: string;
  fileSize?: number;
  note?: string;
  imageDataUrl?: string;
  limit?: number;
}): Promise<VisionResult> {
  let imageDataUrl = input.imageDataUrl;
  if (!imageDataUrl && input.file) {
    const prepared = await fileToVisionDataUrl(input.file);
    imageDataUrl = prepared.dataUrl;
  }

  if (imageDataUrl) {
    try {
      const res = await fetch("/api/vision/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl,
          fileName: input.fileName,
          note: input.note,
          limit: input.limit ?? 4,
        }),
      });
      const data = (await res.json()) as VisionResult & { error?: string };
      if (res.ok && data.picks) return data;
      // Server may return mock + fallback flags even on 200
      if (data.picks) return data;
    } catch {
      // fall through to mock
    }
  }

  const mock = await classifyPhotoMockAsync({
    fileName: input.fileName,
    fileSize: input.fileSize,
    note: input.note,
    limit: input.limit,
  });
  return {
    ...mock,
    fallback: true,
    fallbackReason: imageDataUrl
      ? "Vision API unavailable — using Leafy’s forest instincts (mock)."
      : "Demo mode — add a photo for Grok Vision, or keep exploring with filename cues.",
  };
}

/** Demo filenames that trigger strong mock matches (for chips / hints). */
export const VISION_DEMO_HINTS = [
  { label: "Water bottle", fileName: "reusable-water-bottle.jpg" },
  { label: "Tote bag", fileName: "organic-cotton-tote.png" },
  { label: "Rain jacket", fileName: "recycled-rain-jacket.jpg" },
  { label: "Kitchen wraps", fileName: "beeswax-food-wraps.jpg" },
  { label: "Hemp tee", fileName: "organic-hemp-tshirt.jpg" },
];
