"use client";

import { Leaf, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { TrademarkRegLink } from "@/components/legal/trademark-reg-link";

export function HomeTrustStrip() {
  return (
    <section
      aria-label="Why Forest Buddies®"
      className="border-b border-emerald-200/60 bg-cream px-4 py-4 sm:px-6 sm:py-5"
    >
      <ul className="mx-auto flex w-full max-w-5xl flex-col gap-3 sm:max-w-6xl sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        <li className="flex min-h-11 items-start gap-2.5 text-sm text-emerald-950/90 sm:min-h-0 sm:items-center">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-800 sm:mt-0" />
          <span className="leading-snug">
            <span className="font-medium">Forest Buddies®</span>
            {" · "}
            UK Registered Trademark (
            <TrademarkRegLink className="font-medium text-emerald-900 underline-offset-2 hover:underline" />
            )
          </span>
        </li>
        <li className="flex min-h-11 items-start gap-2.5 text-sm text-emerald-950/90 sm:min-h-0 sm:items-center">
          <Leaf className="mt-0.5 size-4 shrink-0 text-emerald-800 sm:mt-0" />
          <span className="leading-snug">
            Shop that funds trees &amp; causes — impact you can track
          </span>
        </li>
        <li className="flex min-h-11 items-start gap-2.5 text-sm text-emerald-950/90 sm:min-h-0 sm:items-center">
          <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-800 sm:mt-0" />
          <span className="leading-snug">
            Local-first helpers —{" "}
            <Link
              href="/local"
              className="font-medium text-emerald-900 underline-offset-2 hover:underline"
            >
              Buy Local
            </Link>{" "}
            when you can
          </span>
        </li>
      </ul>
    </section>
  );
}
