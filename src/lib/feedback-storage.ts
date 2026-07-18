import type {
  FeedbackCategory,
  FeedbackItem,
  FeedbackStatus,
} from "@/types/feedback";

export const FEEDBACK_STORAGE_KEY = "forest-buddies-feedback";
const EVENT = "forest-buddies-feedback-updated";

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT));
  }
}

export function subscribeFeedback(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function loadFeedback(): FeedbackItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FeedbackItem[];
    return Array.isArray(parsed)
      ? parsed.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      : [];
  } catch {
    return [];
  }
}

function saveFeedback(items: FeedbackItem[]) {
  try {
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(items));
    emit();
  } catch {
    // ignore
  }
}

export function submitFeedback(input: {
  category: FeedbackCategory;
  message: string;
  email?: string;
  name?: string;
  pagePath?: string;
}): FeedbackItem {
  const item: FeedbackItem = {
    id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    category: input.category,
    message: input.message.trim(),
    email: input.email?.trim() || undefined,
    name: input.name?.trim() || undefined,
    pagePath: input.pagePath,
    status: "new",
    createdAt: new Date().toISOString(),
  };
  const all = loadFeedback();
  saveFeedback([item, ...all].slice(0, 200));
  return item;
}

export function setFeedbackStatus(
  id: string,
  status: FeedbackStatus
): FeedbackItem | null {
  const all = loadFeedback();
  let updated: FeedbackItem | null = null;
  const next = all.map((item) => {
    if (item.id !== id) return item;
    updated = {
      ...item,
      status,
      reviewedAt:
        status === "new" ? undefined : new Date().toISOString(),
    };
    return updated;
  });
  if (updated) saveFeedback(next);
  return updated;
}

export function deleteFeedback(id: string) {
  saveFeedback(loadFeedback().filter((i) => i.id !== id));
}

export function feedbackStats(items: FeedbackItem[] = loadFeedback()) {
  return {
    total: items.length,
    newCount: items.filter((i) => i.status === "new").length,
    reviewed: items.filter((i) => i.status === "reviewed").length,
    archived: items.filter((i) => i.status === "archived").length,
  };
}
