import { NextResponse } from "next/server";

import { getEmailFrom, isEmailConfigured } from "@/lib/email/config";

export async function GET() {
  return NextResponse.json({
    configured: isEmailConfigured(),
    provider: "resend",
    from: isEmailConfigured() ? getEmailFrom() : null,
    mode: isEmailConfigured() ? "live" : "demo",
  });
}
