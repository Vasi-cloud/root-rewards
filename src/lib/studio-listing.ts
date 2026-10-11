import type { SellerProduct } from "@/types";

/** The one Studio tee Admin already lists. Not a second product. */
export const STUDIO_TEE_ID = "studio-product-forest-buddies-organic-tee";

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
  return {
    id: application.id,
    name,
    subtitle: "",
    description: "",
    category: (parsed.category ?? "").trim() || "Apparel",
    tags: [],
    price: Number(parsed.price) || 0,
    ecoScore: 0,
    stock: Math.max(0, Math.round(Number(parsed.stock) || 0)),
    listingType,
    status: application.status === "approved" ? "approved" : "pending",
    views: 0,
    sales: 0,
    createdAt: application.appliedAt || new Date(0).toISOString(),
  };
}
