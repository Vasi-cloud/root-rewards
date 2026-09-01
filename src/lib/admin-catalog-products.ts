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
import type { CommerceType, ListingType, Product } from "@/types";

/** Same key Marketplace reads via listLiveMarketplaceProducts → listAdminCatalogProducts. */
export const LIVE_PRODUCTS_LOCAL_KEY = "forest-buddies-live-products";
const LOCAL_KEY = LIVE_PRODUCTS_LOCAL_KEY;

/** Bumped after a successful catalog write so Marketplace can refetch. */
export const CATALOG_UPDATED_EVENT = "fb-catalog-updated";
export const CATALOG_REV_KEY = "forest-buddies-catalog-rev";

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
  /** product | service | rental */
  listingType: ListingType;
  commerceType: CommerceType;
  amazonAffiliateUrl?: string;
  imageUrl?: string;
  /** Optional area / notes for services & rentals */
  availabilityNote?: string;
};

export type SaveAdminProductResult = {
  product: AdminCatalogProduct;
  /** Where the authoritative write landed */
  persist: "firestore" | "local";
  /** Only set when Firebase is unavailable (local-only mode) */
  warning?: string;
};

function loadLocal(): AdminCatalogProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;
    return Array.isArray(parsed)
      ? parsed
          .filter((p) => p && typeof p.id === "string")
          .map((p) => normalizeAdminProduct(p as { id: string } & Record<string, unknown>))
      : [];
  } catch {
    return [];
  }
}

function saveLocal(products: AdminCatalogProduct[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(products));
}

function notifyCatalogUpdated() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CATALOG_REV_KEY, String(Date.now()));
  } catch {
    // ignore quota
  }
  window.dispatchEvent(new Event(CATALOG_UPDATED_EVENT));
}

/**
 * Merge Firestore + local: FS wins for shared ids unless local is strictly newer
 * (covers a write that landed locally before cloud sync). Local-only ids kept.
 */
function mergeFsPreferCloud(
  fromFs: AdminCatalogProduct[],
  local: AdminCatalogProduct[]
): AdminCatalogProduct[] {
  const byId = new Map<string, AdminCatalogProduct>();
  for (const p of fromFs) byId.set(p.id, p);
  for (const p of local) {
    const prev = byId.get(p.id);
    if (!prev) {
      byId.set(p.id, p);
      continue;
    }
    if ((p.updatedAt ?? "") > (prev.updatedAt ?? "")) {
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
    return "Firestore permission denied. Sign in as the allowlisted admin email and confirm firestore.rules allow products update.";
  }
  if (code === "not-found") {
    return "Firestore document not found. Try creating the product again.";
  }
  return `Firestore update failed${code ? ` (${code})` : ""}: ${message}`;
}

/** Remove undefined fields — Firestore setDoc rejects them. */
function toFirestorePayload(
  product: AdminCatalogProduct
): Record<string, unknown> {
  const { stock, ...rest } = product;
  const payload: Record<string, unknown> = {
    ...rest,
    stock: product.commerceType === "affiliate" ? null : stock,
    ecoScore: product.sustainabilityScore,
    // Alias some clients / consoles may show
    amazonUrl: product.amazonAffiliateUrl ?? null,
  };
  for (const key of Object.keys(payload)) {
    if (payload[key] === undefined) delete payload[key];
  }
  return payload;
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
    "Legal",
    "Consulting",
    "Workshops",
    "Repair & Upcycling",
    "Wellness",
    "Garden & Outdoor",
    "Home Services",
    "Mobility",
    "Tools",
    "Events",
    "Water Sports",
  ];
  const match = known.find(
    (c) => c.toLowerCase() === trimmed.toLowerCase()
  );
  if (match) return match;
  return trimmed.slice(0, 48);
}

function parseListingType(raw: unknown): ListingType {
  if (raw === "service" || raw === "rental" || raw === "product") return raw;
  return "product";
}

function readAmazonUrlField(raw: Record<string, unknown>): string | undefined {
  const primary = String(raw.amazonAffiliateUrl ?? "").trim();
  if (primary) return primary;
  const alias = String(raw.amazonUrl ?? "").trim();
  return alias || undefined;
}

function normalizeAdminProduct(
  raw: { id: string } & Record<string, unknown>
): AdminCatalogProduct {
  const amazonRaw = readAmazonUrlField(raw);
  const listingType = parseListingType(raw.listingType);
  const commerceType: CommerceType =
    listingType !== "product"
      ? "first_party"
      : raw.commerceType === "affiliate" || Boolean(amazonRaw)
        ? "affiliate"
        : "first_party";

  let amazonAffiliateUrl: string | undefined;
  if (commerceType === "affiliate" && amazonRaw) {
    const normalized = normalizeAmazonProductUrl(amazonRaw);
    amazonAffiliateUrl = isValidAmazonAffiliateUrl(normalized)
      ? ensureAmazonAffiliateTag(normalized)
      : normalized;
  }

  const amazonAsinRaw =
    typeof raw.amazonAsin === "string" ? raw.amazonAsin.trim() : "";
  const amazonAsin =
    amazonAsinRaw ||
    (amazonAffiliateUrl
      ? extractAsinFromAmazonUrl(amazonAffiliateUrl) ?? undefined
      : undefined);

  const ecoRaw = raw.sustainabilityScore ?? raw.ecoScore;
  const ecoNum = Number(ecoRaw);
  const sustainabilityScore = Number.isFinite(ecoNum)
    ? Math.min(100, Math.max(0, ecoNum))
    : 90;

  const imageTrimmed = String(raw.imageUrl ?? "").trim();
  const availabilityNote = String(raw.availabilityNote ?? "").trim() || undefined;

  return {
    id: raw.id,
    name: String(raw.name ?? "").trim() || "Untitled",
    description: String(raw.description ?? "").trim(),
    price: Number(raw.price) || 0,
    imageUrl:
      imageTrimmed ||
      (commerceType === "affiliate"
        ? "/eco-cards.svg"
        : listingType === "rental"
          ? "/eco-tent.svg"
          : listingType === "service"
            ? "/eco-cards.svg"
            : "/eco-tote.svg"),
    category: normalizeProductCategory(
      typeof raw.category === "string" ? raw.category : undefined
    ),
    sustainabilityScore,
    affiliateCommissionPercent:
      Number(raw.affiliateCommissionPercent) ||
      (commerceType === "affiliate" ? 4 : 10),
    listingType,
    commerceType,
    amazonAffiliateUrl:
      listingType === "product" ? amazonAffiliateUrl : undefined,
    amazonAsin:
      listingType === "product" ? amazonAsin || undefined : undefined,
    availabilityNote,
    stock:
      commerceType === "affiliate" || listingType !== "product"
        ? null
        : raw.stock == null
          ? 0
          : Math.max(0, Number(raw.stock) || 0),
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : undefined,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
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
  if (
    input.listingType === "product" &&
    input.commerceType === "affiliate"
  ) {
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
  const listingType = parseListingType(input.listingType);
  const commerceType: CommerceType =
    listingType !== "product"
      ? "first_party"
      : input.commerceType === "affiliate"
        ? "affiliate"
        : "first_party";
  return normalizeAdminProduct({
    id,
    name: input.name,
    description: input.description,
    price: input.price,
    imageUrl: input.imageUrl?.trim() || undefined,
    category: input.category,
    sustainabilityScore: eco,
    listingType,
    commerceType,
    amazonAffiliateUrl:
      listingType === "product" && commerceType === "affiliate"
        ? input.amazonAffiliateUrl
        : undefined,
    availabilityNote: input.availabilityNote?.trim() || undefined,
    stock:
      listingType !== "product" || commerceType === "affiliate"
        ? null
        : input.stock,
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * List admin-managed catalog products.
 * Prefers Firestore; keeps local-only rows and strictly-newer local edits.
 */
export async function listAdminCatalogProducts(): Promise<AdminCatalogProduct[]> {
  const local = loadLocal();
  const db = getFirebaseFirestore();
  if (db) {
    try {
      const snapshot = await getDocs(collection(db, "products"));
      const fromFs = snapshot.docs.map((d) =>
        normalizeAdminProduct({
          id: d.id,
          ...(d.data() as Record<string, unknown>),
        })
      );
      const merged = mergeFsPreferCloud(fromFs, local);
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

/**
 * Create or update a product on the same Firestore document id.
 * When Firebase is configured, a failed write throws (no silent local-only success).
 */
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
      // Same doc id for create and edit (e.g. live-…).
      await setDoc(doc(db, "products", product.id), toFirestorePayload(product));
      upsertLocal(product);
      notifyCatalogUpdated();
      return { product, persist: "firestore" };
    } catch (e) {
      console.error("[products] Firestore save/update failed", e);
      // Do not silently treat as success — Admin must see the real error.
      throw new Error(firestoreErrorMessage(e));
    }
  }

  // Firebase not configured — local is the only store.
  upsertLocal(product);
  notifyCatalogUpdated();
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
      console.error("[products] Firestore delete failed", e);
      throw new Error(firestoreErrorMessage(e));
    }
  }

  saveLocal(loadLocal().filter((p) => p.id !== id));
  notifyCatalogUpdated();
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
