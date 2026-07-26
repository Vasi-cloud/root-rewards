/**
 * Buy Local favourites — stores & makers (localStorage).
 */

export type LocalFavouriteKind = "store" | "maker";

export type LocalFavourite = {
  id: string;
  kind: LocalFavouriteKind;
  name: string;
  savedAt: string;
};

export const LOCAL_FAVOURITES_KEY = "fb-local-favourites";
const EVENT = "fb-local-favourites-updated";
const MAX_FAVOURITES = 40;

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT));
  }
}

export function subscribeLocalFavourites(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function readRaw(): LocalFavourite[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_FAVOURITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const f = item as Partial<LocalFavourite>;
        if (
          typeof f.id !== "string" ||
          (f.kind !== "store" && f.kind !== "maker") ||
          typeof f.name !== "string" ||
          typeof f.savedAt !== "string"
        ) {
          return null;
        }
        return {
          id: f.id,
          kind: f.kind,
          name: f.name,
          savedAt: f.savedAt,
        } satisfies LocalFavourite;
      })
      .filter((f): f is LocalFavourite => f != null);
  } catch {
    return [];
  }
}

function writeAll(items: LocalFavourite[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    LOCAL_FAVOURITES_KEY,
    JSON.stringify(items.slice(0, MAX_FAVOURITES))
  );
  emit();
}

export function getLocalFavourites(): LocalFavourite[] {
  return readRaw();
}

export function isLocalFavourite(
  kind: LocalFavouriteKind,
  id: string
): boolean {
  return readRaw().some((f) => f.kind === kind && f.id === id);
}

export function toggleLocalFavourite(input: {
  kind: LocalFavouriteKind;
  id: string;
  name: string;
}): { saved: boolean; items: LocalFavourite[] } {
  const current = readRaw();
  const idx = current.findIndex(
    (f) => f.kind === input.kind && f.id === input.id
  );
  let next: LocalFavourite[];
  let saved: boolean;
  if (idx >= 0) {
    next = current.filter((_, i) => i !== idx);
    saved = false;
  } else {
    next = [
      {
        id: input.id,
        kind: input.kind,
        name: input.name,
        savedAt: new Date().toISOString(),
      },
      ...current,
    ];
    saved = true;
  }
  writeAll(next);
  return { saved, items: next };
}

export function favouriteKey(kind: LocalFavouriteKind, id: string): string {
  return `${kind}:${id}`;
}
