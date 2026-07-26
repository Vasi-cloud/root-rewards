/**
 * Automatic recent-recipe history for Leafy Kitchen (localStorage).
 * Separate from manually saved My Kitchen items.
 */

import { extractTitle, type ShoppingIngredient } from "@/lib/leafy-kitchen";

export const LEAFY_KITCHEN_HISTORY_KEY = "fb-leafy-kitchen-history";
/** How many recent recipes Leafy keeps automatically. */
export const MAX_KITCHEN_HISTORY = 8;
const MAX_HISTORY = MAX_KITCHEN_HISTORY;
const EVENT = "fb-leafy-kitchen-history-updated";

export type KitchenHistoryItem = {
  id: string;
  title: string;
  recipeText: string;
  ingredients: ShoppingIngredient[];
  servings: number;
  sampleId: string | null;
  usedAt: string;
};

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT));
  }
}

export function subscribeKitchenHistory(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function isHistoryItem(raw: unknown): raw is KitchenHistoryItem {
  if (!raw || typeof raw !== "object") return false;
  const item = raw as Partial<KitchenHistoryItem>;
  return Boolean(
    typeof item.id === "string" &&
      typeof item.title === "string" &&
      typeof item.recipeText === "string" &&
      Array.isArray(item.ingredients) &&
      typeof item.usedAt === "string" &&
      typeof item.servings === "number"
  );
}

export function loadKitchenHistory(): KitchenHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LEAFY_KITCHEN_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isHistoryItem)
      .sort((a, b) => b.usedAt.localeCompare(a.usedAt))
      .slice(0, MAX_HISTORY);
  } catch {
    return [];
  }
}

function persist(items: KitchenHistoryItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      LEAFY_KITCHEN_HISTORY_KEY,
      JSON.stringify(items.slice(0, MAX_HISTORY))
    );
    emit();
  } catch {
    // ignore quota
  }
}

function historyKey(title: string, ingredientNames: string[]): string {
  return `${title.trim().toLowerCase()}|${ingredientNames
    .map((n) => n.toLowerCase())
    .sort()
    .join(",")}`;
}

/**
 * Record a recently used recipe after a successful shopping-list build.
 * Dedupes by title + ingredients and keeps the newest 8.
 */
export function recordKitchenHistory(input: {
  title?: string;
  recipeText: string;
  ingredients: ShoppingIngredient[];
  servings: number;
  sampleId?: string | null;
}): KitchenHistoryItem | null {
  if (input.ingredients.length === 0) return null;

  const title =
    input.title?.trim() || extractTitle(input.recipeText) || "Recent recipe";
  const ingredients = input.ingredients.map((ing) => ({
    ...ing,
    checked: false,
    haveIt: Boolean(ing.haveIt),
    baseQuantity: ing.baseQuantity ?? ing.quantity,
  }));
  const servings = Math.max(1, Math.round(input.servings) || 2);
  const key = historyKey(
    title,
    ingredients.map((i) => i.name)
  );

  const prev = loadKitchenHistory();
  const existing = prev.find(
    (item) =>
      historyKey(
        item.title,
        item.ingredients.map((i) => i.name)
      ) === key
  );

  const item: KitchenHistoryItem = {
    id: existing?.id ?? `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    recipeText: input.recipeText,
    ingredients,
    servings,
    sampleId: input.sampleId ?? existing?.sampleId ?? null,
    usedAt: new Date().toISOString(),
  };

  persist([item, ...prev.filter((i) => i.id !== item.id)]);
  return item;
}

export function removeKitchenHistoryItem(id: string) {
  persist(loadKitchenHistory().filter((item) => item.id !== id));
}

export function clearKitchenHistory() {
  persist([]);
}

export function getKitchenHistoryItem(id: string): KitchenHistoryItem | null {
  return loadKitchenHistory().find((item) => item.id === id) ?? null;
}

export function formatKitchenHistoryDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}
