"use client";

import { Suspense } from "react";

import { AffiliateTracker } from "@/components/affiliate/AffiliateTracker";
import { AbandonedCartRecovery } from "@/components/cart/AbandonedCartRecovery";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SupportChat } from "@/components/support/SupportChat";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col overflow-x-hidden">
      <Suspense fallback={null}>
        <AffiliateTracker />
      </Suspense>
      <SiteHeader />
      <AbandonedCartRecovery />
      <main className="min-w-0 flex-1">{children}</main>
      <SiteFooter />
      <SupportChat />
    </div>
  );
}
