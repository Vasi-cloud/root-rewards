/**
 * My Kitchen — saved shopping lists / recipes (localStorage).
 */

import {
  extractRecipeMethod,
  extractTitle,
  type ShoppingIngredient,
} from "@/lib/leafy-kitchen";

export const LEAFY_KITCHEN_SAVED_KEY = "fb-leafy-kitchen-saved";
const MAX_SAVED = 24;
const EVENT = "fb-leafy-kitchen-saved-updated";

/** What the user intentionally stored. */
export type KitchenSaveKind = "list" | "recipe" | "both";

export type KitchenSaveMode = "list" | "both";

export type SavedKitchenList = {
  id: string;
  title: string;
  recipeText: string;
  /** Method / instructions extracted at save time (if any) */
  method: string | null;
  servings: number;
  /** list = shopping list; recipe = recipe only; both = recipe + list */
  saveKind: KitchenSaveKind;
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

function migrateSavedItem(raw: unknown): SavedKitchenList | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<SavedKitchenList> & {
    recipeText?: string;
    ingredients?: ShoppingIngredient[];
  };
  if (
    typeof item.id !== "string" ||
    typeof item.title !== "string" ||
    typeof item.recipeText !== "string" ||
    !Array.isArray(item.ingredients) ||
    typeof item.savedAt !== "string"
  ) {
    return null;
  }

  const method =
    typeof item.method === "string"
      ? item.method
      : extractRecipeMethod(item.recipeText);
  const servings =
    typeof item.servings === "number" && item.servings > 0
      ? item.servings
      : 2;
  const hasList = item.ingredients.length > 0;
  const hasRecipe = Boolean(
    (method && method.trim()) ||
      (item.recipeText.trim().length > 40 &&
        /method|directions|instructions|steps/i.test(item.recipeText))
  );

  const saveKind: KitchenSaveKind =
    item.saveKind === "list" ||
    item.saveKind === "recipe" ||
    item.saveKind === "both"
      ? item.saveKind
      : hasList && hasRecipe
        ? "both"
        : hasRecipe
          ? "recipe"
          : "list";

  return {
    id: item.id,
    title: item.title,
    recipeText: item.recipeText,
    method: method?.trim() ? method : null,
    servings,
    saveKind,
    ingredients: item.ingredients,
    sampleId: typeof item.sampleId === "string" ? item.sampleId : null,
    savedAt: item.savedAt,
  };
}

export function loadSavedKitchenLists(): SavedKitchenList[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LEAFY_KITCHEN_SAVED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(migrateSavedItem)
      .filter((item): item is SavedKitchenList => Boolean(item))
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

/** Resolved kind for UI badges (handles legacy rows). */
export function getSavedItemKind(item: SavedKitchenList): KitchenSaveKind {
  if (item.saveKind === "list" || item.saveKind === "recipe" || item.saveKind === "both") {
    return item.saveKind;
  }
  const hasList = item.ingredients.length > 0;
  const hasRecipe = Boolean(item.method?.trim() || item.recipeText.trim());
  if (hasList && hasRecipe) return "both";
  if (hasRecipe && !hasList) return "recipe";
  return "list";
}

export function savedKindLabel(kind: KitchenSaveKind): string {
  if (kind === "both") return "Recipe & list";
  if (kind === "recipe") return "Recipe";
  return "Shopping list";
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

function mergeSaveKind(
  previous: KitchenSaveKind | undefined,
  mode: KitchenSaveMode
): KitchenSaveKind {
  if (mode === "both") return "both";
  // Saving list again after a full recipe save keeps “both”
  if (previous === "both" || previous === "recipe") return "both";
  return "list";
}

/**
 * Save a shopping list and/or full recipe to My Kitchen.
 * mode “list” = shopping list (keeps recipe text for context)
 * mode “both” = recipe + shopping list (stores method when present)
 */
export function saveKitchenList(input: {
  title?: string;
  recipeText: string;
  ingredients: ShoppingIngredient[];
  servings: number;
  sampleId?: string | null;
  mode?: KitchenSaveMode;
}): SavedKitchenList {
  const mode: KitchenSaveMode = input.mode ?? "list";
  const title =
    input.title?.trim() ||
    extractTitle(input.recipeText) ||
    (mode === "both" ? "Saved recipe" : "Saved shopping list");
  const method = extractRecipeMethod(input.recipeText);
  const ingredients = input.ingredients.map((ing) => ({
    ...ing,
    checked: false,
    haveIt: Boolean(ing.haveIt),
    baseQuantity: ing.baseQuantity ?? ing.quantity,
  }));
  const servings = Math.max(1, Math.round(input.servings) || 2);

  const existing = findMatchingSavedList(
    title,
    ingredients.map((i) => i.name)
  );

  if (existing) {
    const updated: SavedKitchenList = {
      ...existing,
      title,
      recipeText: input.recipeText,
      method: method ?? existing.method,
      servings,
      saveKind: mergeSaveKind(existing.saveKind, mode),
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
    method,
    servings,
    saveKind: mode === "both" ? "both" : "list",
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
