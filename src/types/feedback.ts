export type FeedbackCategory = "idea" | "feature" | "issue" | "other";

export type FeedbackStatus = "new" | "reviewed" | "archived";

export interface FeedbackItem {
  id: string;
  category: FeedbackCategory;
  message: string;
  /** Optional contact for follow-up */
  email?: string;
  name?: string;
  pagePath?: string;
  status: FeedbackStatus;
  createdAt: string;
  reviewedAt?: string;
}

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  idea: "Idea",
  feature: "Feature request",
  issue: "Something broken",
  other: "Just saying hi",
};

export const FEEDBACK_CATEGORY_HINTS: Record<FeedbackCategory, string> = {
  idea: "A spark that could grow the forest",
  feature: "Something you’d love to see next",
  issue: "A bug, typo, or rough edge",
  other: "Praise, questions, or wild thoughts",
};
