import type { CommerceType, Product } from "@/types";

export function isAffiliateProduct(
  product: Pick<Product, "commerceType" | "amazonAffiliateUrl"> | null | undefined
): boolean {
  if (!product) return false;
  if (product.commerceType === "affiliate") return true;
  // Legacy / partial docs: URL without type still treated as affiliate
  return Boolean(product.amazonAffiliateUrl?.trim());
}

export function isFirstPartyProduct(
  product: Pick<Product, "commerceType" | "amazonAffiliateUrl"> | null | undefined
): boolean {
  return !isAffiliateProduct(product);
}

export function commerceTypeLabel(type: CommerceType | undefined): string {
  return type === "affiliate" ? "Affiliate (Amazon)" : "First-party";
}
