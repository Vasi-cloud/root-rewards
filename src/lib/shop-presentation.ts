import type { SellerProduct } from "@/types";

/** Category → soft photo palette for shop cards (no stock photos required). */
const CATEGORY_SCENES: Record<
  string,
  { from: string; to: string; accent: string; motif: "leaf" | "wave" | "wood" | "cloth" }
> = {
  Kitchen: {
    from: "#e8f5e9",
    to: "#c8e6c9",
    accent: "#2d6a4f",
    motif: "wood",
  },
  Accessories: {
    from: "#e0f2fe",
    to: "#bae6fd",
    accent: "#0369a1",
    motif: "wave",
  },
  Beauty: {
    from: "#fce7f3",
    to: "#fbcfe8",
    accent: "#9d174d",
    motif: "leaf",
  },
  Home: {
    from: "#fef3c7",
    to: "#fde68a",
    accent: "#92400e",
    motif: "cloth",
  },
  Apparel: {
    from: "#ecfdf5",
    to: "#a7f3d0",
    accent: "#065f46",
    motif: "cloth",
  },
};

const FALLBACK_SCENE = {
  from: "#e8ede9",
  to: "#95d5b2",
  accent: "#1b4332",
  motif: "leaf" as const,
};

export function productScene(product: Pick<SellerProduct, "category" | "id">) {
  return CATEGORY_SCENES[product.category] ?? FALLBACK_SCENE;
}

/** Stable illustration path for demo / seeded listings. */
export function defaultProductImage(
  product: Pick<SellerProduct, "id" | "category" | "imageUrl">
): string {
  if (product.imageUrl) return product.imageUrl;
  const map: Record<string, string> = {
    "demo-gg-1": "/shop/sponge.svg",
    "demo-gg-2": "/shop/servers.svg",
    "demo-gg-3": "/shop/linen.svg",
    "demo-tl-1": "/shop/bottle.svg",
    "demo-tl-2": "/shop/tote.svg",
    "demo-tl-3": "/shop/pouch.svg",
  };
  if (map[product.id]) return map[product.id];
  const cat = product.category.toLowerCase();
  if (cat.includes("kitchen")) return "/shop/servers.svg";
  if (cat.includes("access")) return "/shop/tote.svg";
  return "/shop/linen.svg";
}

export function productGallery(
  product: Pick<SellerProduct, "id" | "category" | "imageUrl" | "gallery">
): string[] {
  if (product.gallery && product.gallery.length > 0) return product.gallery;
  const hero = defaultProductImage(product);
  // Secondary “detail” frames reuse related shop art for demo depth
  const alts = ["/shop/linen.svg", "/shop/sponge.svg", "/shop/tote.svg"].filter(
    (u) => u !== hero
  );
  return [hero, ...alts.slice(0, 2)];
}
