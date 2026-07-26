/**
 * My Kitchen — saved shopping lists / recipes (localStorage).
 */

import type { ShoppingIngredient } from "@/lib/leafy-kitchen";

export const LEAFY_KITCHEN_SAVED_KEY = "fb-leafy-kitchen-saved";
const MAX_SAVED = 24;
const EVENT = "fb-leafy-kitchen-saved-updated";

export type SavedKitchenList = {
  id: string;
  title: string;
  recipeText: string;
  ingredients: ShoppingIngredient[];
  sampleId: string | null;
  savedAt: string;
};

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT));
  }
}

export function subscribeSavedKitchenLists(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function isSavedList(raw: unknown): raw is SavedKitchenList {
  if (!raw || typeof raw !== "object") return false;
  const item = raw as Partial<SavedKitchenList>;
  return Boolean(
    typeof item.id === "string" &&
      typeof item.title === "string" &&
      typeof item.recipeText === "string" &&
      Array.isArray(item.ingredients) &&
      typeof item.savedAt === "string"
  );
}

export function loadSavedKitchenLists(): SavedKitchenList[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LEAFY_KITCHEN_SAVED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isSavedList)
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
      .slice(0, MAX_SAVED);
  } catch {
    return [];
  }
}

function persist(items: SavedKitchenList[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      LEAFY_KITCHEN_SAVED_KEY,
      JSON.stringify(items.slice(0, MAX_SAVED))
    );
    emit();
  } catch {
    // ignore quota errors
  }
}

export function formatKitchenSavedDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function findMatchingSavedList(
  title: string,
  ingredientNames: string[]
): SavedKitchenList | null {
  const key = title.trim().toLowerCase();
  const names = new Set(ingredientNames.map((n) => n.toLowerCase()));
  return (
    loadSavedKitchenLists().find((item) => {
      if (item.title.trim().toLowerCase() !== key) return false;
      if (item.ingredients.length !== names.size) return false;
      return item.ingredients.every((ing) => names.has(ing.name.toLowerCase()));
    }) ?? null
  );
}

export function saveKitchenList(input: {
  title: string;
  recipeText: string;
  ingredients: ShoppingIngredient[];
  sampleId?: string | null;
}): SavedKitchenList {
  const title = input.title.trim() || "Saved shopping list";
  const ingredients = input.ingredients.map((ing) => ({
    ...ing,
    checked: false,
  }));
  const existing = findMatchingSavedList(
    title,
    ingredients.map((i) => i.name)
  );
  if (existing) {
    const updated: SavedKitchenList = {
      ...existing,
      recipeText: input.recipeText,
      ingredients,
      sampleId: input.sampleId ?? existing.sampleId,
      savedAt: new Date().toISOString(),
    };
    const rest = loadSavedKitchenLists().filter((i) => i.id !== existing.id);
    persist([updated, ...rest]);
    return updated;
  }

  const item: SavedKitchenList = {
    id: `kitchen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    recipeText: input.recipeText,
    ingredients,
    sampleId: input.sampleId ?? null,
    savedAt: new Date().toISOString(),
  };
  persist([item, ...loadSavedKitchenLists()]);
  return item;
}

export function removeSavedKitchenList(id: string) {
  persist(loadSavedKitchenLists().filter((item) => item.id !== id));
}

export function clearSavedKitchenLists() {
  persist([]);
}

export function getSavedKitchenList(id: string): SavedKitchenList | null {
  return loadSavedKitchenLists().find((item) => item.id === id) ?? null;
}
