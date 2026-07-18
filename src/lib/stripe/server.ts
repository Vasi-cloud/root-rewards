import "server-only";

import Stripe from "stripe";

import { isStripeConfigured } from "@/lib/stripe/config";

let stripeSingleton: Stripe | null = null;

/** Server-only Stripe client. Throws if secret key is missing. */
export function getStripe(): Stripe {
  if (!isStripeConfigured()) {
    throw new Error("Stripe is not configured (missing STRIPE_SECRET_KEY).");
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(process.env.STRIPE_SECRET_KEY!.trim(), {
      apiVersion: "2026-06-24.dahlia",
      typescript: true,
      appInfo: {
        name: "Forest Buddies",
        version: "0.1.0",
      },
    });
  }
  return stripeSingleton;
}
