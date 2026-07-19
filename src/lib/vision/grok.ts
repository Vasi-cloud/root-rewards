import {
  catalogForVisionPrompt,
  craftVisionPicks,
  matchProductsByKeywords,
  productsByIds,
} from "@/lib/vision/catalog-match";
import type {
  VisionAnalysisDraft,
  VisionLabel,
  VisionResult,
} from "@/lib/vision/types";

const XAI_RESPONSES_URL = "https://api.x.ai/v1/responses";
const DEFAULT_MODEL = "grok-4.5";

export function isGrokVisionConfigured(): boolean {
  return Boolean(process.env.XAI_API_KEY?.trim());
}

function extractOutputText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const data = payload as Record<string, unknown>;

  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text;
  }

  const output = data.output;
  if (Array.isArray(output)) {
    const chunks: string[] = [];
    for (const item of output) {
      if (!item || typeof item !== "object") continue;
      const content = (item as { content?: unknown }).content;
      if (!Array.isArray(content)) continue;
      for (const part of content) {
        if (!part || typeof part !== "object") continue;
        const p = part as { type?: string; text?: string };
        if (
          (p.type === "output_text" || p.type === "text") &&
          typeof p.text === "string"
        ) {
          chunks.push(p.text);
        }
      }
    }
    if (chunks.length) return chunks.join("\n");
  }

  // Chat-completions-shaped fallback
  const choices = data.choices;
  if (Array.isArray(choices) && choices[0]) {
    const msg = (choices[0] as { message?: { content?: unknown } }).message;
    if (typeof msg?.content === "string") return msg.content;
  }

  return "";
}

function parseJsonObject(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? trimmed).trim();
  try {
    const parsed = JSON.parse(candidate) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1)) as Record<
          string,
          unknown
        >;
      } catch {
        return null;
      }
    }
  }
  return null;
}

function normalizeLabels(raw: unknown): VisionLabel[] {
  if (!Array.isArray(raw)) return [];
  const out: VisionLabel[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const label = String(
      (item as { label?: unknown }).label ??
        (item as { name?: unknown }).name ??
        ""
    )
      .trim()
      .slice(0, 48);
    if (!label) continue;
    let confidence = Number(
      (item as { confidence?: unknown }).confidence ?? 0.7
    );
    if (confidence > 1) confidence = confidence / 100;
    if (!Number.isFinite(confidence)) confidence = 0.7;
    confidence = Math.min(0.99, Math.max(0.05, confidence));
    out.push({ label, confidence });
  }
  return out.slice(0, 6);
}

function normalizeDraft(raw: Record<string, unknown>): VisionAnalysisDraft {
  const labels = normalizeLabels(raw.labels);
  const keywords = Array.isArray(raw.keywords)
    ? raw.keywords
        .filter((k): k is string => typeof k === "string")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 12)
    : labels.map((l) => l.label);

  const suggestedProductIds = Array.isArray(raw.suggestedProductIds)
    ? raw.suggestedProductIds
        .map((id) => String(id).trim())
        .filter(Boolean)
        .slice(0, 8)
    : Array.isArray(raw.productIds)
      ? raw.productIds.map((id) => String(id).trim()).filter(Boolean).slice(0, 8)
      : [];

  const matchScores = Array.isArray(raw.matchScores)
    ? raw.matchScores
        .map((n) => Number(n))
        .filter((n) => Number.isFinite(n))
        .map((n) => (n <= 1 ? Math.round(n * 100) : Math.round(n)))
        .slice(0, 8)
    : undefined;

  let confidence = Number(raw.confidence);
  if (confidence > 1) confidence = confidence / 100;
  if (!Number.isFinite(confidence)) {
    confidence = labels[0]?.confidence ?? 0.72;
  }

  const categoryHint = raw.categoryHint
    ? String(raw.categoryHint).trim().slice(0, 40) || null
    : null;

  const summary =
    String(raw.summary ?? "").trim().slice(0, 280) ||
    (labels[0]
      ? `I spotted something like “${labels[0].label}” — here are leafy twins from the marketplace.`
      : "Here’s what I’d forage from the Forest Buddies shelves.");

  return {
    summary,
    categoryHint,
    labels:
      labels.length > 0
        ? labels
        : [{ label: "eco everyday", confidence: confidence }],
    keywords,
    suggestedProductIds,
    matchScores,
    confidence: Math.min(0.99, Math.max(0.05, confidence)),
  };
}

function draftToVisionResult(
  draft: VisionAnalysisDraft,
  sourceName: string,
  limit: number
): VisionResult {
  let products = productsByIds(draft.suggestedProductIds);
  if (products.length < limit) {
    const extra = matchProductsByKeywords(
      draft.keywords.length ? draft.keywords : draft.labels.map((l) => l.label),
      draft.categoryHint,
      limit
    );
    for (const p of extra) {
      if (!products.some((x) => x.id === p.id)) products.push(p);
      if (products.length >= limit) break;
    }
  }
  products = products.slice(0, limit);

  return {
    labels: draft.labels,
    summary: draft.summary,
    picks: craftVisionPicks(
      products,
      draft.labels,
      draft.categoryHint,
      draft.matchScores
    ),
    productIds: products.map((p) => p.id),
    categoryHint: draft.categoryHint,
    sourceName,
    engine: "grok-vision",
    confidence: draft.confidence,
  };
}

export async function analyzeWithGrokVision(input: {
  imageDataUrl: string;
  fileName: string;
  note?: string;
  limit?: number;
}): Promise<VisionResult> {
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("XAI_API_KEY is not configured");
  }

  const limit = input.limit ?? 4;
  const catalog = catalogForVisionPrompt(36);
  const model = process.env.XAI_VISION_MODEL?.trim() || DEFAULT_MODEL;
  const noteLine = input.note?.trim()
    ? `Shopper hint: ${input.note.trim().slice(0, 120)}`
    : "No extra hint from the shopper.";

  const prompt = `You are Leafy, a playful forest-guide shopping assistant for Forest Buddies (eco marketplace).
Look at the photo and suggest similar sustainable products from our catalog.

${noteLine}

Catalog (JSON):
${JSON.stringify(catalog)}

Respond with ONLY valid JSON (no markdown) matching:
{
  "summary": "fun 1-2 sentence eco narration of what you see and why these picks fit",
  "categoryHint": "Kitchen|Home|Beauty|Apparel|Accessories|Stationery|null",
  "confidence": 0.0-1.0,
  "labels": [{"label": "short object tag", "confidence": 0.0-1.0}],
  "keywords": ["match", "words"],
  "suggestedProductIds": ["id", "..."],
  "matchScores": [0-100 visual similarity per suggested id]
}

Rules:
- Prefer catalog ids that truly resemble the photo.
- 3–${limit} suggestedProductIds max.
- Keep labels short and shopper-friendly.
- If unsure, still suggest the closest eco alternatives and lower confidence.`;

  const res = await fetch(XAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      store: false,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_image",
              image_url: input.imageDataUrl,
              detail: "high",
            },
            {
              type: "input_text",
              text: prompt,
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(
      `Grok Vision error ${res.status}: ${errText.slice(0, 200) || res.statusText}`
    );
  }

  const payload: unknown = await res.json();
  const text = extractOutputText(payload);
  const parsed = parseJsonObject(text);
  if (!parsed) {
    throw new Error("Grok Vision returned an unreadable response");
  }

  return draftToVisionResult(normalizeDraft(parsed), input.fileName, limit);
}
