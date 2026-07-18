export type PaymentsStatus = {
  mode: "live" | "demo";
  stripeEnabled: boolean;
  publishableKey: string | null;
  webhookConfigured: boolean;
};

export async function fetchPaymentsStatus(): Promise<PaymentsStatus> {
  try {
    const res = await fetch("/api/payments/status", { cache: "no-store" });
    if (!res.ok) {
      return {
        mode: "demo",
        stripeEnabled: false,
        publishableKey: null,
        webhookConfigured: false,
      };
    }
    return (await res.json()) as PaymentsStatus;
  } catch {
    return {
      mode: "demo",
      stripeEnabled: false,
      publishableKey: null,
      webhookConfigured: false,
    };
  }
}

export async function startStripeCheckout(
  body: unknown
): Promise<{ url: string } | { demo: true } | { error: string }> {
  const res = await fetch("/api/checkout/create-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    url?: string;
    mode?: string;
    error?: string;
  };
  if (res.status === 503 || data.mode === "demo") {
    return { demo: true };
  }
  if (!res.ok || !data.url) {
    return { error: data.error ?? "Could not start checkout." };
  }
  return { url: data.url };
}

export async function startMembershipCheckout(
  body: unknown
): Promise<{ url: string } | { demo: true } | { error: string }> {
  const res = await fetch("/api/membership/create-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    url?: string;
    mode?: string;
    error?: string;
  };
  if (res.status === 503 || data.mode === "demo") {
    return { demo: true };
  }
  if (!res.ok || !data.url) {
    return { error: data.error ?? "Could not start membership checkout." };
  }
  return { url: data.url };
}

export async function openBillingPortal(
  customerId: string
): Promise<{ url: string } | { error: string }> {
  const res = await fetch("/api/membership/portal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customerId }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    url?: string;
    error?: string;
  };
  if (!res.ok || !data.url) {
    return { error: data.error ?? "Could not open billing portal." };
  }
  return { url: data.url };
}

export type VerifiedSession = {
  paid: boolean;
  kind: string | null;
  customerId: string | null;
  subscriptionId: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  amountTotal: number | null;
  customerEmail: string | null;
  metadata: Record<string, string>;
};

export async function verifyCheckoutSession(
  sessionId: string
): Promise<VerifiedSession | { error: string }> {
  const res = await fetch(
    `/api/checkout/session?session_id=${encodeURIComponent(sessionId)}`,
    { cache: "no-store" }
  );
  const data = (await res.json().catch(() => ({}))) as VerifiedSession & {
    error?: string;
  };
  if (!res.ok) {
    return { error: data.error ?? "Could not verify payment." };
  }
  return data;
}

export type ConfirmedOrderClient = {
  orderNumber: string;
  kind: "marketplace_order" | "impact_member";
  sessionId: string;
  amountTotalCents: number;
  currency: string;
  customerEmail: string | null;
  customerId: string | null;
  subscriptionId: string | null;
  customerName: string | null;
  shipping: {
    address: string | null;
    city: string | null;
    zip: string | null;
  };
  causeSelection: Record<string, number>;
  memberCreditCents: number;
  lineItems: Array<{
    name: string;
    quantity: number;
    amountCents: number;
  }>;
  fulfilledAt: string;
  fulfilledBy: "webhook" | "success_page" | "demo";
  status: string;
};

/** Confirm order via webhook store or Stripe retrieve (success-page fallback). */
export async function confirmPaidOrder(
  sessionId: string
): Promise<
  { order: ConfirmedOrderClient; source: string } | { error: string }
> {
  const res = await fetch(
    `/api/orders/confirm?session_id=${encodeURIComponent(sessionId)}`,
    { cache: "no-store" }
  );
  const data = (await res.json().catch(() => ({}))) as {
    order?: ConfirmedOrderClient;
    source?: string;
    error?: string;
  };
  if (!res.ok || !data.order) {
    return { error: data.error ?? "Could not confirm order." };
  }
  return { order: data.order, source: data.source ?? "stripe" };
}
