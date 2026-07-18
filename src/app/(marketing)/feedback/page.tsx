"use client";

import {
  Bug,
  Heart,
  Lightbulb,
  MessageCircleHeart,
  Sparkles,
  Stars,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { submitFeedback } from "@/lib/feedback-storage";
import { consumeRateLimit } from "@/lib/rate-limit";
import {
  validateEmail,
  validateFeedbackCategory,
  validateMessage,
  validateName,
} from "@/lib/validation";
import {
  FEEDBACK_CATEGORY_HINTS,
  FEEDBACK_CATEGORY_LABELS,
  type FeedbackCategory,
} from "@/types/feedback";

const CATEGORIES: {
  id: FeedbackCategory;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "idea", icon: Lightbulb },
  { id: "feature", icon: Sparkles },
  { id: "issue", icon: Bug },
  { id: "other", icon: Heart },
];

export default function FeedbackPage() {
  const { user, profile } = useAuth();
  const pathname = usePathname();
  const [category, setCategory] = useState<FeedbackCategory>("idea");
  const [message, setMessage] = useState("");
  const [name, setName] = useState(profile?.displayName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cat = validateFeedbackCategory(category);
    if (!cat.ok) {
      setError(cat.error);
      return;
    }
    const msg = validateMessage(message, {
      min: 5,
      max: 2000,
      label: "Message",
    });
    if (!msg.ok) {
      setError(msg.error);
      return;
    }
    const nameResult = validateName(name, { required: false, max: 80 });
    if (!nameResult.ok) {
      setError(nameResult.error);
      return;
    }
    const emailResult = validateEmail(email, { required: false });
    if (!emailResult.ok) {
      setError(emailResult.error);
      return;
    }

    const rate = consumeRateLimit("feedback");
    if (!rate.allowed) {
      setError(rate.message);
      return;
    }

    setSending(true);
    await new Promise((r) => setTimeout(r, 400));
    submitFeedback({
      category: cat.value as FeedbackCategory,
      message: msg.value,
      name: nameResult.value,
      email: emailResult.value,
      pagePath: pathname,
    });
    setSending(false);
    setDone(true);
    setMessage("");
  }

  if (done) {
    return (
      <div className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(149,213,178,0.45),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-lg px-4 py-16 text-center sm:px-6 sm:py-24">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-900">
            <Stars className="size-7" />
          </div>
          <h1 className="font-heading mt-5 text-3xl font-semibold text-primary">
            Thank you for growing with us
          </h1>
          <p className="mt-3 text-muted-foreground">
            Your note is planted in our feedback garden. Real humans (and
            someday Firebase) will read it — every idea helps Forest Buddies
            bloom.
          </p>
          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={() => setDone(false)} size="lg">
              Share another thought
            </Button>
            <Button
              variant="outline"
              size="lg"
              nativeButton={false}
              render={<Link href="/marketplace" />}
            >
              Back to shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(149,213,178,0.35),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <Badge className="mb-3 gap-1 bg-emerald-800/10 text-emerald-900">
          <MessageCircleHeart className="size-3.5" />
          Feedback
        </Badge>
        <h1 className="font-heading text-3xl font-semibold text-primary sm:text-4xl">
          Help us grow Forest Buddies
        </h1>
        <p className="mt-3 text-muted-foreground sm:text-lg">
          Ideas, bugs, feature wishes — we read every note. No pressure, no
          perfection. Kindness welcome; rough drafts welcome too.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 rounded-3xl border border-border/70 bg-white/85 p-5 shadow-sm sm:p-7"
        >
          <div>
            <p className="mb-2 text-sm font-medium">What’s on your mind?</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {CATEGORIES.map(({ id, icon: Icon }) => {
                const active = category === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCategory(id)}
                    className={`rounded-2xl border px-3 py-3 text-left transition-all ${
                      active
                        ? "border-emerald-700 bg-emerald-50 shadow-sm"
                        : "border-border/80 bg-cream/40 hover:border-emerald-300"
                    }`}
                  >
                    <span className="flex items-center gap-2 font-medium text-primary">
                      <Icon className="size-4 text-emerald-800" />
                      {FEEDBACK_CATEGORY_LABELS[id]}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {FEEDBACK_CATEGORY_HINTS[id]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="fb-message" className="mb-1.5 block text-sm font-medium">
              Your message
            </label>
            <textarea
              id="fb-message"
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what you imagined, what broke, or what made you smile…"
              className="w-full resize-y rounded-2xl border border-input bg-background px-4 py-3 text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
              maxLength={2000}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              A few sentences is plenty (max 2000 characters). We love specifics
              when you have them.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="fb-name" className="mb-1.5 block text-sm font-medium">
                Name <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <input
                id="fb-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex"
                maxLength={80}
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="fb-email" className="mb-1.5 block text-sm font-medium">
                Email <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <input
                id="fb-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                maxLength={320}
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className="min-h-11 w-full gap-2"
            disabled={sending || !message.trim()}
          >
            <MessageCircleHeart className="size-4" />
            {sending ? "Planting your note…" : "Send feedback"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Stored locally for this demo — submissions are rate-limited in your
            browser. See our{" "}
            <Link href="/privacy" className="text-primary underline-offset-2 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </form>
      </div>
    </div>
  );
}
