"use client";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";

import { isAdminUser } from "@/lib/admin";
import {
  ensureAmazonAffiliateTag,
  extractAsinFromAmazonUrl,
  isValidAmazonAffiliateUrl,
} from "@/lib/amazon-affiliate";
import { getFirebaseFirestore } from "@/lib/firebase/firestore";
import type { CommerceType, Product } from "@/types";

const LOCAL_KEY = "forest-buddies-live-products";

export type AdminCatalogProduct = Product & {
  commerceType: CommerceType;
  /** Admin display / filters */
  stock: number | null;
  updatedAt?: string;
  createdAt?: string;
};

export type AdminProductInput = {
  id?: string;
  name: string;
  category: string;
  price: number;
  ecoScore: number;
  stock: number | null;
  description: string;
  commerceType: CommerceType;
  amazonAffiliateUrl?: string;
  imageUrl?: string;
};

function loadLocal(): AdminCatalogProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AdminCatalogProduct[];
    return Array.isArray(parsed) ? parsed.map(normalizeAdminProduct) : [];
  } catch {
    return [];
  }
}

function saveLocal(products: AdminCatalogProduct[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(products));
}

function normalizeAdminProduct(
  raw: Partial<AdminCatalogProduct> & { id: string }
): AdminCatalogProduct {
  const commerceType: CommerceType =
    raw.commerceType === "affiliate" || Boolean(raw.amazonAffiliateUrl?.trim())
      ? "affiliate"
      : "first_party";
  const amazonAffiliateUrl =
    commerceType === "affiliate" && raw.amazonAffiliateUrl?.trim()
      ? ensureAmazonAffiliateTag(raw.amazonAffiliateUrl.trim())
      : undefined;
  const amazonAsin =
    raw.amazonAsin?.trim() ||
    (amazonAffiliateUrl
      ? extractAsinFromAmazonUrl(amazonAffiliateUrl) ?? undefined
      : undefined);

  return {
    id: raw.id,
    name: String(raw.name ?? "").trim() || "Untitled",
    description: String(raw.description ?? "").trim(),
    price: Number(raw.price) || 0,
    imageUrl:
      String(raw.imageUrl ?? "").trim() ||
      (commerceType === "affiliate" ? "/eco-cards.svg" : "/eco-tote.svg"),
    category: String(raw.category ?? "Kitchen").trim() || "Kitchen",
    sustainabilityScore: Math.min(
      100,
      Math.max(
        0,
        Number(
          raw.sustainabilityScore ??
            (raw as { ecoScore?: number }).ecoScore
        ) || 90
      )
    ),
    affiliateCommissionPercent:
      Number(raw.affiliateCommissionPercent) ||
      (commerceType === "affiliate" ? 4 : 10),
    listingType: raw.listingType === "service" ? "service" : "product",
    commerceType,
    amazonAffiliateUrl,
    amazonAsin: amazonAsin ?? undefined,
    stock:
      commerceType === "affiliate"
        ? null
        : raw.stock == null
          ? 0
          : Math.max(0, Number(raw.stock) || 0),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

/** Map admin / Firestore doc → marketplace Product. */
export function toMarketplaceProduct(p: AdminCatalogProduct): Product {
  const { stock, createdAt, updatedAt, ...product } = p;
  void stock;
  void createdAt;
  void updatedAt;
  return product;
}

export function validateAdminProductInput(
  input: AdminProductInput
): string | null {
  if (!input.name.trim()) return "Name is required.";
  if (!(input.price >= 0)) return "Price must be zero or more.";
  if (input.commerceType === "affiliate") {
    const url = input.amazonAffiliateUrl?.trim() ?? "";
    if (!url) return "Amazon affiliate URL is required for affiliate products.";
    if (!isValidAmazonAffiliateUrl(url)) {
      return "Enter a valid Amazon product URL (amazon.com or amazon.co.uk).";
    }
  }
  return null;
}

function buildFromInput(input: AdminProductInput): AdminCatalogProduct {
  const now = new Date().toISOString();
  const id = input.id?.trim() || `live-${Date.now()}`;
  return normalizeAdminProduct({
    id,
    name: input.name,
    description: input.description,
    price: input.price,
    imageUrl: input.imageUrl,
    category: input.category,
    sustainabilityScore: input.ecoScore,
    commerceType: input.commerceType,
    amazonAffiliateUrl: input.amazonAffiliateUrl,
    stock: input.commerceType === "affiliate" ? null : input.stock,
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * List admin-managed catalog products.
 * Prefers Firestore `products`; falls back to localStorage when Firebase is offline.
 */
export async function listAdminCatalogProducts(): Promise<AdminCatalogProduct[]> {
  const db = getFirebaseFirestore();
  if (db) {
    try {
      const snapshot = await getDocs(collection(db, "products"));
      const fromFs = snapshot.docs.map((d) =>
        normalizeAdminProduct({ id: d.id, ...(d.data() as object) })
      );
      // Keep a local mirror for offline marketplace merge if needed
      saveLocal(fromFs);
      return fromFs.sort((a, b) =>
        (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")
      );
    } catch (err) {
      console.warn("[products] Firestore list failed, using local cache", err);
    }
  }
  return loadLocal().sort((a, b) =>
    (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")
  );
}

/**
 * Public marketplace helper — same documents as admin catalog.
 */
export async function listLiveMarketplaceProducts(): Promise<Product[]> {
  const rows = await listAdminCatalogProducts();
  return rows.map(toMarketplaceProduct);
}

export async function saveAdminCatalogProduct(
  input: AdminProductInput,
  opts: { adminEmail?: string | null; existingCreatedAt?: string }
): Promise<AdminCatalogProduct> {
  const err = validateAdminProductInput(input);
  if (err) throw new Error(err);
  if (opts.adminEmail != null && !isAdminUser(opts.adminEmail)) {
    throw new Error("Not authorized to save products.");
  }

  const product = buildFromInput(input);
  if (opts.existingCreatedAt) {
    product.createdAt = opts.existingCreatedAt;
  }
  product.updatedAt = new Date().toISOString();

  const db = getFirebaseFirestore();
  if (db) {
    try {
      const { stock, ...rest } = product;
      await setDoc(doc(db, "products", product.id), {
        ...rest,
        stock: product.commerceType === "affiliate" ? null : stock,
        ecoScore: product.sustainabilityScore,
      });
      // Refresh local mirror
      const all = await listAdminCatalogProducts();
      const merged = all.some((p) => p.id === product.id)
        ? all.map((p) => (p.id === product.id ? product : p))
        : [product, ...all];
      saveLocal(merged);
      return product;
    } catch (e) {
      console.warn("[products] Firestore save failed, writing local", e);
    }
  }

  const local = loadLocal();
  const next = local.some((p) => p.id === product.id)
    ? local.map((p) => (p.id === product.id ? product : p))
    : [product, ...local];
  saveLocal(next);
  return product;
}

export async function deleteAdminCatalogProduct(
  id: string,
  opts: { adminEmail?: string | null }
): Promise<void> {
  if (opts.adminEmail != null && !isAdminUser(opts.adminEmail)) {
    throw new Error("Not authorized to delete products.");
  }

  const db = getFirebaseFirestore();
  if (db) {
    try {
      await deleteDoc(doc(db, "products", id));
    } catch (e) {
      console.warn("[products] Firestore delete failed, updating local", e);
    }
  }

  saveLocal(loadLocal().filter((p) => p.id !== id));
}

/**
 * Merge static seed catalog with live admin products.
 * Live docs win on id collision.
 */
export function mergeMarketplaceCatalog(
  seed: Product[],
  live: Product[]
): Product[] {
  const byId = new Map<string, Product>();
  for (const p of seed) byId.set(p.id, p);
  for (const p of live) byId.set(p.id, p);
  // Live-only affiliate / new items first, then remaining seed order
  const liveIds = new Set(live.map((p) => p.id));
  const liveFirst = live.filter((p) => liveIds.has(p.id));
  const seedRest = seed.filter((p) => !liveIds.has(p.id));
  return [...liveFirst, ...seedRest];
}
