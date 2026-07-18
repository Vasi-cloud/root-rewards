"use client";

import {
  ArrowRight,
  BookOpen,
  Leaf,
  PawPrint,
  ShoppingBag,
  Store,
  Sun,
  Users,
  Waves,
} from "lucide-react";
import Link from "next/link";

import { MarketingShell } from "@/components/layout/marketing-shell";
import { Button } from "@/components/ui/button";
import { CAUSES } from "@/lib/causes";

const CAUSE_ICONS = {
  trees: Leaf,
  waves: Waves,
  paw: PawPrint,
  book: BookOpen,
  sun: Sun,
} as const;

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Shop with intention",
    text: "Browse verified eco products scored for materials, makers, and carbon care.",
  },
  {
    step: "02",
    title: "Fund a cause you love",
    text: "At checkout, choose Trees, Ocean, Animals, Education, or Climate—your impact is tracked.",
  },
  {
    step: "03",
    title: "Sell as you are",
    text: "Solo makers and self-employed pros, or registered brands — apply once and list goods or services.",
    href: "/seller",
    cta: "Become a seller",
  },
];

const IMPACT = [
  { value: "18.4k", label: "Sustainable orders" },
  { value: "142t", label: "CO₂ equivalent funded" },
  { value: "47k", label: "Trees & cause units" },
  { value: "3.2k", label: "Eco affiliates & sellers" },
];

const FEATURED = [
  {
    name: "Organic Cotton Tote",
    category: "Accessories",
    price: 28,
    eco: 92,
    blurb: "Everyday carry made from GOTS cotton.",
  },
  {
    name: "Bamboo Cutlery Set",
    category: "Kitchen",
    price: 18,
    eco: 88,
    blurb: "Portable dining without the plastic.",
  },
  {
    name: "Refillable Glass Cleaner",
    category: "Home",
    price: 14,
    eco: 95,
    blurb: "One bottle, endless plant-based refills.",
  },
];

export default function HomePage() {
  return (
    <MarketingShell>
      {/* Hero — brand first, one composition */}
      <section className="relative min-h-[min(88vh,44rem)] overflow-hidden bg-forest text-cream sm:min-h-[min(92vh,52rem)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 80% 60% at 70% 20%, rgba(149, 213, 178, 0.45), transparent 55%),
              radial-gradient(ellipse 50% 40% at 15% 80%, rgba(212, 163, 115, 0.25), transparent 50%),
              linear-gradient(165deg, #1b4332 0%, #2d6a4f 42%, #1b4332 100%)
            `,
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 8c-4 10-14 16-14 28a14 14 0 0028 0c0-12-10-18-14-28z' fill='%95d5b2' fill-opacity='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: "72px 72px",
          }}
        />
        <Leaf
          className="animate-fb-drift pointer-events-none absolute top-[18%] right-[8%] hidden size-16 text-sage/40 sm:block sm:size-24"
          aria-hidden
        />
        <Leaf
          className="animate-fb-float pointer-events-none absolute bottom-[22%] left-[6%] size-10 rotate-[-20deg] text-gold/30 sm:size-16"
          aria-hidden
        />

        <div className="relative mx-auto flex min-h-[min(88vh,44rem)] w-full max-w-5xl flex-col justify-end px-4 pb-10 pt-20 sm:min-h-[min(92vh,52rem)] sm:max-w-6xl sm:px-6 sm:pb-24 sm:pt-32">
          <div className="w-full max-w-xl sm:max-w-2xl lg:max-w-3xl">
            <p className="animate-fb-fade-up font-heading text-lg font-semibold tracking-tight text-sage sm:text-3xl md:text-4xl">
              Forest Buddies
            </p>
            <h1
              className="animate-fb-fade-up mt-2 font-heading text-[1.75rem] font-semibold leading-[1.15] tracking-tight text-cream sm:mt-3 sm:text-5xl lg:text-6xl"
              style={{ animationDelay: "120ms" }}
            >
              Shop kindly. Fund causes. Grow the wild together.
            </h1>
            <p
              className="animate-fb-fade-up mt-3 max-w-md text-sm leading-relaxed text-cream/80 sm:mt-5 sm:max-w-xl sm:text-lg"
              style={{ animationDelay: "220ms" }}
            >
              A sustainable marketplace where every purchase can plant trees,
              protect oceans, and lift eco brands—and you.
            </p>
            <div
              className="animate-fb-fade-up mt-6 flex w-full max-w-sm flex-col gap-2 sm:mt-8 sm:max-w-none sm:flex-row sm:flex-wrap sm:gap-3"
              style={{ animationDelay: "320ms" }}
            >
              <Button
                nativeButton={false}
                render={<Link href="/marketplace" />}
                size="lg"
                className="min-h-11 w-full gap-2 bg-cream text-forest hover:bg-cream/90 sm:w-auto"
              >
                Shop eco finds
                <ArrowRight className="size-4" />
              </Button>
              <Button
                nativeButton={false}
                render={<Link href="/seller" />}
                size="lg"
                variant="outline"
                className="min-h-11 w-full border-cream/40 bg-transparent text-cream hover:bg-cream/10 sm:w-auto"
              >
                Become a seller
              </Button>
              <Button
                nativeButton={false}
                render={<Link href="/affiliates" />}
                size="lg"
                variant="ghost"
                className="min-h-11 w-full text-sage hover:bg-cream/10 hover:text-cream sm:w-auto"
              >
                Join as affiliate
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative overflow-hidden bg-cream px-4 py-14 sm:px-6 sm:py-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sage to-transparent" />
        <div className="mx-auto w-full max-w-5xl sm:max-w-6xl">
          <h2 className="font-heading text-2xl font-semibold text-primary sm:text-4xl">
            How Forest Buddies works
          </h2>
          <p className="mt-3 max-w-md text-sm text-muted-foreground sm:max-w-xl sm:text-base">
            Three simple steps from curious shopper to lasting impact.
          </p>

          <ol className="mt-10 grid gap-8 sm:mt-14 sm:gap-10 md:grid-cols-3 md:gap-8">
            {HOW_IT_WORKS.map((item, i) => (
              <li
                key={item.step}
                className="animate-fb-fade-up relative max-w-md md:max-w-none"
                style={{ animationDelay: `${i * 140}ms` }}
              >
                <span className="font-heading text-4xl font-semibold tabular-nums text-sage/80 sm:text-5xl">
                  {item.step}
                </span>
                <h3 className="mt-3 font-heading text-lg font-semibold text-primary sm:text-xl">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.text}
                </p>
                {"href" in item && item.href && (
                  <Button
                    nativeButton={false}
                    render={<Link href={item.href} />}
                    variant="outline"
                    size="sm"
                    className="mt-4 gap-1.5"
                  >
                    <Store className="size-3.5" />
                    {item.cta ?? "Learn more"}
                  </Button>
                )}
                <div
                  className="mt-5 h-0.5 origin-left bg-gradient-to-r from-primary to-sage"
                  style={{
                    animation: "fb-grow-bar 0.9s ease-out both",
                    animationDelay: `${200 + i * 140}ms`,
                  }}
                />
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Impact */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sage/25 via-cream to-cream px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto w-full max-w-5xl sm:max-w-6xl">
          <h2 className="font-heading text-2xl font-semibold text-primary sm:text-4xl">
            Impact we grow together
          </h2>
          <p className="mt-3 max-w-md text-sm text-muted-foreground sm:max-w-xl sm:text-base">
            Every cart, cause, and referral adds to a living forest of change.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-6 sm:mt-12 sm:gap-8 lg:grid-cols-4 lg:gap-6">
            {IMPACT.map((stat) => (
              <div key={stat.label} className="min-w-0 text-left">
                <div className="font-heading text-3xl font-semibold tabular-nums tracking-tight text-primary sm:text-5xl">
                  {stat.value}
                </div>
                <div className="mt-2 text-xs text-muted-foreground sm:text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="border-y border-border/50 bg-secondary/20 px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto w-full max-w-5xl sm:max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 max-w-lg">
              <h2 className="font-heading text-2xl font-semibold text-primary sm:text-4xl">
                Featured eco finds
              </h2>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                High eco scores, everyday usefulness—start your cart with
                these.
              </p>
            </div>
            <Button
              nativeButton={false}
              render={<Link href="/marketplace" />}
              variant="outline"
              className="gap-2 self-start sm:self-auto"
            >
              Browse marketplace
              <ArrowRight className="size-4" />
            </Button>
          </div>

          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            {FEATURED.map((product) => (
              <article key={product.name} className="group">
                <div className="mb-5 flex aspect-[4/3] items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 via-sage/30 to-gold/20 transition-transform duration-500 group-hover:scale-[1.02]">
                  <Leaf className="size-12 text-primary/70 transition-transform duration-500 group-hover:rotate-[-8deg]" />
                </div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {product.category} · {product.eco}% eco
                </p>
                <h3 className="mt-1 font-heading text-xl font-semibold text-primary">
                  {product.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {product.blurb}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-semibold tabular-nums text-primary">
                    ${product.price}
                  </span>
                  <Link
                    href="/marketplace"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Shop
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Causes */}
      <section className="bg-cream px-4 py-14 sm:px-6 sm:py-24">
        <div className="mx-auto w-full max-w-5xl sm:max-w-6xl">
          <h2 className="font-heading text-2xl font-semibold text-primary sm:text-4xl">
            Causes you can fund
          </h2>
          <p className="mt-3 max-w-md text-sm text-muted-foreground sm:max-w-xl sm:text-base">
            At checkout, pick where your generosity lands—then watch it grow on
            your dashboard.
          </p>

          <div className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:grid-cols-5">
            {CAUSES.map((cause) => {
              const Icon = CAUSE_ICONS[cause.icon];
              return (
                <div
                  key={cause.id}
                  className={`rounded-2xl border p-5 ${cause.accentClass}`}
                >
                  <Icon className="size-5 opacity-80" />
                  <h3 className="mt-3 font-heading text-lg font-semibold">
                    {cause.name}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed opacity-90">
                    {cause.tagline}
                  </p>
                  <p className="mt-3 text-xs font-medium opacity-80">
                    From ${cause.unitPrice} / {cause.unitSingular}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-10">
            <Button
              nativeButton={false}
              render={<Link href="/marketplace" />}
              size="lg"
              className="gap-2"
            >
              Shop & choose a cause
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-forest px-4 py-14 text-cream sm:px-6 sm:py-24">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(149, 213, 178, 0.35), transparent 70%)",
          }}
        />
        <div className="relative mx-auto w-full max-w-lg text-center sm:max-w-3xl">
          <h2 className="font-heading text-2xl font-semibold sm:text-4xl">
            Ready to root your next chapter?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-cream/75 sm:mt-4 sm:max-w-lg sm:text-base">
            Whether you shop, sell, or share—Forest Buddies turns everyday
            choices into forest-sized hope.
          </p>
          <div className="mx-auto mt-6 flex w-full max-w-sm flex-col gap-2 sm:mt-10 sm:max-w-none sm:flex-row sm:items-center sm:justify-center sm:gap-3">
            <Button
              nativeButton={false}
              render={<Link href="/marketplace" />}
              size="lg"
              className="min-h-11 w-full gap-2 bg-cream text-forest hover:bg-cream/90 sm:w-auto"
            >
              <ShoppingBag className="size-4" />
              Shop now
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/seller" />}
              size="lg"
              variant="outline"
              className="min-h-11 w-full gap-2 border-cream/35 bg-transparent text-cream hover:bg-cream/10 sm:w-auto"
            >
              <Store className="size-4" />
              Become a seller
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/affiliates" />}
              size="lg"
              variant="outline"
              className="min-h-11 w-full gap-2 border-cream/35 bg-transparent text-cream hover:bg-cream/10 sm:w-auto"
            >
              <Users className="size-4" />
              Join as affiliate
            </Button>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
