import "server-only";

import type { HireRequest, HireRequestStatus } from "@/lib/hire-requests";
import { getHireRequest } from "@/lib/hire-requests-store";
import { firebaseConfig } from "@/lib/firebase/config";
import {
  isLeaValleyHireListing,
  LEA_VALLEY_SHOP_NAME,
  LEA_VALLEY_UID,
} from "@/lib/lea-valley-guest";

type RestField = {
  stringValue?: string;
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number;
};

function restString(
  fields: Record<string, RestField> | undefined,
  key: string
): string {
  const value = fields?.[key]?.stringValue;
  return typeof value === "string" ? value : "";
}

function restBool(
  fields: Record<string, RestField> | undefined,
  key: string
): boolean {
  return fields?.[key]?.booleanValue === true;
}

function restPounds(
  fields: Record<string, RestField> | undefined,
  key: string
): number | undefined {
  const field = fields?.[key];
  const n =
    typeof field?.doubleValue === "number"
      ? field.doubleValue
      : field?.integerValue != null
        ? Number(field.integerValue)
        : Number.NaN;
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.round(n * 100) / 100;
}

function parseStatus(raw: string): HireRequestStatus {
  if (raw === "Confirmed" || raw === "Declined" || raw === "Paid") return raw;
  return "new";
}

function parseHireRequest(
  id: string,
  fields: Record<string, RestField> | undefined
): HireRequest | null {
  const listingId = restString(fields, "listingId");
  const listingTitle = restString(fields, "listingTitle");
  const name = restString(fields, "name");
  const email = restString(fields, "email");
  const dates = restString(fields, "dates");
  if (!name || !email || !dates || !listingTitle) return null;
  if (!isLeaValleyHireListing({ id: listingId, name: listingTitle })) {
    return null;
  }
  const createdAt = restString(fields, "createdAt");
  return {
    id,
    listingId,
    listingTitle,
    name,
    email,
    dates,
    shopUid: LEA_VALLEY_UID,
    shopName: restString(fields, "shopName") || LEA_VALLEY_SHOP_NAME,
    createdAt: createdAt || new Date().toISOString(),
    status: parseStatus(restString(fields, "status")),
    seen: restBool(fields, "seen"),
    paidTotal: restPounds(fields, "paidTotal"),
    sellerShare: restPounds(fields, "sellerShare"),
    partnerPot: restPounds(fields, "partnerPot"),
  };
}

async function getHireRequestFromSellerStore(
  id: string
): Promise<HireRequest | null> {
  const projectId = firebaseConfig.projectId?.trim();
  const apiKey = firebaseConfig.apiKey?.trim();
  if (!projectId || !apiKey) return null;

  const url =
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}` +
    `/databases/(default)/documents/shops/${encodeURIComponent(LEA_VALLEY_UID)}` +
    `/hireRequests/${encodeURIComponent(id)}?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const body = (await res.json()) as { fields?: Record<string, RestField> };
  return parseHireRequest(id, body.fields);
}

/** Same shops/{Lea Valley}/hireRequests doc Seller Hub writes on Confirm. */
export async function getHireRequestForPay(
  id: string
): Promise<HireRequest | null> {
  if (!id) return null;
  try {
    const fromSeller = await getHireRequestFromSellerStore(id);
    if (fromSeller) return fromSeller;
  } catch {
    // Local store still covers the instance that received Confirm.
  }
  return getHireRequest(id);
}
