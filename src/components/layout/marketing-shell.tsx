"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";

import { AffiliateTracker } from "@/components/affiliate/AffiliateTracker";
import {
  SubtleTrademarkNotice,
  shouldShowShopTrademarkStrip,
} from "@/components/brand/brand-mark";
import { AbandonedCartRecovery } from "@/components/cart/AbandonedCartRecovery";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SupportChat } from "@/components/support/SupportChat";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showShopStrip = shouldShowShopTrademarkStrip(pathname);

  return (
    <div className="flex min-h-full flex-col overflow-x-hidden">
      <Suspense fallback={null}>
        <AffiliateTracker />
      </Suspense>
      <SiteHeader />
      <AbandonedCartRecovery />
      <main className="min-w-0 flex-1">{children}</main>
      {showShopStrip ? (
        <div className="border-t border-border/20 px-4 py-1.5">
          <SubtleTrademarkNotice />
        </div>
      ) : null}
      <SiteFooter />
      <SupportChat />
    </div>
  );
}
