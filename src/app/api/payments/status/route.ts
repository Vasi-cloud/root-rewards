import { NextResponse } from "next/server";

import {
  getPaymentsMode,
  getStripePublishableKey,
  isStripeWebhookConfigured,
} from "@/lib/stripe/config";

/** Public payment mode — never exposes secrets. */
export async function GET() {
  const mode = getPaymentsMode();
  return NextResponse.json({
    mode,
    stripeEnabled: mode === "live",
    publishableKey: getStripePublishableKey() ?? null,
    webhookConfigured: isStripeWebhookConfigured(),
  });
}
