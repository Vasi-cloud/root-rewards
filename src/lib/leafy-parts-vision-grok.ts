/**
 * Server-only: Grok Vision call for Leafy Parts Finder.
 *
 * Used by `/api/parts/identify`. Requires `XAI_API_KEY`.
 * Keep the JSON response shape stable so the client mapper stays simple.
 */

import { PART_KIND_OPTIONS, type PartKind } from "@/lib/leafy-parts";
import { isPartKind, type PartsVisionSuccess } from "@/lib/leafy-parts-vision";
import { isGrokVisionConfigured } from "@/lib/vision/grok";

const XAI_RESPONSES_URL = "https://api.x.ai/v1/responses";
const DEFAULT_MODEL = "grok-4.5";

export { isGrokVisionConfigured };

type PhotoPayload = {
  imageDataUrl: string;
  fileName: string;
};

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

function normalizeKind(raw: unknown): PartKind | null {
  if (typeof raw !== "string") return null;
  const id = raw.trim().toLowerCase().replace(/\s+/g, "_");
  if (isPartKind(id)) return id;
  // Allow label-ish replies
  const byLabel = PART_KIND_OPTIONS.find(
    (o) => o.label.toLowerCase() === raw.trim().toLowerCase()
  );
  return byLabel?.id ?? null;
}

/**
 * Call xAI Grok Vision to classify an automotive part photo.
 *
 * Expected model JSON:
 * {
 *   "kind": "thermostat" | ... (PartKind id),
 *   "confidence": 0.0-1.0,
 *   "explanation": "short why-it-matched",
 *   "oemNumber": "optional"
 * }
 */
export async function identifyAutoPartWithGrokVision(input: {
  photos: PhotoPayload[];
  partNumberPhoto?: PhotoPayload | null;
  vehicle?: {
    makeId?: string;
    modelId?: string;
    year?: string;
    vin?: string;
  };
  partNumber?: string;
}): Promise<PartsVisionSuccess> {
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("XAI_API_KEY is not configured");
  }

  const model = process.env.XAI_VISION_MODEL?.trim() || DEFAULT_MODEL;
  const kindList = PART_KIND_OPTIONS.map((o) => `${o.id} (${o.label})`).join(
    ", "
  );

  const vehicleLine = input.vehicle
    ? `Vehicle context: ${input.vehicle.year ?? ""} ${input.vehicle.makeId ?? ""} ${input.vehicle.modelId ?? ""}${
        input.vehicle.vin ? ` VIN ${input.vehicle.vin}` : ""
      }`.trim()
    : "Vehicle context: unknown";

  const partNumberLine = input.partNumber?.trim()
    ? `User-typed part number: ${input.partNumber.trim().slice(0, 48)}`
    : "User-typed part number: none";

  const prompt = `You are Leafy Parts Finder for Forest Buddies — identify the automotive replacement part in the photo(s).

${vehicleLine}
${partNumberLine}

Allowed part kind ids (pick exactly one):
${kindList}

Respond with ONLY valid JSON (no markdown):
{
  "kind": "<one allowed kind id>",
  "confidence": 0.0-1.0,
  "explanation": "1-2 short sentences on why it matched (shape, connectors, markings)",
  "oemNumber": "optional OEM / part number if clearly readable, else omit"
}

Rules:
- Prefer visual evidence from the images over the typed part number.
- If a dedicated part-number close-up is included, use any readable OEM text.
- If unsure, still pick the closest kind and lower confidence.
- Never invent an OEM number that is not visible.`;

  const images = [
    ...input.photos.slice(0, 4),
    ...(input.partNumberPhoto ? [input.partNumberPhoto] : []),
  ].map((p) => ({
    type: "input_image" as const,
    image_url: p.imageDataUrl.replace(
      /^data:image\/webp;base64,/i,
      "data:image/jpeg;base64,"
    ),
    detail: "high" as const,
  }));

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
            ...images,
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
    throw new Error("Grok Vision returned an unreadable parts response");
  }

  const kind = normalizeKind(parsed.kind);
  if (!kind) {
    throw new Error("Grok Vision returned an unknown part kind");
  }

  let confidence = Number(parsed.confidence);
  if (confidence > 1) confidence = confidence / 100;
  if (!Number.isFinite(confidence)) confidence = 0.72;
  confidence = Math.min(0.99, Math.max(0.05, confidence));

  const explanation =
    String(parsed.explanation ?? "").trim().slice(0, 400) ||
    `Grok Vision matched this as ${kind}.`;

  const oemRaw = parsed.oemNumber;
  const oemNumber =
    typeof oemRaw === "string" && oemRaw.trim().length >= 4
      ? oemRaw.trim().slice(0, 48)
      : undefined;

  return {
    ok: true,
    engine: "grok-vision",
    kind,
    confidence,
    explanation,
    oemNumber,
  };
}
