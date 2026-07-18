"use client";

import {
  BadgeCheck,
  Leaf,
  MapPin,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";

import {
  averageEcoScore,
  memberSinceLabel,
  totalShopSales,
  trustTierLabel,
} from "@/lib/shop-trust";
import type { SellerProfile, SellerProduct } from "@/types";

export function ShopTrustBar({
  shop,
  products,
}: {
  shop: SellerProfile;
  products: SellerProduct[];
}) {
  const avgEco = averageEcoScore(products);
  const sales = totalShopSales(products);
  const since = memberSinceLabel(shop.approvedAt ?? shop.appliedAt);

  const items = [
    {
      icon: BadgeCheck,
      label: "Verified eco shop",
      detail: "Reviewed by Forest Buddies",
    },
    {
      icon: ShieldCheck,
      label: trustTierLabel(shop.trustTier),
      detail:
        shop.trustTier === "trusted"
          ? "Strong approval history"
          : "Moderation-backed listings",
    },
    ...(shop.location
      ? [
          {
            icon: MapPin,
            label: shop.location,
            detail: "Ships from maker location",
          },
        ]
      : []),
    ...(avgEco > 0
      ? [
          {
            icon: Leaf,
            label: `${avgEco} avg eco score`,
            detail: "Across approved listings",
          },
        ]
      : []),
    ...(sales > 0
      ? [
          {
            icon: ShoppingBag,
            label: `${sales.toLocaleString()} sold`,
            detail: since ? `On Forest Buddies since ${since}` : "Community favorites",
          },
        ]
      : []),
  ];

  return (
    <section
      aria-label="Shop trust signals"
      className="animate-fb-fade-up rounded-2xl border border-emerald-900/10 bg-white/80 px-3 py-3 shadow-sm backdrop-blur-sm sm:px-4"
      style={{ animationDelay: "80ms" }}
    >
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 lg:gap-0 lg:divide-x lg:divide-border/70">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex items-start gap-2.5 rounded-xl px-2 py-2 sm:px-3"
          >
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-900">
              <item.icon className="size-4" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold leading-snug text-forest">
                {item.label}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                {item.detail}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
