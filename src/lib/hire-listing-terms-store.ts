import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

type TermsStore = { terms: Record<string, string> };

const globalKey = "__forest_buddies_hire_listing_terms__";

function memoryStore(): TermsStore {
  const g = globalThis as typeof globalThis & {
    [globalKey]?: TermsStore;
  };
  if (!g[globalKey]) {
    g[globalKey] = { terms: {} };
  }
  return g[globalKey]!;
}

function dataFilePath(): string {
  return path.join(process.cwd(), ".data", "hire-listing-terms.json");
}

function loadDisk(): TermsStore | null {
  try {
    const file = dataFilePath();
    if (!existsSync(file)) return null;
    const parsed = JSON.parse(readFileSync(file, "utf8")) as {
      terms?: Record<string, string>;
    };
    if (!parsed?.terms || typeof parsed.terms !== "object") return null;
    const terms: Record<string, string> = {};
    for (const [id, text] of Object.entries(parsed.terms)) {
      if (typeof text === "string" && text.trim()) terms[id] = text.trim();
    }
    return { terms };
  } catch {
    return null;
  }
}

function saveDisk(store: TermsStore) {
  try {
    const dir = path.join(process.cwd(), ".data");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(dataFilePath(), JSON.stringify(store, null, 2));
  } catch {
    // Memory still holds the terms on this instance.
  }
}

function getStore(): TermsStore {
  const mem = memoryStore();
  const disk = loadDisk();
  if (disk) {
    mem.terms = { ...disk.terms, ...mem.terms };
  }
  return mem;
}

export function getHireListingTerms(listingId: string): string {
  const id = listingId.trim();
  if (!id) return "";
  return getStore().terms[id]?.trim() ?? "";
}

export function saveHireListingTerms(listingId: string, terms: string): void {
  const id = listingId.trim();
  if (!id) return;
  const store = getStore();
  const text = terms.trim();
  if (text) store.terms[id] = text;
  else delete store.terms[id];
  saveDisk(store);
}
