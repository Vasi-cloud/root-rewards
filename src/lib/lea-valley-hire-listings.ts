import { doc, updateDoc } from "firebase/firestore";

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

/** One new hire. Pending. Does not write the five live bikes. */
export async function saveNewLeaValleyHireListing(
  product: SellerProduct
): Promise<boolean> {
  if (product.listingType !== "rental") return false;
  if (isLiveHire(product)) return false;
  const name = product.name.trim();
  if (!name) return false;
  const res = await fetch("/api/lea-valley-hire-listings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: product.id,
      name,
      subtitle: product.subtitle ?? "",
      description: product.description ?? "",
      price: Number(product.price) || 0,
      hirePeriod: product.hirePeriod ?? "",
      category: product.category || "Cycling",
      createdAt: product.createdAt || new Date().toISOString(),
    }),
  });
  return res.ok;
}

/** Lea Valley hire listings only. Not the marketplace catalog. */
export async function listLeaValleyHireListings(): Promise<LeaValleyServerHire[]> {
  const res = await fetch("/api/lea-valley-hire-listings", { cache: "no-store" });
  if (!res.ok) return [];
  const body = (await res.json()) as { listings?: LeaValleyServerHire[] };
  return (body.listings ?? [])
    .filter((product) => product?.name && !isLeaValleyLiveBike(product))
    .map((product) => ({
      ...product,
      tags: product.tags ?? [],
      stock: product.stock ?? 1,
      sales: product.sales ?? 0,
      views: product.views ?? 0,
      ecoScore: product.ecoScore ?? 90,
      subtitle: product.subtitle ?? "",
      description: product.description ?? "",
    }));
}

/** Approved hires for the public shop. */
export async function listApprovedLeaValleyHireListings(): Promise<
  LeaValleyServerHire[]
> {
  const rows = await listLeaValleyHireListings();
  return rows.filter((product) => product.status === "approved");
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
