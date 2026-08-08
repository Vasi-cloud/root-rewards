import { NextResponse } from "next/server";

import {
  hasEmailFrom,
  hasResendApiKey,
  isEmailConfigured,
} from "@/lib/email/config";

/**
 * Debug: whether Resend + From are present.
 * Booleans only — never returns API key or EMAIL_FROM value.
 */
export async function GET() {
  const hasKey = hasResendApiKey();
  const hasFrom = hasEmailFrom();
  const configured = isEmailConfigured();

  let mode: "live" | "demo" | "missing_from" = "demo";
  if (configured) mode = "live";
  else if (hasKey && !hasFrom) mode = "missing_from";

  return NextResponse.json({
    configured,
    hasResendApiKey: hasKey,
    hasEmailFrom: hasFrom,
    provider: "resend",
    mode,
  });
}
