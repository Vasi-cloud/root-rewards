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
import { isFirebaseClientConfigured } from "@/lib/firebase/config";
import { getFirebaseFirestore } from "@/lib/firebase/firestore";
import { DEFAULT_BOOKING_NOTE, isValidHttpUrl } from "@/lib/listing-categories";
import type {
  CommerceType,
  ListingType,
  Product,
  ProviderType,
} from "@/types";

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
  /** Optional area / notes for services & rentals (legacy alias of areaServed) */
  availabilityNote?: string;
  /** Optional seller uid for first-party marketplace listings */
  sellerId?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  oemNote?: string;
  /** Service / rental provider fields */
  providerType?: ProviderType;
  providerName?: string;
  areaServed?: string;
  duration?: string;
  hirePeriod?: string;
  priceNote?: string;
  bookingUrl?: string;
  bookingNote?: string;
  contactEmail?: string;
  depositAmount?: number | null;
  whatsIncluded?: string;
  whatsNotIncluded?: string;
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

/**
 * Persist every listing type to the same Firestore `products` document shape.
 * Affiliate, first-party, service, and rental share this collection.
 */
function toFirestorePayload(
  product: AdminCatalogProduct
): Record<string, unknown> {
  const listingType = product.listingType ?? "product";
  const commerceType = product.commerceType;
  const areaServed =
    product.areaServed?.trim() || product.availabilityNote?.trim() || null;
  const sellerId = product.sellerId ?? product.sellerUid ?? null;

  const payload: Record<string, unknown> = {
    name: product.name,
    description: product.description ?? "",
    price: product.price,
    imageUrl: product.imageUrl,
    category: product.category,
    sustainabilityScore: product.sustainabilityScore,
    ecoScore: product.sustainabilityScore,
    affiliateCommissionPercent: product.affiliateCommissionPercent,
    listingType,
    commerceType,
    stock:
      commerceType === "affiliate" || listingType !== "product"
        ? null
        : product.stock ?? 0,
    createdAt: product.createdAt ?? null,
    updatedAt: product.updatedAt ?? null,
  };

  if (listingType === "product") {
    if (commerceType === "affiliate") {
      payload.amazonAffiliateUrl = product.amazonAffiliateUrl ?? null;
      payload.amazonUrl = product.amazonAffiliateUrl ?? null;
      payload.amazonAsin = product.amazonAsin ?? null;
    } else {
      payload.sellerId = sellerId;
      payload.sellerUid = sellerId;
      payload.vehicleMake = product.vehicleMake ?? null;
      payload.vehicleModel = product.vehicleModel ?? null;
      payload.vehicleYear = product.vehicleYear ?? null;
      payload.oemNote = product.oemNote ?? null;
    }
  }

  if (listingType === "service" || listingType === "rental") {
    payload.providerType = product.providerType ?? null;
    payload.providerName = product.providerName ?? null;
    payload.areaServed = areaServed;
    payload.availabilityNote = areaServed;
    payload.priceNote = product.priceNote ?? null;
    payload.bookingUrl = product.bookingUrl ?? null;
    payload.bookingNote = product.bookingNote ?? DEFAULT_BOOKING_NOTE;
    payload.contactEmail = product.contactEmail ?? null;
    payload.whatsIncluded = product.whatsIncluded ?? null;
    payload.whatsNotIncluded = product.whatsNotIncluded ?? null;
    if (listingType === "service") {
      payload.duration = product.duration ?? null;
    }
    if (listingType === "rental") {
      payload.hirePeriod = product.hirePeriod ?? null;
      payload.depositAmount =
        product.depositAmount != null ? product.depositAmount : null;
    }
  }

  for (const key of Object.keys(payload)) {
    if (payload[key] === undefined) delete payload[key];
  }
  return payload;
}

function newCatalogDocId(listingType: ListingType): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `live-${listingType}-${Date.now()}-${rand}`;
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
  "Parts",
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

function parseProviderType(raw: unknown): ProviderType | undefined {
  if (raw === "company" || raw === "self_employed") return raw;
  return undefined;
}

function optionalTrimmed(raw: unknown): string | undefined {
  const s = String(raw ?? "").trim();
  return s || undefined;
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
  const areaServed =
    optionalTrimmed(raw.areaServed) ||
    optionalTrimmed(raw.availabilityNote);
  const availabilityNote = areaServed;
  const sellerRaw = String(raw.sellerId ?? raw.sellerUid ?? "").trim();
  const sellerId = sellerRaw || undefined;
  const vehicleMake = optionalTrimmed(raw.vehicleMake);
  const vehicleModel = optionalTrimmed(raw.vehicleModel);
  const vehicleYear = optionalTrimmed(raw.vehicleYear);
  const oemNote = optionalTrimmed(raw.oemNote);

  const isBookable = listingType === "service" || listingType === "rental";
  const providerType = isBookable
    ? parseProviderType(raw.providerType) ?? "company"
    : undefined;
  const providerName = isBookable
    ? optionalTrimmed(raw.providerName)
    : undefined;
  const duration =
    listingType === "service" ? optionalTrimmed(raw.duration) : undefined;
  const hirePeriod =
    listingType === "rental" ? optionalTrimmed(raw.hirePeriod) : undefined;
  const priceNote = isBookable ? optionalTrimmed(raw.priceNote) : undefined;
  const bookingUrlRaw = isBookable ? optionalTrimmed(raw.bookingUrl) : undefined;
  const bookingUrl =
    bookingUrlRaw && isValidHttpUrl(bookingUrlRaw) ? bookingUrlRaw : undefined;
  const bookingNote = isBookable
    ? optionalTrimmed(raw.bookingNote) || DEFAULT_BOOKING_NOTE
    : undefined;
  const contactEmail = isBookable
    ? optionalTrimmed(raw.contactEmail)
    : undefined;
  const depositRaw = Number(raw.depositAmount);
  const depositAmount =
    listingType === "rental" && Number.isFinite(depositRaw) && depositRaw > 0
      ? depositRaw
      : undefined;
  const whatsIncluded = isBookable
    ? optionalTrimmed(raw.whatsIncluded)
    : undefined;
  const whatsNotIncluded = isBookable
    ? optionalTrimmed(raw.whatsNotIncluded)
    : undefined;

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
    areaServed,
    sellerId,
    sellerUid: sellerId,
    vehicleMake,
    vehicleModel,
    vehicleYear,
    oemNote,
    providerType,
    providerName,
    duration,
    hirePeriod,
    priceNote,
    bookingUrl,
    bookingNote,
    contactEmail,
    depositAmount,
    whatsIncluded,
    whatsNotIncluded,
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
  if (input.listingType === "service" || input.listingType === "rental") {
    if (
      input.providerType !== "company" &&
      input.providerType !== "self_employed"
    ) {
      return "Provider type is required for services and rentals.";
    }
    if (!input.providerName?.trim()) {
      return "Provider name is required for services and rentals.";
    }
    const booking = input.bookingUrl?.trim() ?? "";
    if (booking && !isValidHttpUrl(booking)) {
      return "Booking URL must start with http:// or https://.";
    }
  }
  return null;
}

function buildFromInput(input: AdminProductInput): AdminCatalogProduct {
  const now = new Date().toISOString();
  const listingType = parseListingType(input.listingType);
  const id = input.id?.trim() || newCatalogDocId(listingType);
  const eco = Number.isFinite(input.ecoScore)
    ? Math.min(100, Math.max(0, input.ecoScore))
    : 90;
  const commerceType: CommerceType =
    listingType !== "product"
      ? "first_party"
      : input.commerceType === "affiliate"
        ? "affiliate"
        : "first_party";
  const isBookable = listingType === "service" || listingType === "rental";
  const areaServed =
    input.areaServed?.trim() ||
    input.availabilityNote?.trim() ||
    undefined;

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
    availabilityNote: areaServed,
    areaServed,
    sellerId:
      listingType === "product" && commerceType === "first_party"
        ? input.sellerId?.trim() || undefined
        : undefined,
    vehicleMake:
      listingType === "product" && commerceType === "first_party"
        ? input.vehicleMake?.trim() || undefined
        : undefined,
    vehicleModel:
      listingType === "product" && commerceType === "first_party"
        ? input.vehicleModel?.trim() || undefined
        : undefined,
    vehicleYear:
      listingType === "product" && commerceType === "first_party"
        ? input.vehicleYear?.trim() || undefined
        : undefined,
    oemNote:
      listingType === "product" && commerceType === "first_party"
        ? input.oemNote?.trim() || undefined
        : undefined,
    providerType: isBookable ? input.providerType : undefined,
    providerName: isBookable ? input.providerName?.trim() : undefined,
    duration:
      listingType === "service" ? input.duration?.trim() : undefined,
    hirePeriod:
      listingType === "rental" ? input.hirePeriod?.trim() : undefined,
    priceNote: isBookable ? input.priceNote?.trim() : undefined,
    bookingUrl:
      isBookable && input.bookingUrl?.trim() && isValidHttpUrl(input.bookingUrl)
        ? input.bookingUrl.trim()
        : undefined,
    bookingNote: isBookable
      ? input.bookingNote?.trim() || DEFAULT_BOOKING_NOTE
      : undefined,
    contactEmail: isBookable ? input.contactEmail?.trim() : undefined,
    depositAmount:
      listingType === "rental" ? input.depositAmount ?? undefined : undefined,
    whatsIncluded: isBookable ? input.whatsIncluded?.trim() : undefined,
    whatsNotIncluded: isBookable ? input.whatsNotIncluded?.trim() : undefined,
    stock:
      listingType !== "product" || commerceType === "affiliate"
        ? null
        : input.stock,
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * List admin-managed catalog products from Firestore `products`
 * (affiliate + first-party + service + rental). Same name is allowed when
 * providerName / providerType / id differ.
 *
 * When Firebase is configured, Firestore is the source of truth — no
 * session-only list for services/rentals.
 */
export async function listAdminCatalogProducts(): Promise<AdminCatalogProduct[]> {
  const local = loadLocal();

  if (isFirebaseClientConfigured()) {
    const db = getFirebaseFirestore();
    if (!db) {
      throw new Error(
        "Firebase is configured but failed to initialize. Check NEXT_PUBLIC_FIREBASE_* env vars."
      );
    }
    try {
      const snapshot = await getDocs(collection(db, "products"));
      const fromFs = snapshot.docs.map((d) =>
        normalizeAdminProduct({
          id: d.id,
          ...(d.data() as Record<string, unknown>),
        })
      );
      // Mirror cloud catalog locally for offline Marketplace cache only.
      saveLocal(fromFs);
      return fromFs.sort((a, b) =>
        (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")
      );
    } catch (err) {
      console.error("[products] Firestore list failed", err);
      throw new Error(firestoreErrorMessage(err));
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
  try {
    const rows = await listAdminCatalogProducts();
    return rows.map(toMarketplaceProduct);
  } catch (err) {
    // Marketplace stays usable from local cache if Firestore is briefly down.
    console.warn("[products] Live list falling back to local cache", err);
    return loadLocal().map(toMarketplaceProduct);
  }
}

/**
 * Create or update a product on the same Firestore `products` collection /
 * document id used by Amazon affiliate listings.
 * When Firebase is configured, a failed write throws (no “this device only”).
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

  if (isFirebaseClientConfigured()) {
    const db = getFirebaseFirestore();
    if (!db) {
      throw new Error(
        "Firebase is configured but failed to initialize. Product was not saved."
      );
    }
    try {
      await setDoc(doc(db, "products", product.id), toFirestorePayload(product));
      upsertLocal(product);
      notifyCatalogUpdated();
      return { product, persist: "firestore" };
    } catch (e) {
      console.error("[products] Firestore save/update failed", e);
      throw new Error(firestoreErrorMessage(e));
    }
  }

  // Firebase env not set — local is the only store (dev without FS).
  upsertLocal(product);
  notifyCatalogUpdated();
  return {
    product,
    persist: "local",
    warning:
      "Firebase is not configured — product saved on this device only.",
  };
}

export async function deleteAdminCatalogProduct(
  id: string,
  opts: { adminEmail?: string | null }
): Promise<void> {
  if (opts.adminEmail != null && !isAdminUser(opts.adminEmail)) {
    throw new Error("Not authorized to delete products.");
  }

  if (isFirebaseClientConfigured()) {
    const db = getFirebaseFirestore();
    if (!db) {
      throw new Error(
        "Firebase is configured but failed to initialize. Product was not deleted."
      );
    }
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
 * Publish a seller first-party Product listing into the live Marketplace catalog.
 * Services are skipped (handled on shop pages). Does not touch Amazon affiliate rows.
 */
export async function saveSellerFirstPartyListing(
  sellerId: string,
  product: {
    id: string;
    name: string;
    description?: string;
    subtitle?: string;
    category: string;
    price: number;
    ecoScore: number;
    stock: number;
    imageUrl?: string;
    listingType?: ListingType;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleYear?: string;
    oemNote?: string;
    createdAt?: string;
  }
): Promise<SaveAdminProductResult | null> {
  if (product.listingType === "service" || product.listingType === "rental") {
    return null;
  }
  return saveAdminCatalogProduct(
    {
      id: product.id,
      name: product.name,
      description:
        (product.description ?? "").trim() ||
        (product.subtitle ?? "").trim() ||
        product.name,
      category: product.category,
      price: product.price,
      ecoScore: product.ecoScore,
      stock: Math.max(0, product.stock || 0),
      listingType: "product",
      commerceType: "first_party",
      imageUrl: product.imageUrl,
      sellerId,
      vehicleMake: product.vehicleMake,
      vehicleModel: product.vehicleModel,
      vehicleYear: product.vehicleYear,
      oemNote: product.oemNote,
    },
    { existingCreatedAt: product.createdAt }
  );
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
