import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/admin";
import { listImpactMembersFromStripe } from "@/lib/stripe/list-impact-members";

export const runtime = "nodejs";

/**
 * Admin: Impact Member subscriptions from Stripe (same secret key as the site).
 * Soft-launch gate: caller must send the allowlisted admin email.
 */
export async function GET(request: Request) {
  const email =
    request.headers.get("x-admin-email")?.trim() ||
    new URL(request.url).searchParams.get("email")?.trim() ||
    "";

  if (!isAdminUser(email)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const result = await listImpactMembersFromStripe();
    return NextResponse.json({
      mode: result.mode,
      members: result.members,
      count: result.members.length,
    });
  } catch (err) {
    console.error("[admin] list Impact members failed", err);
    return NextResponse.json(
      { error: "Could not load members from Stripe." },
      { status: 502 }
    );
  }
}
