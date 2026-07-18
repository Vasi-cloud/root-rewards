import Link from "next/link";

import {
  CHECKOUT_TRUST_IDS,
  FOOTER_TRUST_IDS,
  PRODUCT_TRUST_IDS,
  getTrustBadges,
  type TrustBadgeId,
} from "@/lib/trust";

type TrustBadgesVariant = "checkout" | "footer" | "product" | "custom";

export function TrustBadges({
  variant = "product",
  ids,
  className = "",
  showDescriptions = false,
}: {
  variant?: TrustBadgesVariant;
  ids?: TrustBadgeId[];
  className?: string;
  showDescriptions?: boolean;
}) {
  const resolvedIds =
    ids ??
    (variant === "checkout"
      ? CHECKOUT_TRUST_IDS
      : variant === "footer"
        ? FOOTER_TRUST_IDS
        : PRODUCT_TRUST_IDS);
  const badges = getTrustBadges(resolvedIds);

  if (variant === "footer") {
    return (
      <ul
        className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-2 ${className}`}
        aria-label="Trust signals"
      >
        {badges.map((badge) => {
          const Icon = badge.icon;
          return (
            <li
              key={badge.id}
              className="inline-flex items-center gap-1.5 text-xs text-primary-foreground/80 sm:text-sm"
              title={badge.description}
            >
              <Icon className="size-3.5 shrink-0 text-sage" aria-hidden />
              <span>{badge.shortLabel}</span>
            </li>
          );
        })}
      </ul>
    );
  }

  if (variant === "checkout") {
    return (
      <div
        className={`rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 ${className}`}
        aria-label="Secure checkout"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/80">
          Shop with confidence
        </p>
        <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {badges.map((badge) => {
            const Icon = badge.icon;
            return (
              <li key={badge.id} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-900 shadow-sm">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-medium text-emerald-950">
                    {badge.label}
                  </span>
                  <span className="block text-xs text-emerald-900/75">
                    {badge.description}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-emerald-900/70">
          Demo badges — live payment security and eco audits connect later.{" "}
          <Link
            href="/returns"
            className="font-medium underline-offset-2 hover:underline"
          >
            Returns policy
          </Link>
        </p>
      </div>
    );
  }

  // product / custom — compact chip row
  return (
    <ul
      className={`flex flex-wrap gap-2 ${className}`}
      aria-label="Product trust signals"
    >
      {badges.map((badge) => {
        const Icon = badge.icon;
        return (
          <li
            key={badge.id}
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-1 text-xs font-medium text-emerald-950"
            title={showDescriptions ? badge.description : undefined}
          >
            <Icon className="size-3.5 text-emerald-800" aria-hidden />
            {badge.shortLabel}
          </li>
        );
      })}
    </ul>
  );
}
