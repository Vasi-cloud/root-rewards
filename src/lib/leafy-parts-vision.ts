/**
 * Leafy Parts Finder — vision identification seam (client + shared types).
 *
 * UI must call `identifyPartFromImages` from `@/lib/leafy-parts` only.
 * That function tries the real vision path here, then falls back to mock.
 *
 * Real AI wiring checklist:
 * 1. Set `XAI_API_KEY` on the server.
 * 2. `/api/parts/identify` calls `identifyAutoPartWithGrokVision`
 *    in `leafy-parts-vision-grok.ts`.
 * 3. Keep returning `PartIdentificationResult` from `identifyPartFromImages`
 *    so Garage, prices, delivery, etc. stay unchanged.
 */

import type { IdentifyPartInput, PartKind } from "@/lib/leafy-parts";

export type PartsVisionEngine = "mock" | "grok-vision";

/** Successful server vision payload (after Grok / future engines). */
export type PartsVisionSuccess = {
  ok: true;
  engine: "grok-vision";
  kind: PartKind;
  /** Model confidence 0–1 */
  confidence: number;
  explanation: string;
  /** Optional OEM read from the image */
  oemNumber?: string;
};

/** Instruct the client to run the local mock pipeline instead. */
export type PartsVisionFallback = {
  ok: false;
  useClientMock: true;
  reason?: string;
};

export type PartsVisionApiResponse = PartsVisionSuccess | PartsVisionFallback;

const PART_KINDS = new Set<string>([
  "thermostat",
  "brake_pads_front",
  "brake_pads_rear",
  "oil_filter",
  "air_filter",
  "cabin_filter",
  "spark_plugs",
  "alternator",
  "starter_motor",
  "radiator",
  "water_pump",
  "oxygen_sensor",
  "abs_sensor",
  "temp_sensor",
  "maf_sensor",
  "wiper_blades",
  "battery",
  "fuel_filter",
]);

export function isPartKind(value: string): value is PartKind {
  return PART_KINDS.has(value);
}

/**
 * Client → `/api/parts/identify` (Grok Vision when `XAI_API_KEY` is set).
 * Returns `useClientMock` when the API is unavailable or not configured.
 */
export async function requestPartsVisionIdentify(
  input: IdentifyPartInput & { partNumber: string }
): Promise<PartsVisionApiResponse> {
  if (typeof window === "undefined") {
    return {
      ok: false,
      useClientMock: true,
      reason: "Vision identify runs in the browser client.",
    };
  }

  // Skip network when the user forced a part type — mock builder handles it.
  if (input.kindOverride) {
    return {
      ok: false,
      useClientMock: true,
      reason: "Manual part-type override — using local result builder.",
    };
  }

  const photos = input.photos
    .slice(0, 4)
    .filter((p) => p.previewUrl.startsWith("data:image/"));

  if (photos.length === 0) {
    return {
      ok: false,
      useClientMock: true,
      reason: "No image data URLs available for vision.",
    };
  }

  try {
    const res = await fetch("/api/parts/identify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        photos: photos.map((p) => ({
          imageDataUrl: p.previewUrl,
          fileName: p.name,
        })),
        partNumberPhoto: input.partNumberPhoto?.previewUrl
          ? {
              imageDataUrl: input.partNumberPhoto.previewUrl,
              fileName: input.partNumberPhoto.name,
            }
          : null,
        vehicle: {
          makeId: input.details.makeId,
          modelId: input.details.modelId,
          year: input.details.year,
          vin: input.details.vin,
        },
        partNumber: input.partNumber,
      }),
    });

    const data = (await res.json()) as PartsVisionApiResponse & {
      error?: string;
    };

    if (!res.ok) {
      return {
        ok: false,
        useClientMock: true,
        reason: data.error || `Vision API HTTP ${res.status}`,
      };
    }

    if (data.ok === true && isPartKind(data.kind)) {
      return {
        ok: true,
        engine: "grok-vision",
        kind: data.kind,
        confidence: clamp01(Number(data.confidence) || 0.7),
        explanation: String(data.explanation || "").slice(0, 400),
        oemNumber:
          typeof data.oemNumber === "string"
            ? data.oemNumber.slice(0, 48)
            : undefined,
      };
    }

    if (data.ok === false && data.useClientMock) {
      return data;
    }

    return {
      ok: false,
      useClientMock: true,
      reason: "Unexpected vision API response — using mock.",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    return {
      ok: false,
      useClientMock: true,
      reason: `Vision request failed (${message})`,
    };
  }
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0.7;
  return Math.min(1, Math.max(0, n));
}

/** UI badge copy for the confidence card. */
export function partsConfidenceBadgeLabel(isMockEstimate: boolean): string {
  return isMockEstimate ? "Mock AI estimate" : "AI confidence";
}
