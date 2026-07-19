import { NextResponse } from "next/server";

import { classifyPhotoMock } from "@/lib/vision-agent";
import {
  analyzeWithGrokVision,
  isGrokVisionConfigured,
} from "@/lib/vision/grok";
import type { VisionResult } from "@/lib/vision/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_DATA_URL_CHARS = 3_500_000; // ~2.5MB base64 payload

function isValidDataUrl(value: string): boolean {
  return /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(value);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const raw = body as {
    imageDataUrl?: unknown;
    fileName?: unknown;
    note?: unknown;
    limit?: unknown;
  };

  const fileName = String(raw.fileName ?? "photo.jpg")
    .trim()
    .slice(0, 180) || "photo.jpg";
  const note = String(raw.note ?? "")
    .trim()
    .slice(0, 200);
  const limit = Math.min(6, Math.max(2, Math.floor(Number(raw.limit) || 4)));
  const imageDataUrl =
    typeof raw.imageDataUrl === "string" ? raw.imageDataUrl : "";

  const mockFallback = (reason: string): VisionResult => ({
    ...classifyPhotoMock({
      fileName,
      note: note || undefined,
      limit,
    }),
    fallback: true,
    fallbackReason: reason,
  });

  if (!imageDataUrl) {
    return NextResponse.json(
      mockFallback("No photo bytes — matching from your note / filename.")
    );
  }

  if (!isValidDataUrl(imageDataUrl)) {
    return NextResponse.json(
      { error: "Send a JPEG or PNG data URL." },
      { status: 400 }
    );
  }

  if (imageDataUrl.length > MAX_DATA_URL_CHARS) {
    return NextResponse.json(
      { error: "Photo is too large. Try a smaller image (under ~2 MB)." },
      { status: 413 }
    );
  }

  if (!isGrokVisionConfigured()) {
    return NextResponse.json(
      mockFallback(
        "Add XAI_API_KEY for live Grok Vision — Leafy is using forest mock eyes for now."
      )
    );
  }

  try {
    // Prefer JPEG/PNG for xAI; strip webp by re-labeling if needed (client converts)
    const normalizedUrl = imageDataUrl.replace(
      /^data:image\/webp;base64,/i,
      "data:image/jpeg;base64,"
    );

    const result = await analyzeWithGrokVision({
      imageDataUrl: normalizedUrl,
      fileName,
      note: note || undefined,
      limit,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Grok Vision request failed";
    console.error("[vision/analyze]", message);
    return NextResponse.json(
      mockFallback(
        `Grok Vision hiccup — Leafy switched to mock roots. (${message.slice(0, 120)})`
      )
    );
  }
}

export async function GET() {
  return NextResponse.json({
    configured: isGrokVisionConfigured(),
    engine: isGrokVisionConfigured() ? "grok-vision" : "mock",
  });
}
