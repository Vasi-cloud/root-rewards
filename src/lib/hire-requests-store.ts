import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

import type { HireRequest } from "@/lib/hire-requests";
import { isLeaValleyHireListing } from "@/lib/lea-valley-guest";

type HireRequestStore = {
  requests: HireRequest[];
};

const globalKey = "__forest_buddies_hire_request_store__";

function memoryStore(): HireRequestStore {
  const g = globalThis as typeof globalThis & {
    [globalKey]?: HireRequestStore;
  };
  if (!g[globalKey]) {
    g[globalKey] = { requests: [] };
  }
  return g[globalKey]!;
}

function dataFilePath(): string {
  return path.join(process.cwd(), ".data", "hire-requests.json");
}

function loadDisk(): HireRequestStore | null {
  try {
    const file = dataFilePath();
    if (!existsSync(file)) return null;
    const raw = readFileSync(file, "utf8");
    const parsed = JSON.parse(raw) as HireRequestStore;
    if (!parsed?.requests || !Array.isArray(parsed.requests)) return null;
    return { requests: parsed.requests };
  } catch {
    return null;
  }
}

function saveDisk(store: HireRequestStore) {
  try {
    const dir = path.join(process.cwd(), ".data");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(dataFilePath(), JSON.stringify(store, null, 2));
  } catch {
    // Serverless filesystems may be read-only — memory store still works per instance.
  }
}

function getStore(): HireRequestStore {
  const mem = memoryStore();
  const disk = loadDisk();
  if (disk?.requests.length) {
    const byId = new Map(mem.requests.map((row) => [row.id, row]));
    for (const row of disk.requests) {
      if (!byId.has(row.id)) byId.set(row.id, row);
    }
    mem.requests = [...byId.values()];
  }
  return mem;
}

export function listHireRequests(): HireRequest[] {
  return [...getStore().requests].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export function saveHireRequest(request: HireRequest): HireRequest {
  const store = getStore();
  if (store.requests.some((row) => row.id === request.id)) return request;
  store.requests = [request, ...store.requests].slice(0, 200);
  saveDisk(store);
  return request;
}

export function isValidLeaValleyHireRequest(
  row: HireRequest
): row is HireRequest {
  return (
    Boolean(row.id && row.name && row.email && row.dates && row.listingTitle) &&
    isLeaValleyHireListing({
      id: row.listingId,
      name: row.listingTitle,
    })
  );
}
