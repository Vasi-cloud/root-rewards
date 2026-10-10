import "server-only";

import { firebaseConfig } from "@/lib/firebase/config";

export type StoredShopApplication = {
  id: string;
  shopName: string;
  sellerType: "business" | "individual";
  companyName: string;
  servicesOffered: string;
  email: string;
  status: "pending" | "approved";
  autoApproved: false;
  appliedAt: string;
};

const DEMO_SHOP_IDS = new Set([
  "demo-green-grove",
  "demo-tide-line",
  "demo-leaf-counsel",
  "demo-stitch-salvage",
  "demo-bloom-path",
  "demo-patch-garden",
  "demo-lea-valley-cycle-hire",
]);

type RestField = { stringValue?: string; booleanValue?: boolean };

function firestoreBase(): string | null {
  const projectId = firebaseConfig.projectId?.trim();
  const apiKey = firebaseConfig.apiKey?.trim();
  if (!projectId || !apiKey) return null;
  return (
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}` +
    `/databases/(default)/documents/shopApplications?key=${encodeURIComponent(apiKey)}`
  );
}

function restString(fields: Record<string, RestField> | undefined, key: string) {
  const value = fields?.[key]?.stringValue;
  return typeof value === "string" ? value : "";
}

function docId(name: string): string {
  const parts = name.split("/");
  return parts[parts.length - 1] ?? "";
}

function toStored(
  id: string,
  fields: Record<string, RestField> | undefined
): StoredShopApplication | null {
  if (!id || DEMO_SHOP_IDS.has(id)) return null;
  const shopName = restString(fields, "shopName").trim();
  if (!shopName) return null;
  const status = restString(fields, "status") === "approved" ? "approved" : "pending";
  if (restString(fields, "status") !== "pending" && status !== "approved") return null;
  const sellerType = restString(fields, "sellerType");
  return {
    id,
    shopName,
    sellerType: sellerType === "individual" ? "individual" : "business",
    companyName: restString(fields, "companyName"),
    servicesOffered: restString(fields, "servicesOffered"),
    email: restString(fields, "email"),
    status,
    autoApproved: false,
    appliedAt: restString(fields, "appliedAt") || new Date().toISOString(),
  };
}

/** Shop applications only. Does not read the marketplace. */
export async function listStoredShopApplications(): Promise<StoredShopApplication[]> {
  const base = firestoreBase();
  if (!base) return [];
  const res = await fetch(base, { cache: "no-store" });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    console.error("[shop-applications] list failed", res.status, detail);
    return [];
  }
  const body = (await res.json()) as {
    documents?: { name?: string; fields?: Record<string, RestField> }[];
  };
  const rows: StoredShopApplication[] = [];
  for (const doc of body.documents ?? []) {
    const row = toStored(docId(doc.name ?? ""), doc.fields);
    if (row) rows.push(row);
  }
  return rows;
}

/** One new application, status pending. Does not write the existing shops. */
export async function createStoredShopApplication(input: {
  id: string;
  shopName: string;
  sellerType?: string;
  companyName?: string;
  servicesOffered?: string;
  email?: string;
  appliedAt?: string;
}): Promise<StoredShopApplication | null> {
  const shopName = input.shopName.trim();
  if (!shopName) return null;
  const id = input.id
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  if (!id || DEMO_SHOP_IDS.has(id)) return null;
  const base = firestoreBase();
  if (!base) return null;
  const sellerType = input.sellerType === "individual" ? "individual" : "business";
  const created: StoredShopApplication = {
    id,
    shopName: shopName.slice(0, 120),
    sellerType,
    companyName: (input.companyName ?? shopName).trim().slice(0, 120),
    servicesOffered: (input.servicesOffered ?? "").trim().slice(0, 200),
    email: (input.email ?? "").trim().slice(0, 320),
    status: "pending",
    autoApproved: false,
    appliedAt: input.appliedAt || new Date().toISOString(),
  };
  const res = await fetch(`${base}&documentId=${encodeURIComponent(id)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: {
        shopName: { stringValue: created.shopName },
        sellerType: { stringValue: created.sellerType },
        companyName: { stringValue: created.companyName },
        servicesOffered: { stringValue: created.servicesOffered },
        email: { stringValue: created.email },
        status: { stringValue: "pending" },
        autoApproved: { booleanValue: false },
        appliedAt: { stringValue: created.appliedAt },
      },
    }),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    console.error("[shop-applications] create failed", res.status, detail);
    return null;
  }
  return created;
}

/** Set one application to approved. Does not touch the existing shops. */
export async function approveStoredShopApplication(id: string): Promise<boolean> {
  const clean = id
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  if (!clean || DEMO_SHOP_IDS.has(clean)) return false;
  const base = firestoreBase();
  if (!base) return false;
  const url = base.replace(
    "/shopApplications?key=",
    `/shopApplications/${encodeURIComponent(clean)}?updateMask.fieldPaths=status&updateMask.fieldPaths=reviewedAt&key=`
  );
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: {
        status: { stringValue: "approved" },
        reviewedAt: { stringValue: new Date().toISOString() },
      },
    }),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    console.error("[shop-applications] approve failed", res.status, detail);
    return false;
  }
  return true;
}
