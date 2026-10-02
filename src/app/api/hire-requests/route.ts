import { NextResponse } from "next/server";

import type { HireRequest } from "@/lib/hire-requests";
import {
  isValidLeaValleyHireRequest,
  listHireRequests,
  saveHireRequest,
} from "@/lib/hire-requests-store";
import {
  isLeaValleyHireListing,
  LEA_VALLEY_SHOP_NAME,
  LEA_VALLEY_UID,
  leaValleyHireTitle,
} from "@/lib/lea-valley-guest";

export const runtime = "nodejs";

function parseRequest(body: unknown): HireRequest | null {
  if (!body || typeof body !== "object") return null;
  const raw = body as Partial<HireRequest>;
  const listingId =
    typeof raw.listingId === "string" ? raw.listingId.trim() : "";
  const listingTitle = leaValleyHireTitle(
    listingId,
    typeof raw.listingTitle === "string" ? raw.listingTitle : ""
  );
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const email = typeof raw.email === "string" ? raw.email.trim() : "";
  const dates = typeof raw.dates === "string" ? raw.dates.trim() : "";
  if (!name || !email.includes("@") || !dates || !listingTitle) return null;
  if (!isLeaValleyHireListing({ id: listingId, name: listingTitle })) {
    return null;
  }
  return {
    id:
      typeof raw.id === "string" && raw.id.trim()
        ? raw.id.trim().slice(0, 80)
        : `hr-${Date.now()}`,
    listingId,
    listingTitle,
    name: name.slice(0, 120),
    email: email.slice(0, 160),
    dates: dates.slice(0, 200),
    shopUid: LEA_VALLEY_UID,
    shopName: LEA_VALLEY_SHOP_NAME,
    createdAt:
      typeof raw.createdAt === "string" && raw.createdAt
        ? raw.createdAt
        : new Date().toISOString(),
    status: "new",
  };
}

/** Lea Valley hire requests only — no other shops, no Stripe. */
export async function GET() {
  return NextResponse.json({ requests: listHireRequests() });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseRequest(body);
  if (!parsed || !isValidLeaValleyHireRequest(parsed)) {
    return NextResponse.json(
      { error: "Could not save this hire request." },
      { status: 400 }
    );
  }

  const saved = saveHireRequest(parsed);
  return NextResponse.json({ request: saved });
}
