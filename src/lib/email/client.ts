/** Browser helpers for transactional email APIs. */

export async function requestWelcomeEmail(opts: {
  email: string;
  name?: string | null;
  userId?: string | null;
}): Promise<{ ok: boolean; mode?: string; error?: string }> {
  try {
    const res = await fetch("/api/email/welcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: opts.email,
        name: opts.name ?? undefined,
        userId: opts.userId ?? undefined,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      mode?: string;
      error?: string;
    };
    if (!res.ok) return { ok: false, error: data.error ?? "Welcome email failed." };
    return { ok: true, mode: data.mode };
  } catch {
    return { ok: false, error: "Welcome email failed." };
  }
}

export async function requestAbandonedCartEmail(opts: {
  email: string;
  previewNames: string[];
  itemCount: number;
  totalPrice: number;
}): Promise<{
  ok: boolean;
  mode?: "live" | "demo";
  error?: string;
}> {
  try {
    const res = await fetch("/api/email/abandoned-cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      mode?: "live" | "demo";
      error?: string;
    };
    if (!res.ok) {
      return { ok: false, error: data.error ?? "Could not send reminder." };
    }
    return { ok: true, mode: data.mode };
  } catch {
    return { ok: false, error: "Could not send reminder." };
  }
}
