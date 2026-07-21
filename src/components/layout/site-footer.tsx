"use client";

import { Leaf } from "lucide-react";
import Link from "next/link";

import { MinimalTrademarkFooter } from "@/components/brand/brand-mark";
import { SupportChatTrigger } from "@/components/support/SupportChat";
import { TrustBadges } from "@/components/trust/trust-badges";
import { Separator } from "@/components/ui/separator";

const footerLinks = {
  Shop: [
    { href: "/marketplace", label: "Marketplace" },
    { href: "/local", label: "Buy Local" },
    { href: "/kitchen", label: "Leafy Kitchen" },
    { href: "/recommend", label: "Ask Leafy" },
    { href: "/shop", label: "Seller shops" },
    { href: "/about", label: "Our mission" },
  ],
  Earn: [
    { href: "/seller", label: "Become a seller" },
    { href: "/affiliates", label: "Affiliate program" },
    { href: "/membership", label: "Impact Member" },
    { href: "/register", label: "Join free" },
  ],
  Account: [
    { href: "/login", label: "Sign in" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/settings", label: "Account settings" },
    { href: "/seller", label: "Seller hub" },
    { href: "/feedback", label: "Share feedback" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/trademark", label: "Trademark Notice" },
    { href: "/returns", label: "Returns & size guide" },
  ],
};

/**
 * @param trademarkMode
 * - `minimal` — © year + UK Registered Trademark (home, about, legal, seller)
 * - `compact` — © year + brand only (shop pages already show the strip above)
 */
export function SiteFooter({
  trademarkMode = "minimal",
}: {
  trademarkMode?: "minimal" | "compact";
}) {
  return (
    <footer className="mt-auto border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto max-w-6xl px-3 py-10 sm:px-6 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-heading text-lg font-semibold">
              <Leaf className="size-5 text-sage" />
              Forest Buddies®
            </div>
            <p className="text-sm text-primary-foreground/80">
              A sustainable marketplace where conscious shoppers discover eco
              brands and affiliates earn rewards for every referral.
            </p>
            <SupportChatTrigger className="inline-flex items-center gap-1.5 text-sm text-sage transition-colors hover:text-cream">
              Chat with Sprout · Support
            </SupportChatTrigger>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-sage">
                {title}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-primary-foreground/85 transition-colors duration-200 hover:text-sage"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Separator className="my-8 bg-primary-foreground/20" />
        <TrustBadges variant="footer" className="mb-4" />
        {trademarkMode === "minimal" ? (
          <MinimalTrademarkFooter />
        ) : (
          <p className="text-center text-[10px] text-primary-foreground/35 sm:text-[11px]">
            © {new Date().getFullYear()} Forest Buddies®
          </p>
        )}
      </div>
    </footer>
  );
}
