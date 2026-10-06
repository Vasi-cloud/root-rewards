import { NextResponse } from "next/server";

import {
  listServiceTimeRequests,
  saveServiceTimeRequest,
} from "@/lib/service-requests-store";
import { validateEmail } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

/** Saved service time requests — Seller Hub can read these later. No charge. */
export async function GET(request: Request) {
  const shopUid = new URL(request.url).searchParams.get("shopUid")?.trim() ?? "";
  return NextResponse.json(
    { requests: listServiceTimeRequests(shopUid || undefined) },
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

  const raw = body as {
    listingId?: string;
    serviceTitle?: string;
    name?: string;
    email?: string;
    preferredTime?: string;
    shopUid?: string;
    shopName?: string;
  };
  const listingId = String(raw.listingId ?? "").trim().slice(0, 80);
  const serviceTitle = String(raw.serviceTitle ?? "").trim().slice(0, 200);
  const name = String(raw.name ?? "").trim().slice(0, 120);
  const preferredTime = String(raw.preferredTime ?? "").trim().slice(0, 200);
  const shopUid = String(raw.shopUid ?? "").trim().slice(0, 80);
  const shopName = String(raw.shopName ?? "").trim().slice(0, 160);
  const emailResult = validateEmail(String(raw.email ?? ""));

  if (
    !listingId ||
    !serviceTitle ||
    !name ||
    !preferredTime ||
    !shopUid ||
    !emailResult.ok
  ) {
    return NextResponse.json(
      { error: "Name, email, service, and a preferred time are needed." },
      { status: 400, headers: noStore }
    );
  }

  const saved = saveServiceTimeRequest({
    id: `sr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    listingId,
    serviceTitle,
    name,
    email: emailResult.value,
    preferredTime,
    shopUid,
    shopName,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ request: saved }, { headers: noStore });
}
