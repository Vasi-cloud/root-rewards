"use client";

import {
  BookOpen,
  Leaf,
  PawPrint,
  Quote,
  Sun,
  Waves,
} from "lucide-react";

import type { CauseId } from "@/lib/causes";
import { formatCauseUnits, getCause } from "@/lib/causes";
import type { SellerProfile } from "@/types";

const CAUSE_ICONS = {
  trees: Leaf,
  waves: Waves,
  paw: PawPrint,
  book: BookOpen,
  sun: Sun,
} as const;

export function ShopStoryAndImpact({ shop }: { shop: SellerProfile }) {
  const impact = shop.impact ?? [];
  const paragraphs = (shop.story ?? "")
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const pullQuote =
    shop.impactStory?.split(/(?<=[.!?])\s+/)[0] ??
    paragraphs[0]?.slice(0, 140);

  return (
    <div className="space-y-10">
      <div className="grid items-start gap-10 lg:grid-cols-12">
        <section className="animate-fb-fade-up lg:col-span-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800/70">
            From the maker
          </p>
          <h2 className="font-heading mt-2 text-3xl font-semibold text-primary sm:text-4xl">
            The story behind the shop
          </h2>

          {paragraphs.length > 0 ? (
            <div className="mt-6 space-y-5 text-base leading-[1.75] text-foreground/88 sm:text-lg">
              {paragraphs.map((para, i) => (
                <p
                  key={`${i}-${para.slice(0, 20)}`}
                  className={
                    i === 0
                      ? "first-letter:float-left first-letter:mr-3 first-letter:font-heading first-letter:text-5xl first-letter:leading-[0.85] first-letter:text-primary"
                      : undefined
                  }
                >
                  {para}
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-muted-foreground">
              This maker is still writing their story.
            </p>
          )}
        </section>

        <aside
          className="animate-fb-fade-up lg:col-span-5"
          style={{ animationDelay: "100ms" }}
        >
          {pullQuote && (
            <figure className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-white via-cream to-sage/20 p-6 sm:p-7">
              <Quote
                className="absolute top-4 right-4 size-10 text-sage/50"
                aria-hidden
              />
              <blockquote className="font-heading text-xl leading-snug text-primary sm:text-2xl">
                “{pullQuote.replace(/^["“]|["”]$/g, "")}
                {pullQuote.length >= 140 ? "…" : ""}”
              </blockquote>
              <figcaption className="mt-4 text-sm text-muted-foreground">
                — {shop.shopName}
                {shop.location ? ` · ${shop.location}` : ""}
              </figcaption>
            </figure>
          )}

          {shop.impactStory && (
            <div className="mt-5 rounded-3xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 via-cream to-sky-50/50 p-6">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800/80">
                <Leaf className="size-3.5" />
                Impact story
              </p>
              <h3 className="font-heading mt-2 text-xl font-semibold text-emerald-950">
                What your order sets in motion
              </h3>
              <p className="mt-3 text-base leading-relaxed text-emerald-950/85">
                {shop.impactStory}
              </p>
            </div>
          )}
        </aside>
      </div>

      {impact.length > 0 && (
        <section className="animate-fb-fade-up" style={{ animationDelay: "140ms" }}>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800/70">
                Collective good
              </p>
              <h3 className="font-heading mt-2 text-2xl font-semibold text-primary">
                Impact grown by this shop
              </h3>
            </div>
            <p className="max-w-sm text-sm text-muted-foreground">
              Live totals from confirmed sales — transparent, not buried in
              fine print.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {impact.map((row) => {
              const cause = getCause(row.causeId as CauseId);
              if (!cause) return null;
              const Icon = CAUSE_ICONS[cause.icon];
              return (
                <div
                  key={row.causeId}
                  className="rounded-2xl border border-emerald-200/80 bg-white/90 p-5 shadow-sm"
                >
                  <div className="flex items-center gap-2 text-emerald-900">
                    <span className="flex size-8 items-center justify-center rounded-full bg-emerald-50">
                      <Icon className="size-4" />
                    </span>
                    <span className="font-medium">{cause.name}</span>
                  </div>
                  <p className="font-heading mt-3 text-3xl font-semibold text-emerald-950">
                    {formatCauseUnits(cause, row.unitsSupported)}
                  </p>
                  {row.label && (
                    <p className="mt-1.5 text-sm text-emerald-800/80">
                      {row.label}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
