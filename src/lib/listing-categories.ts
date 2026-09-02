import type {
  AdminListingKind,
  ListingType,
  ProviderType,
  ServiceDeliveryMode,
} from "@/types";

/** Physical / digital goods sold on Forest Buddies */
export const PRODUCT_CATEGORIES = [
  "Accessories",
  "Kitchen",
  "Home",
  "Apparel",
  "Beauty",
  "Stationery",
  "Camping",
  "Parts",
] as const;

/**
 * Bookable / professional services — individuals and eco practices.
 * Includes legal, consulting, workshops as first-class categories.
 */
export const SERVICE_CATEGORIES = [
  "Legal",
  "Consulting",
  "Workshops",
  "Repair & Upcycling",
  "Wellness",
  "Garden & Outdoor",
  "Home Services",
] as const;

/** Borrowable gear categories for Admin rentals */
export const RENTAL_CATEGORIES = [
  "Camping",
  "Mobility",
  "Tools",
  "Events",
  "Water Sports",
  "Home",
] as const;

/** Compact labels for Featured Solo Makers domain chips */
export const SOLO_DOMAIN_CHIPS = [
  { id: "Legal", label: "Legal" },
  { id: "Consulting", label: "Consulting" },
  { id: "Workshops", label: "Workshops" },
  { id: "Repair & Upcycling", label: "Repair" },
  { id: "Wellness", label: "Wellness" },
  { id: "Garden & Outdoor", label: "Garden" },
  { id: "Home Services", label: "Home" },
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];
export type RentalCategory = (typeof RENTAL_CATEGORIES)[number];
export type SoloDomainId = (typeof SOLO_DOMAIN_CHIPS)[number]["id"];

export const DELIVERY_MODE_LABELS: Record<ServiceDeliveryMode, string> = {
  in_person: "In person",
  remote: "Remote / online",
  hybrid: "Hybrid",
};

export const DEFAULT_BOOKING_NOTE =
  "Email to confirm a time. This is not a live calendar.";

export const BOOKING_AVAILABILITY_DISCLAIMER =
  "Confirm before you go / before the visit. Availability is not live on Forest Buddies®.";

/** Optional booking / external link — http or https only. */
export function isValidHttpUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  try {
    const u = new URL(trimmed);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function providerTypeLabel(type: ProviderType | undefined): string {
  if (type === "self_employed") return "Self-employed";
  return "Company";
}

export function formatProviderLine(product: {
  providerType?: ProviderType;
  providerName?: string;
}): string | null {
  const name = product.providerName?.trim();
  if (!name) return null;
  return `${providerTypeLabel(product.providerType)} · ${name}`;
}

/** Display: £45 per visit — price stays numeric; unit is priceNote. */
export function formatListingPrice(
  price: number,
  priceNote?: string | null
): string {
  const amount = `£${Number.isFinite(price) ? price : 0}`;
  const note = priceNote?.trim();
  return note ? `${amount} ${note}` : amount;
}

export function adminListingKindFromProduct(product: {
  listingType?: ListingType;
  commerceType?: string;
}): AdminListingKind {
  if (product.listingType === "service") return "service";
  if (product.listingType === "rental") return "rental";
  if (product.commerceType === "affiliate") return "product_affiliate_amazon";
  return "product_first_party";
}

export function listingAndCommerceFromKind(kind: AdminListingKind): {
  listingType: ListingType;
  commerceType: "first_party" | "affiliate";
} {
  if (kind === "service") {
    return { listingType: "service", commerceType: "first_party" };
  }
  if (kind === "rental") {
    return { listingType: "rental", commerceType: "first_party" };
  }
  if (kind === "product_affiliate_amazon") {
    return { listingType: "product", commerceType: "affiliate" };
  }
  return { listingType: "product", commerceType: "first_party" };
}

export function adminListingKindLabel(kind: AdminListingKind): string {
  switch (kind) {
    case "product_first_party":
      return "Product (first-party / Stripe)";
    case "product_affiliate_amazon":
      return "Product (Amazon affiliate)";
    case "service":
      return "Service";
    case "rental":
      return "Rental";
  }
}

export function categoriesForListingType(
  listingType: ListingType
): readonly string[] {
  if (listingType === "service") return SERVICE_CATEGORIES;
  if (listingType === "rental") return RENTAL_CATEGORIES;
  return PRODUCT_CATEGORIES;
}

export function isServiceCategory(category: string): boolean {
  return (SERVICE_CATEGORIES as readonly string[]).includes(category);
}

export function defaultCategoryFor(listingType: ListingType): string {
  if (listingType === "service") return "Consulting";
  if (listingType === "rental") return "Camping";
  return "Kitchen";
}

export function listingTypeLabel(listingType: ListingType | undefined): string {
  if (listingType === "service") return "Service";
  if (listingType === "rental") return "Rental";
  return "Product";
}

export function isServiceListing(
  product: { listingType?: ListingType } | null | undefined
): boolean {
  return product?.listingType === "service";
}

export function isRentalListing(
  product: { listingType?: ListingType } | null | undefined
): boolean {
  return product?.listingType === "rental";
}

/** First-party goods that can use Add to cart / Stripe (not service, rental, or Amazon). */
export function canAddProductToCart(product: {
  listingType?: ListingType;
  commerceType?: string;
  amazonAffiliateUrl?: string;
}): boolean {
  if (isServiceListing(product) || isRentalListing(product)) return false;
  if (product.commerceType === "affiliate") return false;
  if (product.amazonAffiliateUrl?.trim()) return false;
  return true;
}
