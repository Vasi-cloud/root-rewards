export type RentalItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  pricePerDay: number;
};

/** Shared rental catalog — Rentals tab and All tab both use this list. */
export const RENTAL_ITEMS: RentalItem[] = [
  {
    id: "r1",
    name: "4-Person Camping Tent",
    description:
      "Waterproof, lightweight tent with recycled fabric. Perfect for weekend adventures.",
    category: "Camping",
    pricePerDay: 18,
  },
  {
    id: "r2",
    name: "Electric Bike",
    description:
      "Quiet e-bike with 60km range. Great for commuting or exploring trails.",
    category: "Mobility",
    pricePerDay: 32,
  },
  {
    id: "r3",
    name: "Professional Tool Kit",
    description:
      "Complete set of hand tools for home projects. Includes drill, saws, and more.",
    category: "Tools",
    pricePerDay: 22,
  },
  {
    id: "r4",
    name: "Zero-Waste Party Kit",
    description:
      "Reusable plates, cutlery, and decorations for up to 20 guests.",
    category: "Events",
    pricePerDay: 45,
  },
  {
    id: "r5",
    name: "Stand-Up Paddleboard",
    description:
      "Eco-friendly inflatable SUP with pump and leash. Ideal for lakes and rivers.",
    category: "Water Sports",
    pricePerDay: 28,
  },
  {
    id: "r6",
    name: "Portable Solar Generator",
    description:
      "500Wh battery with solar panels. Power your devices off-grid sustainably.",
    category: "Camping",
    pricePerDay: 25,
  },
];

export const RENTAL_COUNT = RENTAL_ITEMS.length;

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
