"use client";

import { Leaf, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { consumeRateLimit } from "@/lib/rate-limit";
import {
  averageFromReviews,
  formatReviewDate,
  getUserReviewForProduct,
  listVisibleReviews,
  submitReview,
  subscribeReviews,
} from "@/lib/review-storage";
import {
  averageRating,
  getMockReviews,
  type ProductReview,
} from "@/lib/trust";
import type { ProductReviewRecord } from "@/types/reviews";

function Stars({
  rating,
  size = "sm",
  interactive = false,
  onSelect,
}: {
  rating: number;
  size?: "sm" | "md";
  interactive?: boolean;
  onSelect?: (n: number) => void;
}) {
  const cls = size === "md" ? "size-6" : "size-3.5";
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const n = i + 1;
        const filled = n <= rating;
        if (interactive && onSelect) {
          return (
            <button
              key={n}
              type="button"
              onClick={() => onSelect(n)}
              className="rounded p-0.5 transition-transform hover:scale-110"
              aria-label={`${n} stars`}
            >
              <Star
                className={`${cls} ${
                  filled
                    ? "fill-gold text-gold"
                    : "fill-transparent text-muted-foreground/40"
                }`}
              />
            </button>
          );
        }
        return (
          <Star
            key={n}
            className={`${cls} ${
              filled
                ? "fill-gold text-gold"
                : "fill-transparent text-muted-foreground/40"
            }`}
            aria-hidden
          />
        );
      })}
    </span>
  );
}

type DisplayReview = {
  id: string;
  author: string;
  location?: string;
  rating: number;
  title: string;
  body: string;
  dateLabel: string;
  verified: boolean;
  pending?: boolean;
  community?: boolean;
};

function toDisplay(r: ProductReviewRecord): DisplayReview {
  return {
    id: r.id,
    author: r.authorName,
    location: r.location,
    rating: r.rating,
    title: r.title,
    body: r.body,
    dateLabel: formatReviewDate(r.createdAt),
    verified: r.verified,
    pending: r.status === "pending",
  };
}

function mockToDisplay(r: ProductReview): DisplayReview {
  return {
    id: r.id,
    author: r.author,
    location: r.location,
    rating: r.rating,
    title: r.title,
    body: r.body,
    dateLabel: r.dateLabel,
    verified: r.verified,
    community: true,
  };
}

export function ProductReviews({
  productId,
  productName,
  listingType = "product",
  className = "",
}: {
  productId: string;
  productName?: string;
  listingType?: "product" | "service";
  className?: string;
}) {
  const { user, profile } = useAuth();
  const [stored, setStored] = useState<ProductReviewRecord[]>([]);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = () => {
    setStored(listVisibleReviews(productId, user?.uid));
  };

  useEffect(() => {
    setStored(listVisibleReviews(productId, user?.uid));
    return subscribeReviews(() => {
      setStored(listVisibleReviews(productId, user?.uid));
    });
  }, [productId, user?.uid]);

  useEffect(() => {
    if (!user) return;
    const mine = getUserReviewForProduct(productId, user.uid);
    if (mine) {
      setRating(mine.rating);
      setTitle(mine.title);
      setBody(mine.body);
      setLocation(mine.location ?? "");
    }
  }, [user, productId]);

  const community = useMemo(
    () => getMockReviews(productId, 2).map(mockToDisplay),
    [productId]
  );

  const reviews: DisplayReview[] = useMemo(() => {
    const userOnes = stored.map(toDisplay);
    // Prefer real reviews; keep a couple of community notes when few exist
    if (userOnes.length >= 3) return userOnes;
    const communityIds = new Set(userOnes.map((r) => r.title + r.author));
    const extras = community.filter(
      (c) => !communityIds.has(c.title + c.author)
    );
    return [...userOnes, ...extras];
  }, [stored, community]);

  const avg =
    stored.length > 0
      ? averageFromReviews(stored.filter((r) => r.status === "approved" || r.status === "pending"))
      : averageRating(getMockReviews(productId, 3));

  const approvedCount = stored.filter((r) => r.status === "approved").length;
  const totalShown = reviews.length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user) {
      setError("Sign in to leave a review.");
      return;
    }

    const rate = consumeRateLimit("review");
    if (!rate.allowed) {
      setError(rate.message);
      return;
    }

    setSubmitting(true);
    try {
      const record = submitReview({
        productId,
        productName: productName ?? "Listing",
        listingType,
        rating,
        title,
        body,
        authorName:
          profile?.displayName?.trim() ||
          user.displayName?.trim() ||
          user.email?.split("@")[0] ||
          "Forest friend",
        authorUid: user.uid,
        authorEmail: user.email ?? undefined,
        location: location.trim() || undefined,
        verified: true,
      });
      refresh();
      setSuccess(
        record.status === "pending"
          ? "Thanks — your review is awaiting a quick eco-check before it goes live."
          : "Thanks — your review is live."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      className={`rounded-2xl border border-border/70 bg-white/80 p-4 sm:p-5 ${className}`}
      aria-label="Customer reviews"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="font-heading text-lg font-semibold text-primary">
            {listingType === "service" ? "Session reviews" : "Customer reviews"}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Real shopper notes · moderated for kindness &amp; honesty
            {productName ? ` · ${productName}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Stars rating={Math.round(avg)} />
          <span className="text-sm font-semibold tabular-nums text-primary">
            {avg.toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground">
            ({approvedCount > 0 ? approvedCount : totalShown})
          </span>
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </ul>

      <div className="mt-5 rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 via-cream to-background p-4">
        <div className="mb-3 flex items-center gap-2 text-emerald-900">
          <Leaf className="size-4" />
          <h4 className="font-heading text-base font-semibold">
            Share your experience
          </h4>
        </div>

        {!user ? (
          <p className="text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Sign in
            </Link>{" "}
            to leave a star rating and review for this{" "}
            {listingType === "service" ? "service" : "product"}.
          </p>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                Your rating
              </p>
              <Stars
                rating={rating}
                size="md"
                interactive
                onSelect={setRating}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={100}
                placeholder="e.g. Durable and planet-kind"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Review
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                minLength={8}
                maxLength={2000}
                rows={3}
                placeholder="What did you love? Materials, fit, session quality…"
                className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Location (optional)
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={80}
                placeholder="City, region"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            {success && (
              <p className="text-sm text-emerald-800">{success}</p>
            )}
            <Button type="submit" disabled={submitting} className="min-h-11">
              {submitting ? "Saving…" : "Submit review"}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Reviews are checked for spam and greenwashing before going fully
              public.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}

function ReviewCard({ review }: { review: DisplayReview }) {
  return (
    <li className="rounded-xl border border-border/60 bg-cream/40 px-3.5 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Stars rating={review.rating} />
          <span className="text-sm font-medium text-foreground">
            {review.title}
          </span>
          {review.verified && (
            <Badge
              variant="outline"
              className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-900"
            >
              Verified buyer
            </Badge>
          )}
          {review.pending && (
            <Badge className="bg-amber-100 text-[10px] text-amber-950">
              Pending review
            </Badge>
          )}
          {review.community && (
            <Badge variant="secondary" className="text-[10px]">
              Community
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{review.dateLabel}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {review.body}
      </p>
      <p className="mt-2 text-xs text-muted-foreground/90">
        {review.author}
        {review.location ? ` · ${review.location}` : ""}
      </p>
    </li>
  );
}

/** Compact stars for marketplace / shop cards */
export function ProductRatingBadge({
  productId,
  className = "",
}: {
  productId: string;
  className?: string;
}) {
  const [avg, setAvg] = useState<number | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const compute = () => {
      const visible = listVisibleReviews(productId);
      const approved = visible.filter((r) => r.status === "approved");
      if (approved.length > 0) {
        setAvg(averageFromReviews(approved));
        setCount(approved.length);
      } else {
        const mocks = getMockReviews(productId, 3);
        setAvg(averageRating(mocks));
        setCount(mocks.length);
      }
    };
    compute();
    return subscribeReviews(compute);
  }, [productId]);

  if (avg == null) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs text-muted-foreground ${className}`}
    >
      <Star className="size-3 fill-gold text-gold" />
      <span className="font-medium tabular-nums text-foreground">
        {avg.toFixed(1)}
      </span>
      <span>({count})</span>
    </span>
  );
}
