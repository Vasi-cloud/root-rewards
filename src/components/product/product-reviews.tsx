import { Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  averageRating,
  getMockReviews,
  type ProductReview,
} from "@/lib/trust";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`size-3.5 ${
            i < rating
              ? "fill-gold text-gold"
              : "fill-transparent text-muted-foreground/40"
          }`}
          aria-hidden
        />
      ))}
    </span>
  );
}

export function ProductReviews({
  productId,
  productName,
  className = "",
}: {
  productId: string;
  productName?: string;
  className?: string;
}) {
  const reviews = getMockReviews(productId, 3);
  const avg = averageRating(reviews);

  return (
    <section
      className={`rounded-2xl border border-border/70 bg-white/80 p-4 sm:p-5 ${className}`}
      aria-label="Customer reviews"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="font-heading text-lg font-semibold text-primary">
            Customer reviews
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Mock reviews for demo · real ratings come later
            {productName ? ` · ${productName}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Stars rating={Math.round(avg)} />
          <span className="text-sm font-semibold tabular-nums text-primary">
            {avg.toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground">
            ({reviews.length})
          </span>
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </ul>
    </section>
  );
}

function ReviewCard({ review }: { review: ProductReview }) {
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
        </div>
        <span className="text-xs text-muted-foreground">{review.dateLabel}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {review.body}
      </p>
      <p className="mt-2 text-xs text-muted-foreground/90">
        {review.author} · {review.location}
      </p>
    </li>
  );
}
