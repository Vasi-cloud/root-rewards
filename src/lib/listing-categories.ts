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
export type SoloDomainId = (typeof SOLO_DOMAIN_CHIPS)[number]["id"];

export const DELIVERY_MODE_LABELS: Record<ServiceDeliveryMode, string> = {
  in_person: "In person",
  remote: "Remote / online",
  hybrid: "Hybrid",
};

export function categoriesForListingType(
  listingType: ListingType
): readonly string[] {
  return listingType === "service" ? SERVICE_CATEGORIES : PRODUCT_CATEGORIES;
}

export function isServiceCategory(category: string): boolean {
  return (SERVICE_CATEGORIES as readonly string[]).includes(category);
}

export function defaultCategoryFor(listingType: ListingType): string {
  return listingType === "service" ? "Consulting" : "Kitchen";
}

export function listingTypeLabel(listingType: ListingType | undefined): string {
  return listingType === "service" ? "Service" : "Product";
}
