"use client";

import {
  BookOpen,
  Leaf,
  Package,
  PawPrint,
  Sun,
  Waves,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/contexts/i18n-context";
import { formatCauseUnits, selectionLines } from "@/lib/causes";
import {
  consumeLastDonation,
  type LastDonation,
} from "@/lib/impact-storage";

const CAUSE_ICONS = {
  trees: Leaf,
  waves: Waves,
  paw: PawPrint,
  book: BookOpen,
  sun: Sun,
} as const;

export default function OrderConfirmationPage() {
  const { t } = useI18n();
  const [donation, setDonation] = useState<LastDonation | null>(null);

  useEffect(() => {
    setDonation(consumeLastDonation());
  }, []);

  const orderNumber = `FB-${Date.now().toString().slice(-8)}`;
  const lines = donation ? selectionLines(donation.selection) : [];

  return (
    <div className="mx-auto max-w-md px-4 py-12 text-center sm:py-16">
      <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-primary/10 sm:size-20">
        <Package className="size-8 text-primary sm:size-10" />
      </div>

      <h1 className="font-heading text-3xl font-semibold text-primary">
        {t("confirmation.title")}
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        {t("confirmation.subtitle")} Your order is being prepared with care.
      </p>

      <div className="mt-8 space-y-3 rounded-2xl border bg-card p-5 text-left sm:p-6">
        <div className="flex items-center justify-between gap-3 text-base">
          <span className="text-muted-foreground">Order number</span>
          <span className="font-mono font-medium">{orderNumber}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-base">
          <span className="text-muted-foreground">Estimated delivery</span>
          <span>3–5 business days</span>
        </div>

        {lines.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
              Your chosen impact
            </p>
            {lines.map(({ cause, units, cost }) => {
              const Icon = CAUSE_ICONS[cause.icon];
              return (
                <div
                  key={cause.id}
                  className="flex items-start gap-2 text-base text-emerald-800"
                >
                  <Icon className="mt-0.5 size-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">
                      {cause.name}: {formatCauseUnits(cause, units)}
                    </div>
                    <div className="text-sm text-emerald-700/80">
                      {cause.tagline}
                    </div>
                  </div>
                  <span className="shrink-0 tabular-nums">+${cost.toFixed(2)}</span>
                </div>
              );
            })}
            <p className="pt-1 text-base font-medium text-emerald-900">
              ~{donation!.totalCo2} kg CO₂ equivalent — thank you for giving
              back.
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Button
          nativeButton={false}
          render={<Link href="/marketplace" />}
          size="lg"
          className="min-h-12 w-full text-base"
        >
          {t("confirmation.continue")}
        </Button>
        <Button
          nativeButton={false}
          render={<Link href="/dashboard" />}
          variant="outline"
          size="lg"
          className="min-h-12 w-full text-base"
        >
          {t("confirmation.dashboard")}
        </Button>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        A confirmation email is on the way. Track every cause you support in
        your dashboard.
      </p>
    </div>
  );
}
