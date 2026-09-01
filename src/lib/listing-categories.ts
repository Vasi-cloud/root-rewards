import type { ListingType, ServiceDeliveryMode } from "@/types";

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
