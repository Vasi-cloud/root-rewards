"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import {
  HIRE_REQUEST_CONFIRMATION,
  submitLeaValleyHireRequest,
} from "@/lib/hire-requests";
import { leaValleyHireTitle } from "@/lib/lea-valley-guest";

export function LeaValleyHireRequestForm({
  listingId,
  listingName,
  onClose,
}: {
  listingId: string;
  listingName: string;
  onClose: () => void;
}) {
  const { user, profile } = useAuth();
  const listingTitle = leaValleyHireTitle(listingId, listingName);
  const [name, setName] = useState(
    () => profile?.displayName?.trim() || user?.displayName?.trim() || ""
  );
  const [email, setEmail] = useState(() => user?.email?.trim() || "");
  const [dates, setDates] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !dates.trim()) {
      setError("Name, email, and dates are needed.");
      return;
    }
    setSubmitting(true);
    try {
      await submitLeaValleyHireRequest({
        listingId,
        listingTitle,
        name,
        email,
        dates,
      });
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not send this request."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-forest/45 p-0 backdrop-blur-[6px] sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Request to rent"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl border border-border bg-cream p-5 shadow-2xl sm:rounded-3xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Request to rent
            </p>
            <h2 className="font-heading text-lg font-semibold text-primary">
              {listingTitle}
            </h2>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="size-5" />
          </Button>
        </div>

        {sent ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3.5 py-3 text-sm leading-relaxed text-emerald-950">
            {HIRE_REQUEST_CONFIRMATION}
          </p>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
            <div>
              <Label htmlFor="hire-request-title">Listing</Label>
              <Input
                id="hire-request-title"
                value={listingTitle}
                readOnly
                className="mt-1 bg-muted/40"
              />
            </div>
            <div>
              <Label htmlFor="hire-request-name">Name</Label>
              <Input
                id="hire-request-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={120}
                autoComplete="name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="hire-request-email">Email</Label>
              <Input
                id="hire-request-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={160}
                autoComplete="email"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="hire-request-dates">Dates</Label>
              <Input
                id="hire-request-dates"
                value={dates}
                onChange={(e) => setDates(e.target.value)}
                required
                maxLength={200}
                placeholder="e.g. Sat 12 Oct, full day"
                className="mt-1"
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" disabled={submitting} className="min-h-11 w-full">
              {submitting ? "Sending…" : "Send request"}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              No card is charged. The seller confirms dates.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
