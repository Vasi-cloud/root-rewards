import type {
  ProductReviewRecord,
  ReviewStatus,
  ReviewSubmitInput,
} from "@/types/reviews";

export const REVIEWS_STORAGE_KEY = "forest-buddies-product-reviews";
const EVENT = "forest-buddies-reviews-updated";

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT));
  }
}

export function subscribeReviews(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function loadAllReviews(): ProductReviewRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ProductReviewRecord[];
    return Array.isArray(parsed)
      ? parsed.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      : [];
  } catch {
    return [];
  }
}

function saveAllReviews(items: ProductReviewRecord[]) {
  try {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(items.slice(0, 500)));
    emit();
  } catch {
    // ignore
  }
}

/** Public reviews + the signed-in author's own pending review. */
export function listVisibleReviews(
  productId: string,
  viewerUid?: string | null
): ProductReviewRecord[] {
  return loadAllReviews().filter((r) => {
    if (r.productId !== productId) return false;
    if (r.status === "approved") return true;
    if (
      r.status === "pending" &&
      viewerUid &&
      r.authorUid &&
      r.authorUid === viewerUid
    ) {
      return true;
    }
    return false;
  });
}

export function listReviewsForProduct(productId: string): ProductReviewRecord[] {
  return loadAllReviews().filter((r) => r.productId === productId);
}

export function getUserReviewForProduct(
  productId: string,
  authorUid: string
): ProductReviewRecord | null {
  return (
    loadAllReviews().find(
      (r) => r.productId === productId && r.authorUid === authorUid
    ) ?? null
  );
}

export function averageFromReviews(
  reviews: Array<{ rating: number }>
): number {
  if (reviews.length === 0) return 0;
  return (
    Math.round(
      (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10
    ) / 10
  );
}

export function submitReview(input: ReviewSubmitInput): ProductReviewRecord {
  const rating = Math.min(5, Math.max(1, Math.round(input.rating)));
  const title = input.title.trim().slice(0, 100);
  const body = input.body.trim().slice(0, 2000);
  const authorName = input.authorName.trim().slice(0, 80) || "Forest friend";

  if (!title || body.length < 8) {
    throw new Error("Add a short title and at least a sentence of feedback.");
  }

  const all = loadAllReviews();
  const now = new Date().toISOString();

  // One review per signed-in user per product — update in place
  if (input.authorUid) {
    const existingIdx = all.findIndex(
      (r) => r.productId === input.productId && r.authorUid === input.authorUid
    );
    if (existingIdx >= 0) {
      const updated: ProductReviewRecord = {
        ...all[existingIdx],
        rating,
        title,
        body,
        authorName,
        authorEmail: input.authorEmail,
        location: input.location?.trim().slice(0, 80),
        verified: Boolean(input.verified),
        status: "pending",
        createdAt: now,
        moderatedAt: undefined,
        moderatorNote: undefined,
      };
      const next = [...all];
      next[existingIdx] = updated;
      saveAllReviews(next);
      return updated;
    }
  }

  const item: ProductReviewRecord = {
    id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    productId: input.productId,
    productName: input.productName.trim().slice(0, 120),
    listingType: input.listingType === "service" ? "service" : "product",
    rating,
    title,
    body,
    authorName,
    authorUid: input.authorUid,
    authorEmail: input.authorEmail,
    location: input.location?.trim().slice(0, 80),
    verified: Boolean(input.verified),
    status: "pending",
    createdAt: now,
  };

  saveAllReviews([item, ...all]);
  return item;
}

export function setReviewStatus(
  id: string,
  status: ReviewStatus,
  moderatorNote?: string
): ProductReviewRecord | null {
  const all = loadAllReviews();
  let updated: ProductReviewRecord | null = null;
  const next = all.map((item) => {
    if (item.id !== id) return item;
    updated = {
      ...item,
      status,
      moderatedAt: new Date().toISOString(),
      moderatorNote: moderatorNote?.trim() || item.moderatorNote,
    };
    return updated;
  });
  if (updated) saveAllReviews(next);
  return updated;
}

export function deleteReview(id: string) {
  saveAllReviews(loadAllReviews().filter((r) => r.id !== id));
}

export function reviewStats(items: ProductReviewRecord[] = loadAllReviews()) {
  return {
    total: items.length,
    pending: items.filter((i) => i.status === "pending").length,
    approved: items.filter((i) => i.status === "approved").length,
    hidden: items.filter((i) => i.status === "hidden").length,
  };
}

export function formatReviewDate(iso: string): string {
  try {
    const then = new Date(iso).getTime();
    const days = Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24));
    if (days <= 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 14) return `${days} days ago`;
    if (days < 45) return `${Math.floor(days / 7)} weeks ago`;
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}
