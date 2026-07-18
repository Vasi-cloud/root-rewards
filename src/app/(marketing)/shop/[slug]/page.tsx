"use client";

import { Leaf } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { ShopHero } from "@/components/shop/shop-hero";
import { ShopProductCard } from "@/components/shop/shop-product-card";
import { ShopProductDetail } from "@/components/shop/shop-product-detail";
import { ShopStoryAndImpact } from "@/components/shop/shop-story";
import { ShopTrustBar } from "@/components/shop/shop-trust-bar";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";
import { defaultProductImage } from "@/lib/shop-presentation";
import {
  ensureDemoShops,
  getSellerBySlug,
  listPublicShops,
} from "@/lib/seller-storage";
import type { Product, SellerProfile, SellerProduct } from "@/types";

function sellerProductToCartItem(
  product: SellerProduct,
  shopName: string
): Product {
  return {
    id: product.id,
    name: product.name,
    description: product.description || product.subtitle || shopName,
    price: product.price,
    imageUrl: defaultProductImage(product),
    category: product.category,
    sustainabilityScore: product.ecoScore,
    affiliateCommissionPercent: 12,
  };
}

export default function SellerShopPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { addToCart } = useCart();
  const [shop, setShop] = useState<SellerProfile | null>(null);
  const [others, setOthers] = useState<SellerProfile[]>([]);
  const [ready, setReady] = useState(false);
  const [activeProduct, setActiveProduct] = useState<SellerProduct | null>(
    null
  );

  useEffect(() => {
    ensureDemoShops();
    setShop(getSellerBySlug(slug));
    setOthers(listPublicShops().filter((s) => s.slug !== slug).slice(0, 4));
    setReady(true);
    setActiveProduct(null);
  }, [slug]);

  const approved = useMemo(
    () => (shop?.products ?? []).filter((p) => p.status === "approved"),
    [shop]
  );

  function addProduct(product: SellerProduct) {
    if (!shop) return;
    addToCart(sellerProductToCartItem(product, shop.shopName));
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-muted-foreground">
        Loading shop…
      </div>
    );
  }

  if (!shop || shop.status !== "approved") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <Leaf className="mx-auto mb-4 size-10 text-primary" />
        <h1 className="font-heading text-2xl font-semibold">Shop not found</h1>
        <p className="mt-2 text-muted-foreground">
          This seller profile isn&apos;t public yet, or the link is outdated.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button nativeButton={false} render={<Link href="/shop" />}>
            Browse shops
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/shop/green-grove" />}
          >
            Visit Green Grove
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(149,213,178,0.35),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
        <ShopHero shop={shop} listingCount={approved.length} />

        <div className="mt-5 sm:mt-6">
          <ShopTrustBar shop={shop} products={approved} />
        </div>

        <div className="mt-14 sm:mt-16">
          <ShopStoryAndImpact shop={shop} />
        </div>

        <section className="mt-16 sm:mt-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border/50 pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800/70">
                The collection
              </p>
              <h2 className="font-heading mt-2 text-3xl font-semibold text-primary sm:text-4xl">
                Pieces with a past
              </h2>
              <p className="mt-2 max-w-xl text-muted-foreground">
                Photo galleries, materials, and the impact story behind each
                make — browse like a craft market, buy with confidence.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {approved.length} listing{approved.length === 1 ? "" : "s"} · all
              moderated
            </p>
          </div>

          {approved.length === 0 ? (
            <p className="text-muted-foreground">
              No approved products yet — check back soon.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {approved.map((product, i) => (
                <div
                  key={product.id}
                  className="animate-fb-fade-up"
                  style={{ animationDelay: `${Math.min(i, 5) * 70}ms` }}
                >
                  <ShopProductCard
                    product={product}
                    onOpen={() => setActiveProduct(product)}
                    onQuickAdd={() => addProduct(product)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {others.length > 0 && (
          <section className="mt-20 rounded-3xl border border-border/60 bg-white/60 px-5 py-8 sm:px-8">
            <h2 className="font-heading text-xl font-semibold text-primary sm:text-2xl">
              More trusted eco shops
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Explore other verified makers on Forest Buddies.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {others.map((s) => (
                <Button
                  key={s.uid}
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={`/shop/${s.slug}`} />}
                >
                  {s.shopName}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href="/shop" />}
              >
                All shops
              </Button>
            </div>
          </section>
        )}
      </div>

      {activeProduct && (
        <ShopProductDetail
          product={activeProduct}
          shopName={shop.shopName}
          shopLocation={shop.location}
          onClose={() => setActiveProduct(null)}
          onAdd={() => {
            addProduct(activeProduct);
            setActiveProduct(null);
          }}
        />
      )}
    </div>
  );
}
