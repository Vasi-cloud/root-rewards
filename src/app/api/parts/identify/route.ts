import { NextResponse } from "next/server";

import type { PartsVisionApiResponse } from "@/lib/leafy-parts-vision";
import {
  identifyAutoPartWithGrokVision,
  isGrokVisionConfigured,
} from "@/lib/leafy-parts-vision-grok";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_DATA_URL_CHARS = 3_500_000;

type PhotoBody = {
  imageDataUrl?: unknown;
  fileName?: unknown;
};

function isValidDataUrl(value: string): boolean {
  return /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(value);
}

function mockFallback(reason: string): PartsVisionApiResponse {
  return {
    ok: false,
    useClientMock: true,
    reason,
  };
}

function readPhoto(raw: PhotoBody | null | undefined): {
  imageDataUrl: string;
  fileName: string;
} | null {
  if (!raw || typeof raw !== "object") return null;
  const imageDataUrl =
    typeof raw.imageDataUrl === "string" ? raw.imageDataUrl : "";
  if (!imageDataUrl || !isValidDataUrl(imageDataUrl)) return null;
  if (imageDataUrl.length > MAX_DATA_URL_CHARS) return null;
  return {
    imageDataUrl,
    fileName:
      String(raw.fileName ?? "part.jpg")
        .trim()
        .slice(0, 180) || "part.jpg",
  };
}

/**
 * POST /api/parts/identify
 *
 * Tries Grok Vision when `XAI_API_KEY` is set.
 * Otherwise returns `{ useClientMock: true }` so the browser keeps using
 * the fully working mock pipeline (shape / OEM cues).
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const raw = body as {
    photos?: unknown;
    partNumberPhoto?: unknown;
    vehicle?: unknown;
    partNumber?: unknown;
  };

  const photos = Array.isArray(raw.photos)
    ? raw.photos
        .map((p) => readPhoto(p as PhotoBody))
        .filter((p): p is NonNullable<typeof p> => p != null)
        .slice(0, 4)
    : [];

  if (photos.length === 0) {
    return NextResponse.json(
      mockFallback("No valid photos — client mock will identify from local cues.")
    );
  }

  const partNumberPhoto = readPhoto(raw.partNumberPhoto as PhotoBody);
  const partNumber =
    typeof raw.partNumber === "string" ? raw.partNumber.trim().slice(0, 48) : "";
  const vehicle =
    raw.vehicle && typeof raw.vehicle === "object"
      ? (raw.vehicle as {
          makeId?: string;
          modelId?: string;
          year?: string;
          vin?: string;
        })
      : undefined;

  // ---------------------------------------------------------------------------
  // REAL AI HOOK — Grok Vision / xAI
  // ---------------------------------------------------------------------------
  // Requires XAI_API_KEY. When missing, tell the client to run mockIdentify…
  // so Leafy Parts Finder never breaks in local / demo environments.
  // ---------------------------------------------------------------------------
  if (!isGrokVisionConfigured()) {
    return NextResponse.json(
      mockFallback(
        "Add XAI_API_KEY for live Grok Vision — using Leafy’s mock part eyes for now."
      )
    );
  }

  try {
    const result = await identifyAutoPartWithGrokVision({
      photos,
      partNumberPhoto,
      vehicle,
      partNumber: partNumber || undefined,
    });
    return NextResponse.json(result satisfies PartsVisionApiResponse);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Grok Vision request failed";
    console.error("[parts/identify]", message);
    return NextResponse.json(
      mockFallback(
        `Grok Vision hiccup — client mock will take over. (${message.slice(0, 120)})`
      )
    );
  }
}

export async function GET() {
  return NextResponse.json({
    configured: isGrokVisionConfigured(),
    engine: isGrokVisionConfigured() ? "grok-vision" : "mock",
    endpoint: "/api/parts/identify",
  });
}
