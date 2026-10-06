"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateEmail } from "@/lib/validation";

export const SERVICE_TIME_REQUEST_CONFIRMATION =
  "Request sent — the seller confirms. This is not a booking.";

export function ServiceTimeRequestButton({
  serviceTitle,
  listingId,
  shopUid,
  shopName,
}: {
  serviceTitle: string;
  listingId: string;
  shopUid: string;
  shopName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="inline-flex min-h-9 items-center font-medium text-primary underline-offset-2 hover:underline"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
      >
        Request a time
      </button>
      {open ? (
        <ServiceTimeRequestForm
          serviceTitle={serviceTitle}
          listingId={listingId}
          shopUid={shopUid}
          shopName={shopName}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

export function ServiceTimeRequestForm({
  serviceTitle,
  listingId,
  shopUid,
  shopName,
  onClose,
}: {
  serviceTitle: string;
  listingId: string;
  shopUid: string;
  shopName: string;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const emailResult = validateEmail(email);
    if (!name.trim() || !emailResult.ok || !preferredTime.trim()) {
      setError(
        emailResult.ok
          ? "Name, email, and a preferred time are needed."
          : emailResult.error
      );
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          serviceTitle,
          name,
          email: emailResult.value,
          preferredTime,
          shopUid,
          shopName,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Could not send this request.");
      }
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
      aria-label="Request a time"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl border border-border bg-cream p-5 shadow-2xl sm:rounded-3xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="font-heading text-lg font-semibold text-primary">
            Request a time
          </h2>
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
            {SERVICE_TIME_REQUEST_CONFIRMATION}
          </p>
        ) : (
          <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
            <div>
              <Label htmlFor="service-time-name">Name</Label>
              <Input
                id="service-time-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="service-time-email">Email</Label>
              <Input
                id="service-time-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="service-time-service">Service</Label>
              <Input
                id="service-time-service"
                value={serviceTitle}
                readOnly
                className="mt-1 bg-muted/40"
              />
            </div>
            <div>
              <Label htmlFor="service-time-when">Preferred time</Label>
              <Input
                id="service-time-when"
                value={preferredTime}
                onChange={(event) => setPreferredTime(event.target.value)}
                autoComplete="off"
                className="mt-1"
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
            <Button type="submit" className="min-h-11 w-full" disabled={submitting}>
              {submitting ? "Sending…" : "Send"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
