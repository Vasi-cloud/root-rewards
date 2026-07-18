"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

/**
 * Legacy confirmation URL — redirects to the production success page.
 * Stripe Checkout now lands on /checkout/success directly.
 */
function ConfirmationRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams();
    const sessionId = searchParams.get("session_id");
    const demo = searchParams.get("demo");
    if (sessionId) params.set("session_id", sessionId);
    if (demo) params.set("demo", demo);
    const qs = params.toString();
    router.replace(qs ? `/checkout/success?${qs}` : "/checkout/success");
  }, [router, searchParams]);

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center text-muted-foreground">
      Redirecting to your order…
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-16 text-center text-muted-foreground">
          Redirecting…
        </div>
      }
    >
      <ConfirmationRedirect />
    </Suspense>
  );
}
