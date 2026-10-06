import { NextResponse } from "next/server";

import {
  getHireListingTerms,
  saveHireListingTerms,
} from "@/lib/hire-listing-terms-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };
const LISTING_ID = /^[a-zA-Z0-9_-]{1,120}$/;
const MAX_TERMS = 4000;

export async function GET(request: Request) {
  const listingId =
    new URL(request.url).searchParams.get("listingId")?.trim() ?? "";
  if (!LISTING_ID.test(listingId)) {
    return NextResponse.json(
      { terms: "" },
      { headers: noStore }
    );
  }
  return NextResponse.json(
    { terms: getHireListingTerms(listingId) },
    { headers: noStore }
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400, headers: noStore }
    );
  }

  const raw = body as { listingId?: unknown; terms?: unknown };
  const listingId = typeof raw.listingId === "string" ? raw.listingId.trim() : "";
  const terms = typeof raw.terms === "string" ? raw.terms : "";
  if (!LISTING_ID.test(listingId)) {
    return NextResponse.json(
      { error: "A hire listing is required." },
      { status: 400, headers: noStore }
    );
  }
  if (terms.length > MAX_TERMS) {
    return NextResponse.json(
      { error: "Terms are too long." },
      { status: 400, headers: noStore }
    );
  }

  saveHireListingTerms(listingId, terms);
  return NextResponse.json({ ok: true }, { headers: noStore });
}
