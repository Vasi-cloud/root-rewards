export type RentalItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  pricePerDay: number;
};

/**
 * Legacy static rental demos — hidden from Marketplace.
 * Rentals now come from Firestore products with listingType: "rental".
 */
export const RENTAL_ITEMS: RentalItem[] = [];

export const RENTAL_COUNT = 0;

export function filterRentalItems(
  items: RentalItem[],
  opts: { search?: string; category?: string }
): RentalItem[] {
  const term = (opts.search ?? "").toLowerCase().trim();
  const category = opts.category ?? "All";
  return items.filter((item) => {
    const matchesSearch =
      !term ||
      item.name.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term);
    const matchesCategory = category === "All" || item.category === category;
    return matchesSearch && matchesCategory;
  });
}
