import { NextResponse } from "next/server";

import {
  createStoredShopApplication,
  listStoredShopApplications,
} from "@/lib/shop-applications-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    const applications = await listStoredShopApplications();
    return NextResponse.json({ applications }, { headers: noStore });
  } catch {
    return NextResponse.json({ applications: [] }, { headers: noStore });
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
      { error: "Missing application." },
      { status: 400, headers: noStore }
    );
  }
  const raw = body as Record<string, unknown>;
  const shopName = typeof raw.shopName === "string" ? raw.shopName.trim() : "";
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  if (!shopName || !id) {
    return NextResponse.json(
      { error: "Missing application." },
      { status: 400, headers: noStore }
    );
  }
  const saved = await createStoredShopApplication({
    id,
    shopName,
    sellerType: typeof raw.sellerType === "string" ? raw.sellerType : "business",
    companyName: typeof raw.companyName === "string" ? raw.companyName : shopName,
    servicesOffered:
      typeof raw.servicesOffered === "string" ? raw.servicesOffered : "",
    email: typeof raw.email === "string" ? raw.email : "",
    appliedAt: typeof raw.appliedAt === "string" ? raw.appliedAt : undefined,
  });
  if (!saved) {
    return NextResponse.json(
      { error: "Could not save the shop application." },
      { status: 502, headers: noStore }
    );
  }
  return NextResponse.json({ application: saved }, { headers: noStore });
}
