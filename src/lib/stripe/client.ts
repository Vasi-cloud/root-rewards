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

export async function startDonateCheckout(
  body: unknown
): Promise<{ url: string } | { demo: true } | { error: string }> {
  try {
    const res = await fetch("/api/donate/create-session", {
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
      const apiError =
        typeof data.error === "string" && data.error.trim()
          ? data.error.trim()
          : null;
      if (apiError) return { error: apiError };
      if (res.status >= 500) {
        return {
          error:
            "Donation checkout could not start (server error). Please try again.",
        };
      }
      return { error: "Could not start donation checkout. Please try again." };
    }
    return { url: data.url };
  } catch {
    return {
      error:
        "Could not reach donation checkout. Check your connection and try again.",
    };
  }
}

export async function startMembershipCheckout(
  body: unknown
): Promise<
  | { url: string }
  | { demo: true }
  | {
      alreadyMember: true;
      customerId: string | null;
      subscriptionId: string | null;
      periodEndsAt: string | null;
      cancelAtPeriodEnd: boolean;
      /** Always /membership (or absolute) — never Checkout */
      url: string;
      membershipUrl?: string | null;
      portalUrl?: string | null;
    }
  | { error: string; membershipUrl?: string; url?: string }
> {
  const res = await fetch("/api/membership/create-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    url?: string;
    mode?: string;
    error?: string;
    alreadyMember?: boolean;
    customerId?: string | null;
    subscriptionId?: string | null;
    periodEndsAt?: string | null;
    cancelAtPeriodEnd?: boolean;
    membershipUrl?: string | null;
    portalUrl?: string | null;
  };
  if (res.status === 503 || data.mode === "demo") {
    return { demo: true };
  }
  if (data.alreadyMember) {
    const dest =
      data.membershipUrl?.trim() ||
      data.url?.trim() ||
      "/membership";
    // Never treat a Checkout URL as the already-member destination
    const safeUrl =
      dest.includes("checkout.stripe.com") ? "/membership" : dest;
    return {
      alreadyMember: true,
      customerId: data.customerId ?? null,
      subscriptionId: data.subscriptionId ?? null,
      periodEndsAt: data.periodEndsAt ?? null,
      cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
      url: safeUrl,
      membershipUrl: safeUrl,
      portalUrl: data.portalUrl ?? null,
    };
  }
  if (res.status === 409) {
    return {
      error:
        data.error ??
        "Could not verify membership. Open Membership instead of Checkout.",
      membershipUrl: data.membershipUrl ?? data.url ?? "/membership",
      url: data.url ?? data.membershipUrl ?? "/membership",
    };
  }
  if (!res.ok || !data.url) {
    return { error: data.error ?? "Could not start membership checkout." };
  }
  return { url: data.url };
}

export type MembershipReconcileClient = {
  mode: "live" | "demo";
  tierId: "free" | "impact";
  customerId: string | null;
  subscriptionId: string | null;
  periodEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  status: string | null;
  reconciled: boolean;
};

/** Login/sign-up: resolve plan from Stripe (source of truth). */
export async function reconcileMembership(opts: {
  email?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
  userId?: string | null;
}): Promise<MembershipReconcileClient | { error: string }> {
  try {
    const res = await fetch("/api/membership/reconcile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: opts.email ?? undefined,
        customerId: opts.customerId ?? undefined,
        subscriptionId: opts.subscriptionId ?? undefined,
        userId: opts.userId ?? undefined,
      }),
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as MembershipReconcileClient & {
      error?: string;
    };
    if (!res.ok) {
      return { error: data.error ?? "Could not reconcile membership." };
    }
    return data;
  } catch {
    return { error: "Could not reconcile membership." };
  }
}

export async function openBillingPortal(opts: {
  email: string;
  customerId?: string | null;
}): Promise<
  | { url: string; customerId: string | null }
  | { error: string }
> {
  const res = await fetch("/api/membership/portal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: opts.email,
      customerId: opts.customerId ?? undefined,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    url?: string;
    customerId?: string | null;
    error?: string;
  };
  if (!res.ok || !data.url) {
    return { error: data.error ?? "Could not open billing portal." };
  }
  return {
    url: data.url,
    customerId: data.customerId?.startsWith("cus_") ? data.customerId : null,
  };
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
  causeGifts?: Record<string, number>;
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
