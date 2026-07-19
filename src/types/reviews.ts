export type ReviewStatus = "pending" | "approved" | "hidden";

export type ProductReviewRecord = {
  id: string;
  productId: string;
  productName: string;
  /** product | service — for admin filters */
  listingType: "product" | "service";
  rating: number;
  title: string;
  body: string;
  authorName: string;
  authorUid?: string;
  authorEmail?: string;
  location?: string;
  verified: boolean;
  status: ReviewStatus;
  createdAt: string;
  moderatedAt?: string;
  moderatorNote?: string;
};

export type ReviewSubmitInput = {
  productId: string;
  productName: string;
  listingType?: "product" | "service";
  rating: number;
  title: string;
  body: string;
  authorName: string;
  authorUid?: string;
  authorEmail?: string;
  location?: string;
  verified?: boolean;
};
