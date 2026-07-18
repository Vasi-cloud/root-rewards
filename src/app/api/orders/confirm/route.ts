import { NextResponse } from "next/server";

import { isStripeConfigured } from "@/lib/stripe/config";
import { retrieveAndFulfillSession } from "@/lib/stripe/fulfillment";
import { getOrderBySessionId } from "@/lib/stripe/orders";

export const runtime = "nodejs";

/**
 * Confirm a paid Checkout Session and return the fulfilled order.
 * Complements webhooks: if the user lands on success before the webhook,
 * this path still confirms the order securely via Stripe.
 */
export async function GET(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe not configured.", mode: "demo" },
      { status: 503 }
    );
  }

  const sessionId =
    new URL(request.url).searchParams.get("session_id")?.trim() ?? "";
  if (!sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "Invalid session id." }, { status: 400 });
  }

  try {
    const existing = getOrderBySessionId(sessionId);
    if (existing) {
      return NextResponse.json({ order: existing, source: "store" });
    }

    const order = await retrieveAndFulfillSession(sessionId, "success_page");
    if (!order) {
      return NextResponse.json(
        { error: "Payment not completed yet." },
        { status: 402 }
      );
    }

    return NextResponse.json({ order, source: "stripe" });
  } catch (err) {
    console.error("[stripe] confirm order failed", err);
    return NextResponse.json(
      { error: "Could not confirm order." },
      { status: 502 }
    );
  }
}
