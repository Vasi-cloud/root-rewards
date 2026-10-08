import "server-only";

import { firebaseConfig } from "@/lib/firebase/config";
import {
  isLeaValleyHireListing,
  isLeaValleyLiveBike,
  LEA_VALLEY_UID,
} from "@/lib/lea-valley-guest";

export type StoredHireListing = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  price: number;
  hirePeriod: string;
  category: string;
  status: "pending" | "approved" | "rejected";
  autoApproved: false;
  listingType: "rental";
  createdAt: string;
};

type RestField = {
  stringValue?: string;
  booleanValue?: boolean;
  doubleValue?: number;
  integerValue?: string;
};

function firestoreBase(): string | null {
  const projectId = firebaseConfig.projectId?.trim();
  const apiKey = firebaseConfig.apiKey?.trim();
  if (!projectId || !apiKey) return null;
  return (
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}` +
    `/databases/(default)/documents/shops/${encodeURIComponent(LEA_VALLEY_UID)}` +
    `/hireListings?key=${encodeURIComponent(apiKey)}`
  );
}

function restString(fields: Record<string, RestField> | undefined, key: string) {
  const value = fields?.[key]?.stringValue;
  return typeof value === "string" ? value : "";
}

function restNumber(fields: Record<string, RestField> | undefined, key: string) {
  const field = fields?.[key];
  const n =
    typeof field?.doubleValue === "number"
      ? field.doubleValue
      : field?.integerValue != null
        ? Number(field.integerValue)
        : Number.NaN;
  return Number.isFinite(n) ? n : 0;
}

function docId(name: string): string {
  const parts = name.split("/");
  return parts[parts.length - 1] ?? "";
}

function isLiveBikeId(id: string): boolean {
  return isLeaValleyLiveBike({ id });
}

function toStored(
  id: string,
  fields: Record<string, RestField> | undefined
): StoredHireListing | null {
  if (!id || isLiveBikeId(id)) return null;
  const name = restString(fields, "name").trim();
  if (!name) return null;
  const rawStatus = restString(fields, "status");
  const status =
    rawStatus === "approved"
      ? "approved"
      : rawStatus === "rejected"
        ? "rejected"
        : "pending";
  return {
    id,
    name,
    subtitle: restString(fields, "subtitle"),
    description: restString(fields, "description"),
    price: restNumber(fields, "price"),
    hirePeriod: restString(fields, "hirePeriod"),
    category: restString(fields, "category") || "Cycling",
    status,
    autoApproved: false,
    listingType: "rental",
    createdAt: restString(fields, "createdAt") || new Date().toISOString(),
  };
}

/** Lea Valley hire listings only. Does not read the marketplace. */
export async function listStoredHireListings(): Promise<StoredHireListing[]> {
  const base = firestoreBase();
  if (!base) return [];
  const res = await fetch(base, { cache: "no-store" });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    console.error("[hire-listings] list failed", res.status, detail);
    return [];
  }
  const body = (await res.json()) as {
    documents?: { name?: string; fields?: Record<string, RestField> }[];
  };
  const rows: StoredHireListing[] = [];
  for (const doc of body.documents ?? []) {
    const row = toStored(docId(doc.name ?? ""), doc.fields);
    if (row) rows.push(row);
  }
  return rows;
}

/** One new hire, status pending. Refuses the five live bikes. */
export async function createStoredHireListing(
  input: StoredHireListing
): Promise<StoredHireListing | null> {
  if (input.listingType !== "rental") return null;
  if (isLiveBikeId(input.id) || isLeaValleyHireListing(input)) return null;
  const name = input.name.trim();
  if (!name) return null;
  const base = firestoreBase();
  if (!base) return null;
  const id = input.id.slice(0, 80);
  const created: StoredHireListing = {
    id,
    name: name.slice(0, 200),
    subtitle: input.subtitle.slice(0, 200),
    description: input.description.slice(0, 2000),
    price: Number(input.price) || 0,
    hirePeriod: input.hirePeriod.slice(0, 80),
    category: (input.category || "Cycling").slice(0, 80),
    status: "pending",
    autoApproved: false,
    listingType: "rental",
    createdAt: input.createdAt || new Date().toISOString(),
  };
  const url = `${base}&documentId=${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: {
        name: { stringValue: created.name },
        subtitle: { stringValue: created.subtitle },
        description: { stringValue: created.description },
        price: { doubleValue: created.price },
        hirePeriod: { stringValue: created.hirePeriod },
        category: { stringValue: created.category },
        status: { stringValue: "pending" },
        autoApproved: { booleanValue: false },
        listingType: { stringValue: "rental" },
        createdAt: { stringValue: created.createdAt },
      },
    }),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    console.error("[hire-listings] create failed", res.status, detail);
    return null;
  }
  return created;
}
