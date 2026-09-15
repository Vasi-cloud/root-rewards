import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/admin";
import { listAdminOrders } from "@/lib/stripe/list-admin-orders";

export const runtime = "nodejs";

function stripeErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m.trim();
  }
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  return "Unknown error";
}

/** Admin: real first-party / Stripe marketplace orders in GBP. */
export async function GET(request: Request) {
  const email =
    request.headers.get("x-admin-email")?.trim() ||
    new URL(request.url).searchParams.get("email")?.trim() ||
    "";

  if (!isAdminUser(email)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const result = await listAdminOrders();
    return NextResponse.json({
      mode: result.mode,
      keyMode: result.keyMode,
      orders: result.orders,
      count: result.orders.length,
    });
  } catch (err) {
    console.error("[admin] list orders failed", err);
    const payload: Record<string, unknown> = {
      error: "Could not load orders.",
    };
    if (process.env.NODE_ENV === "development") {
      payload.stripeError = stripeErrorMessage(err);
    }
    return NextResponse.json(payload, { status: 502 });
  }
}
