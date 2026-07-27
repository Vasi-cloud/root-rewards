"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import {
  formatLanguageOptionLabel,
  getLanguageOption,
  useI18n,
} from "@/contexts/i18n-context";

/**
 * Dismissible notice when a not-yet-ready language is selected.
 * UI stays in English (option a) — this banner explains why.
 */
export function LanguageComingSoonBanner() {
  const { lang, isLangReady } = useI18n();
  const [dismissed, setDismissed] = useState(false);

  // Re-show when the user picks another coming-soon language
  useEffect(() => {
    setDismissed(false);
  }, [lang]);

  if (isLangReady || dismissed) return null;

  const option = getLanguageOption(lang);
  const languageName = option?.label ?? lang;

  return (
    <div
      role="status"
      className="border-b border-amber-200/80 bg-amber-50 text-amber-950"
    >
      <div className="mx-auto flex max-w-6xl items-start gap-3 px-3 py-2.5 sm:items-center sm:px-6">
        <p className="min-w-0 flex-1 text-xs leading-relaxed sm:text-sm">
          Language support for <span className="font-semibold">{languageName}</span>{" "}
          is coming soon. The site is currently in English.
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-amber-900/70 transition-colors hover:bg-amber-100 hover:text-amber-950"
          aria-label="Dismiss language notice"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

/** Short helper text for language switchers (optional inline notice). */
export function languageComingSoonHint(langLabel: string): string {
  return `Language support for ${langLabel} is coming soon. The site is currently in English.`;
}

export { formatLanguageOptionLabel };
