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
  normalizeAmazonProductUrl,
} from "@/lib/amazon-affiliate";
import { getFirebaseFirestore } from "@/lib/firebase/firestore";
import type { CommerceType, Product } from "@/types";

/** Same key Marketplace reads via listLiveMarketplaceProducts → listAdminCatalogProducts. */
export const LIVE_PRODUCTS_LOCAL_KEY = "forest-buddies-live-products";
const LOCAL_KEY = LIVE_PRODUCTS_LOCAL_KEY;

export type AdminCatalogProduct = Product & {
  commerceType: CommerceType;
  /** Admin display / filters — null for Amazon affiliate (N/A) */
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

export type SaveAdminProductResult = {
  product: AdminCatalogProduct;
  /** Where the authoritative write landed */
  persist: "firestore" | "local";
  /** Only set when cloud write failed or Firebase is unavailable */
  warning?: string;
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

/** Keep local-only rows when Firestore list would otherwise wipe them. */
function mergeByIdPreferNewer(
  primary: AdminCatalogProduct[],
  secondary: AdminCatalogProduct[]
): AdminCatalogProduct[] {
  const byId = new Map<string, AdminCatalogProduct>();
  for (const p of primary) byId.set(p.id, p);
  for (const p of secondary) {
    const prev = byId.get(p.id);
    if (!prev || (p.updatedAt ?? "") >= (prev.updatedAt ?? "")) {
      byId.set(p.id, p);
    }
  }
  return [...byId.values()];
}

function upsertLocal(product: AdminCatalogProduct) {
  const local = loadLocal();
  const next = local.some((p) => p.id === product.id)
    ? local.map((p) => (p.id === product.id ? product : p))
    : [product, ...local];
  saveLocal(next);
}

function firestoreErrorMessage(err: unknown): string {
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code?: string }).code ?? "")
      : "";
  const message = err instanceof Error ? err.message : String(err);
  if (
    code === "permission-denied" ||
    /permission/i.test(message) ||
    /insufficient/i.test(message)
  ) {
    return "Firestore permission denied — product saved on this device only. Sign in as the allowlisted admin email, or deploy firestore.rules for products.";
  }
  return `Firestore save failed (${code || "error"}): ${message}. Product saved on this device only.`;
}

/** Map free-text / unknown categories to a sensible catalog label (never block save). */
export function normalizeProductCategory(raw: string | undefined | null): string {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return "Home";
  const known = [
    "Accessories",
    "Kitchen",
    "Home",
    "Apparel",
    "Beauty",
    "Stationery",
    "Camping",
  ];
  const match = known.find(
    (c) => c.toLowerCase() === trimmed.toLowerCase()
  );
  if (match) return match;
  // Allow simple custom text categories (title-case lightly)
  return trimmed.slice(0, 48);
}

function normalizeAdminProduct(
  raw: Partial<AdminCatalogProduct> & { id: string }
): AdminCatalogProduct {
  const commerceType: CommerceType =
    raw.commerceType === "affiliate" || Boolean(raw.amazonAffiliateUrl?.trim())
      ? "affiliate"
      : "first_party";

  let amazonAffiliateUrl: string | undefined;
  if (commerceType === "affiliate" && raw.amazonAffiliateUrl?.trim()) {
    const normalized = normalizeAmazonProductUrl(raw.amazonAffiliateUrl);
    amazonAffiliateUrl = isValidAmazonAffiliateUrl(normalized)
      ? ensureAmazonAffiliateTag(normalized)
      : normalized;
  }

  const amazonAsin =
    raw.amazonAsin?.trim() ||
    (amazonAffiliateUrl
      ? extractAsinFromAmazonUrl(amazonAffiliateUrl) ?? undefined
      : undefined);

  const ecoRaw =
    raw.sustainabilityScore ?? (raw as { ecoScore?: number }).ecoScore;
  const ecoNum = Number(ecoRaw);
  const sustainabilityScore = Number.isFinite(ecoNum)
    ? Math.min(100, Math.max(0, ecoNum))
    : 90;

  const imageTrimmed = String(raw.imageUrl ?? "").trim();

  return {
    id: raw.id,
    name: String(raw.name ?? "").trim() || "Untitled",
    description: String(raw.description ?? "").trim(),
    price: Number(raw.price) || 0,
    imageUrl:
      imageTrimmed ||
      (commerceType === "affiliate" ? "/eco-cards.svg" : "/eco-tote.svg"),
    category: normalizeProductCategory(raw.category),
    sustainabilityScore,
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
    const normalized = normalizeAmazonProductUrl(url);
    if (!isValidAmazonAffiliateUrl(normalized)) {
      return "Enter an Amazon URL (amazon.com, amazon.co.uk) or short link (amzn.to).";
    }
  }
  return null;
}

function buildFromInput(input: AdminProductInput): AdminCatalogProduct {
  const now = new Date().toISOString();
  const id = input.id?.trim() || `live-${Date.now()}`;
  const eco = Number.isFinite(input.ecoScore)
    ? Math.min(100, Math.max(0, input.ecoScore))
    : 90;
  return normalizeAdminProduct({
    id,
    name: input.name,
    description: input.description,
    price: input.price,
    imageUrl: input.imageUrl?.trim() || undefined,
    category: input.category,
    sustainabilityScore: eco,
    commerceType: input.commerceType,
    amazonAffiliateUrl: input.amazonAffiliateUrl,
    stock: input.commerceType === "affiliate" ? null : input.stock,
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * List admin-managed catalog products.
 * Merges Firestore `products` with localStorage so a failed FS write
 * does not disappear after refresh, and Marketplace reads the same source.
 */
export async function listAdminCatalogProducts(): Promise<AdminCatalogProduct[]> {
  const local = loadLocal();
  const db = getFirebaseFirestore();
  if (db) {
    try {
      const snapshot = await getDocs(collection(db, "products"));
      const fromFs = snapshot.docs.map((d) =>
        normalizeAdminProduct({ id: d.id, ...(d.data() as object) })
      );
      const merged = mergeByIdPreferNewer(fromFs, local);
      saveLocal(merged);
      return merged.sort((a, b) =>
        (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")
      );
    } catch (err) {
      console.warn("[products] Firestore list failed, using local cache", err);
    }
  }
  return local.sort((a, b) =>
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
): Promise<SaveAdminProductResult> {
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
      // Local mirror only as cache after a successful cloud write (no warning).
      upsertLocal(product);
      return { product, persist: "firestore" };
    } catch (e) {
      console.warn("[products] Firestore save failed, keeping local", e);
      upsertLocal(product);
      return {
        product,
        persist: "local",
        warning: firestoreErrorMessage(e),
      };
    }
  }

  // Firebase not configured — local is the only store.
  upsertLocal(product);
  return {
    product,
    persist: "local",
    warning:
      "Firebase is not configured — product saved on this device and will show in Marketplace here.",
  };
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
  const liveIds = new Set(live.map((p) => p.id));
  const liveFirst = live.filter((p) => liveIds.has(p.id));
  const seedRest = seed.filter((p) => !liveIds.has(p.id));
  return [...liveFirst, ...seedRest];
}
