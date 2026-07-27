import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EcoEmptyPanelProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  children?: ReactNode;
  primaryAction?: {
    href: string;
    label: string;
  };
  secondaryAction?: {
    href: string;
    label: string;
  };
};

/**
 * Shared empty / early-state panel for Forest Buddies surfaces.
 * Friendly tone, forest-green dashed card, tap-friendly CTAs.
 */
export function EcoEmptyPanel({
  icon: Icon,
  title,
  description,
  className,
  children,
  primaryAction,
  secondaryAction,
}: EcoEmptyPanelProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-emerald-300/80 bg-emerald-50/40 px-4 py-8 text-center sm:rounded-3xl sm:px-6 sm:py-10",
        className
      )}
    >
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-white text-emerald-800 shadow-sm ring-1 ring-emerald-200/80 sm:size-14">
        <Icon className="size-5 sm:size-6" aria-hidden />
      </span>
      <p className="font-heading mt-3 text-base font-semibold text-emerald-950 sm:mt-4 sm:text-lg">
        {title}
      </p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {(primaryAction || secondaryAction) && (
        <div className="mx-auto mt-5 flex w-full max-w-sm flex-col gap-2 sm:flex-row sm:justify-center">
          {primaryAction && (
            <Button
              nativeButton={false}
              render={<Link href={primaryAction.href} />}
              className="h-11 gap-2 bg-emerald-800 text-cream hover:bg-emerald-900 sm:h-10"
            >
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              nativeButton={false}
              render={<Link href={secondaryAction.href} />}
              variant="outline"
              className="h-11 border-emerald-200 bg-white sm:h-10"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
