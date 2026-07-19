import { NextResponse } from "next/server";

import { sendOrderConfirmationEmail } from "@/lib/email/messages";
import { emptyCauseSelection, type CauseSelection } from "@/lib/causes";
import { CAUSE_IDS } from "@/lib/stripe/checkout-types";
import type { ConfirmedOrder } from "@/lib/stripe/orders";
import { validateEmail } from "@/lib/validation";

export const runtime = "nodejs";

/** Demo / fallback order confirmation when Stripe fulfillment did not run. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const raw = body as {
    email?: string;
    name?: string;
    orderNumber?: string;
    amountTotalCents?: number;
    lineItems?: Array<{ name: string; quantity: number; amountCents: number }>;
    causeSelection?: Record<string, number>;
  };

  const emailResult = validateEmail(String(raw.email ?? ""));
  if (!emailResult.ok) {
    return NextResponse.json({ error: emailResult.error }, { status: 400 });
  }

  const causeSelection = emptyCauseSelection();
  if (raw.causeSelection && typeof raw.causeSelection === "object") {
    for (const id of CAUSE_IDS) {
      const n = Number(raw.causeSelection[id]);
      if (Number.isFinite(n) && n > 0) causeSelection[id] = Math.floor(n);
    }
  }

  const lineItems = Array.isArray(raw.lineItems)
    ? raw.lineItems
        .filter((i) => i && typeof i.name === "string")
        .slice(0, 40)
        .map((i) => ({
          name: String(i.name).slice(0, 120),
          quantity: Math.min(50, Math.max(1, Math.floor(Number(i.quantity) || 1))),
          amountCents: Math.max(0, Math.floor(Number(i.amountCents) || 0)),
        }))
    : [];

  const order: ConfirmedOrder = {
    id: `demo-${Date.now()}`,
    orderNumber:
      String(raw.orderNumber ?? "").trim().slice(0, 32) ||
      `FB-DEMO-${Date.now().toString().slice(-6)}`,
    kind: "marketplace_order",
    sessionId: "demo",
    paymentStatus: "paid",
    amountTotalCents: Math.max(
      0,
      Math.floor(Number(raw.amountTotalCents) || 0)
    ),
    currency: "usd",
    customerEmail: emailResult.value,
    customerId: null,
    subscriptionId: null,
    userId: null,
    customerName: String(raw.name ?? "").trim().slice(0, 80) || null,
    shipping: { address: null, city: null, zip: null },
    causeSelection: causeSelection as CauseSelection,
    memberCreditCents: 0,
    lineItems,
    fulfilledAt: new Date().toISOString(),
    fulfilledBy: "demo",
    status: "fulfilled",
  };

  const result = await sendOrderConfirmationEmail(order);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true, mode: result.mode, id: result.id });
}
