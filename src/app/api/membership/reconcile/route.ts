import { NextResponse } from "next/server";

import { reconcileMembershipFromStripe } from "@/lib/stripe/reconcile-membership";
import { validateEmail } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * Login/sign-up reconcile — Stripe is source of truth.
 * Does not cancel subscriptions; only reports current state for the client cache.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const raw = body as {
    email?: string;
    customerId?: string | null;
    subscriptionId?: string | null;
    userId?: string | null;
  };

  const emailRaw = String(raw.email ?? "").trim();
  let email: string | null = null;
  if (emailRaw) {
    const emailResult = validateEmail(emailRaw);
    if (!emailResult.ok) {
      return NextResponse.json({ error: emailResult.error }, { status: 400 });
    }
    email = emailResult.value;
  }

  const customerId =
    typeof raw.customerId === "string" && raw.customerId.startsWith("cus_")
      ? raw.customerId
      : null;
  const subscriptionId =
    typeof raw.subscriptionId === "string" &&
    raw.subscriptionId.startsWith("sub_")
      ? raw.subscriptionId
      : null;
  const userId =
    typeof raw.userId === "string" && raw.userId.trim()
      ? raw.userId.trim().slice(0, 128)
      : null;

  if (!email && !customerId && !subscriptionId) {
    return NextResponse.json(
      {
        error:
          "Email, Stripe customer id, or Stripe subscription id is required.",
      },
      { status: 400 }
    );
  }

  const result = await reconcileMembershipFromStripe({
    email,
    customerId,
    subscriptionId,
    userId,
  });

  return NextResponse.json(result);
}
