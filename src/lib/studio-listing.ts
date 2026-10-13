import type { SellerProduct } from "@/types";

/** The one Studio tee Admin already lists. Not a second product. */
export const STUDIO_TEE_ID = "studio-product-forest-buddies-organic-tee";

/** Eco score on the Forest Buddies organic tee listing. */
export const STUDIO_TEE_ECO = 90;

export type StudioApplicationRow = {
  id: string;
  servicesOffered?: string;
  status?: string;
  appliedAt?: string;
};

export function isStudioTeeName(name?: string) {
  return (
    (name ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim() === "forest buddies organic tee"
  );
}

export function isStudioOrganicTee(product: {
  id?: string;
  name?: string;
} | null | undefined) {
  if (!product) return false;
  return product.id === STUDIO_TEE_ID || isStudioTeeName(product.name);
}

/** Saved listing photo only. Missing stays empty so the placeholder can show. */
export function savedStudioTeeImage(imageUrl?: string | null) {
  const url = imageUrl?.trim();
  return url || undefined;
}

/**
 * Guest view of the organic tee: listing eco, saved photo only.
 * Does not invent a story, impact figures, or an image URL.
 */
export function presentStudioTee<
  T extends { id?: string; name?: string; ecoScore: number; imageUrl?: string },
>(product: T): T {
  if (!isStudioOrganicTee(product)) return product;
  const ecoScore = product.ecoScore > 0 ? product.ecoScore : STUDIO_TEE_ECO;
  const imageUrl = savedStudioTeeImage(product.imageUrl);
  if (ecoScore === product.ecoScore && imageUrl === product.imageUrl) {
    return product;
  }
  return { ...product, ecoScore, imageUrl };
}

/** The shared Studio product record. Pending until that record is approved. */
export function studioProductFromApplication(
  application: StudioApplicationRow
): SellerProduct | null {
  if (!application.id.startsWith("studio-product-")) return null;
  let parsed: {
    name?: string;
    price?: number;
    category?: string;
    listingType?: string;
    stock?: number;
    ecoScore?: number;
    imageUrl?: string;
  };
  try {
    parsed = JSON.parse(application.servicesOffered ?? "") as typeof parsed;
  } catch {
    return null;
  }
  const name = (parsed?.name ?? "").trim();
  if (!name) return null;
  const listingType =
    parsed.listingType === "service" || parsed.listingType === "rental"
      ? parsed.listingType
      : "product";
  const tee =
    application.id === STUDIO_TEE_ID || isStudioTeeName(name);
  const ecoRaw = Number(parsed.ecoScore);
  const ecoScore =
    Number.isFinite(ecoRaw) && ecoRaw > 0
      ? Math.min(100, ecoRaw)
      : tee
        ? STUDIO_TEE_ECO
        : 0;
  return {
    id: application.id,
    name,
    subtitle: "",
    description: "",
    category: (parsed.category ?? "").trim() || "Apparel",
    tags: [],
    price: Number(parsed.price) || 0,
    ecoScore,
    imageUrl: savedStudioTeeImage(parsed.imageUrl),
    stock: Math.max(0, Math.round(Number(parsed.stock) || 0)),
    listingType,
    status: application.status === "approved" ? "approved" : "pending",
    views: 0,
    sales: 0,
    createdAt: application.appliedAt || new Date(0).toISOString(),
  };
}
