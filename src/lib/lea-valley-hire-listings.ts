import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { getFirebaseFirestore } from "@/lib/firebase/firestore";
import {
  isLeaValleyHireListing,
  isLeaValleyLiveBike,
  LEA_VALLEY_UID,
  leaValleyApprovedHireProducts,
} from "@/lib/lea-valley-guest";
import type { SellerProduct } from "@/types";

const COLLECTION = "hireListings";

export type LeaValleyServerHire = SellerProduct & { status: "pending" | "approved" };

function hireNameKey(name: string) {
  return name.trim().toLowerCase();
}

function isLiveHire(product: { id?: string; name?: string }): boolean {
  return isLeaValleyLiveBike(product) || isLeaValleyHireListing(product);
}

function toHireProduct(
  id: string,
  data: Record<string, unknown>
): LeaValleyServerHire | null {
  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (!name || isLiveHire({ id, name })) return null;
  const status = data.status === "approved" ? "approved" : "pending";
  const price = Number(data.price);
  return {
    id,
    listingType: "rental",
    name,
    subtitle: typeof data.subtitle === "string" ? data.subtitle : "",
    description: typeof data.description === "string" ? data.description : "",
    category: typeof data.category === "string" && data.category ? data.category : "Cycling",
    tags: [],
    price: Number.isFinite(price) ? price : 0,
    ecoScore: 90,
    stock: 1,
    status,
    autoApproved: false,
    views: 0,
    sales: 0,
    hirePeriod: typeof data.hirePeriod === "string" ? data.hirePeriod : undefined,
    createdAt:
      typeof data.createdAt === "string"
        ? data.createdAt
        : new Date().toISOString(),
  };
}

/** One new hire. Pending. Does not write the five live bikes. */
export async function saveNewLeaValleyHireListing(
  product: SellerProduct
): Promise<boolean> {
  if (product.listingType !== "rental") return false;
  if (isLiveHire(product)) return false;
  const name = product.name.trim();
  if (!name) return false;
  const db = getFirebaseFirestore();
  if (!db) return false;
  const id = product.id.slice(0, 80);
  await setDoc(doc(db, "shops", LEA_VALLEY_UID, COLLECTION, id), {
    name: name.slice(0, 200),
    subtitle: (product.subtitle ?? "").slice(0, 200),
    description: (product.description ?? "").slice(0, 2000),
    price: Number(product.price) || 0,
    hirePeriod: (product.hirePeriod ?? "").slice(0, 80),
    category: (product.category || "Cycling").slice(0, 80),
    status: "pending",
    autoApproved: false,
    listingType: "rental",
    createdAt: product.createdAt || new Date().toISOString(),
  });
  return true;
}

/** Lea Valley hire listings only. Not the marketplace catalog. */
export async function listLeaValleyHireListings(): Promise<LeaValleyServerHire[]> {
  const db = getFirebaseFirestore();
  if (!db) return [];
  const snap = await getDocs(
    collection(db, "shops", LEA_VALLEY_UID, COLLECTION)
  );
  const rows: LeaValleyServerHire[] = [];
  for (const item of snap.docs) {
    const product = toHireProduct(item.id, item.data() as Record<string, unknown>);
    if (product) rows.push(product);
  }
  return rows;
}

/** Approved hires for the public shop. Anonymous read. */
export async function listApprovedLeaValleyHireListings(): Promise<
  LeaValleyServerHire[]
> {
  const db = getFirebaseFirestore();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, "shops", LEA_VALLEY_UID, COLLECTION),
      where("status", "==", "approved")
    )
  );
  const rows: LeaValleyServerHire[] = [];
  for (const item of snap.docs) {
    const product = toHireProduct(item.id, item.data() as Record<string, unknown>);
    if (product?.status === "approved") rows.push(product);
  }
  return rows;
}

export async function approveLeaValleyHireListing(id: string): Promise<boolean> {
  if (!id || isLeaValleyLiveBike({ id })) return false;
  const db = getFirebaseFirestore();
  if (!db) return false;
  await updateDoc(doc(db, "shops", LEA_VALLEY_UID, COLLECTION, id), {
    status: "approved",
    reviewedAt: new Date().toISOString(),
  });
  return true;
}

/** Five live bikes, plus approved server hires. Does not drop the bikes. */
export function withApprovedServerHires(
  extras: SellerProduct[]
): SellerProduct[] {
  const base = leaValleyApprovedHireProducts();
  const seen = new Set(base.map((product) => product.id));
  const names = new Set(base.map((product) => hireNameKey(product.name)));
  const add = extras.filter((product) => {
    if (product.status !== "approved" || isLiveHire(product)) return false;
    if (seen.has(product.id)) return false;
    const name = hireNameKey(product.name);
    if (name && names.has(name)) return false;
    return true;
  });
  return [...base, ...add];
}
