import {
  isLeaValleyHireListing,
  LEA_VALLEY_SHOP_NAME,
  LEA_VALLEY_UID,
  leaValleyHireTitle,
} from "@/lib/lea-valley-guest";

export const HIRE_REQUEST_CONFIRMATION =
  "Request sent — the seller confirms. This is not a booking.";

export type HireRequest = {
  id: string;
  listingId: string;
  listingTitle: string;
  name: string;
  email: string;
  dates: string;
  shopUid: string;
  shopName: string;
  createdAt: string;
  status: "new";
};

/** Shared server store only — Seller Hub reads this, not the shopper tab. */
export async function submitLeaValleyHireRequest(input: {
  listingId: string;
  listingTitle: string;
  name: string;
  email: string;
  dates: string;
}): Promise<HireRequest> {
  const listingTitle = leaValleyHireTitle(input.listingId, input.listingTitle);
  if (
    !isLeaValleyHireListing({
      id: input.listingId,
      name: listingTitle,
    })
  ) {
    throw new Error("This listing does not take hire requests here.");
  }

  const payload: HireRequest = {
    id: `hr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    listingId: input.listingId,
    listingTitle,
    name: input.name.trim(),
    email: input.email.trim(),
    dates: input.dates.trim(),
    shopUid: LEA_VALLEY_UID,
    shopName: LEA_VALLEY_SHOP_NAME,
    createdAt: new Date().toISOString(),
    status: "new",
  };

  const res = await fetch("/api/hire-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as {
    request?: HireRequest;
    error?: string;
  };
  if (!res.ok || !data.request) {
    throw new Error(data.error ?? "Could not send this request.");
  }
  return data.request;
}
