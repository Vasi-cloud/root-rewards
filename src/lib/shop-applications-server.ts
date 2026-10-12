import "server-only";

import { firebaseConfig } from "@/lib/firebase/config";

export type StoredShopListing = {
  id: string;
  name: string;
  price: number;
  category: string;
  listingType: "product" | "service" | "rental";
  status: "pending" | "approved" | "rejected";
  stock: number;
};

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
  listings: StoredShopListing[];
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

type RestField = {
  stringValue?: string;
  booleanValue?: boolean;
  doubleValue?: number;
  integerValue?: string;
  arrayValue?: { values?: RestField[] };
  mapValue?: { fields?: Record<string, RestField> };
};

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

function restNumber(field: RestField | undefined): number {
  if (!field) return 0;
  if (typeof field.doubleValue === "number") return field.doubleValue;
  if (field.integerValue != null) return Number(field.integerValue) || 0;
  return 0;
}

function restListings(fields: Record<string, RestField> | undefined): StoredShopListing[] {
  const values = fields?.listings?.arrayValue?.values ?? [];
  const rows: StoredShopListing[] = [];
  for (const value of values) {
    const map = value.mapValue?.fields;
    const id = map?.id?.stringValue?.trim() ?? "";
    const name = map?.name?.stringValue?.trim() ?? "";
    if (!id || !name || rows.some((row) => row.id === id)) continue;
    const listingType = map?.listingType?.stringValue;
    const status = map?.status?.stringValue;
    rows.push({
      id,
      name,
      price: restNumber(map?.price),
      category: map?.category?.stringValue?.trim() || "Apparel",
      listingType:
        listingType === "service" || listingType === "rental"
          ? listingType
          : "product",
      status:
        status === "approved" || status === "rejected" ? status : "pending",
      stock: Math.max(0, Math.round(restNumber(map?.stock))),
    });
  }
  return rows;
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
    listings: restListings(fields),
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
    listings: [],
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
  if (res.status === 409 && id.startsWith("studio-product-")) {
    const existing = await readStoredShopApplication(id);
    if (!existing) return null;
    if (existing.status === "pending") {
      await replaceStudioProductDetails(id, created.servicesOffered);
      return { ...existing, servicesOffered: created.servicesOffered, status: "pending" };
    }
    return existing;
  }
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    console.error("[shop-applications] create failed", res.status, detail);
    return null;
  }
  return created;
}

async function readStoredShopApplication(
  id: string
): Promise<StoredShopApplication | null> {
  const base = firestoreBase();
  if (!base) return null;
  const url = base.replace(
    "/shopApplications?key=",
    `/shopApplications/${encodeURIComponent(id)}?key=`
  );
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const body = (await res.json()) as { fields?: Record<string, RestField> };
  return toStored(id, body.fields);
}

const STUDIO_TEE_ID = "studio-product-forest-buddies-organic-tee";

async function patchStudioTee(
  field: "servicesOffered",
  value: string
): Promise<boolean> {
  const base = firestoreBase();
  if (!base) return false;
  const url = base.replace(
    "/shopApplications?key=",
    `/shopApplications/${encodeURIComponent(STUDIO_TEE_ID)}?updateMask.fieldPaths=${field}&key=`
  );
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: { [field]: { stringValue: value } },
    }),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    console.error("[shop-applications] studio product update failed", res.status, detail);
    return false;
  }
  return true;
}

async function replaceStudioProductDetails(
  id: string,
  servicesOffered: string
): Promise<void> {
  if (id !== STUDIO_TEE_ID || !servicesOffered) return;
  await patchStudioTee("servicesOffered", servicesOffered);
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
  const docUrl = base.replace(
    "/shopApplications?key=",
    `/shopApplications/${encodeURIComponent(clean)}?key=`
  );
  const existing = await fetch(docUrl, { cache: "no-store" });
  if (!existing.ok) return false;
  const current = (await existing.json()) as {
    fields?: Record<string, RestField>;
  };
  const status = restString(current.fields, "status");
  if (status === "approved") return true;
  if (status !== "pending") return false;
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

