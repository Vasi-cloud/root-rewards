import { NextResponse } from "next/server";

import {
  createStoredHireListing,
  listStoredHireListings,
} from "@/lib/lea-valley-hire-listings-server";
import {
  isLeaValleyHireListing,
  isLeaValleyLiveBike,
} from "@/lib/lea-valley-guest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    const listings = await listStoredHireListings();
    return NextResponse.json({ listings }, { headers: noStore });
  } catch {
    return NextResponse.json({ listings: [] }, { headers: noStore });
  }
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
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Missing listing." },
      { status: 400, headers: noStore }
    );
  }
  const raw = body as Record<string, unknown>;
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!id || !name) {
    return NextResponse.json(
      { error: "Missing listing." },
      { status: 400, headers: noStore }
    );
  }
  if (
    isLeaValleyLiveBike({ id }) ||
    isLeaValleyHireListing({ id, name })
  ) {
    return NextResponse.json(
      { error: "That bike is already listed." },
      { status: 400, headers: noStore }
    );
  }
  const saved = await createStoredHireListing({
    id,
    name,
    subtitle: typeof raw.subtitle === "string" ? raw.subtitle : "",
    description: typeof raw.description === "string" ? raw.description : "",
    price: Number(raw.price) || 0,
    hirePeriod: typeof raw.hirePeriod === "string" ? raw.hirePeriod : "",
    category: typeof raw.category === "string" ? raw.category : "Cycling",
    status: "pending",
    autoApproved: false,
    listingType: "rental",
    createdAt:
      typeof raw.createdAt === "string" && raw.createdAt
        ? raw.createdAt
        : new Date().toISOString(),
  });
  if (!saved) {
    return NextResponse.json(
      { error: "Could not save the hire listing." },
      { status: 502, headers: noStore }
    );
  }
  return NextResponse.json({ listing: saved }, { headers: noStore });
}
