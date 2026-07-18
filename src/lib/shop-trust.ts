import type { SellerProduct, SellerProfile } from "@/types";

export function shopInitials(shopName: string): string {
  const parts = shopName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "FB";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function averageEcoScore(products: SellerProduct[]): number {
  const approved = products.filter((p) => p.status === "approved");
  if (approved.length === 0) return 0;
  const sum = approved.reduce((n, p) => n + p.ecoScore, 0);
  return Math.round(sum / approved.length);
}

export function totalShopSales(products: SellerProduct[]): number {
  return products
    .filter((p) => p.status === "approved")
    .reduce((n, p) => n + (p.sales || 0), 0);
}

export function memberSinceLabel(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function trustTierLabel(
  tier: SellerProfile["trustTier"] | undefined
): string {
  if (tier === "trusted") return "Trusted maker";
  if (tier === "standard") return "Established shop";
  return "New maker";
}
