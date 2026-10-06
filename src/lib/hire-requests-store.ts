import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

import type { HireRequest } from "@/lib/hire-requests";
import { isLeaValleyHireListing } from "@/lib/lea-valley-guest";

type HireRequestStore = {
  requests: HireRequest[];
  partnerPot?: number;
};

const globalKey = "__forest_buddies_hire_request_store__";

function memoryStore(): HireRequestStore {
  const g = globalThis as typeof globalThis & {
    [globalKey]?: HireRequestStore;
  };
  if (!g[globalKey]) {
    g[globalKey] = { requests: [], partnerPot: 0 };
  }
  if (typeof g[globalKey].partnerPot !== "number") {
    g[globalKey].partnerPot = 0;
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
    const parsed = JSON.parse(raw) as Partial<HireRequestStore>;
    if (!parsed?.requests || !Array.isArray(parsed.requests)) return null;
    return {
      requests: parsed.requests,
      partnerPot:
        typeof parsed.partnerPot === "number" ? parsed.partnerPot : 0,
    };
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
    if (
      typeof disk.partnerPot === "number" &&
      disk.partnerPot > (mem.partnerPot ?? 0)
    ) {
      mem.partnerPot = disk.partnerPot;
    }
  }
  return mem;
}

export function listHireRequests(): HireRequest[] {
  return [...getStore().requests].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  );
}

export function getHireRequest(id: string): HireRequest | null {
  if (!id) return null;
  return getStore().requests.find((row) => row.id === id) ?? null;
}

export function saveHireRequest(request: HireRequest): HireRequest {
  const store = getStore();
  const index = store.requests.findIndex((row) => row.id === request.id);
  if (index >= 0) {
    store.requests[index] = { ...store.requests[index], ...request };
  } else {
    store.requests = [request, ...store.requests].slice(0, 200);
  }
  saveDisk(store);
  return store.requests.find((row) => row.id === request.id) ?? request;
}

export function updateHireRequestStatus(
  id: string,
  status: HireRequest["status"],
  split?: {
    paidTotal?: number;
    sellerShare?: number;
    partnerPot?: number;
  }
): HireRequest | null {
  const store = getStore();
  const index = store.requests.findIndex((row) => row.id === id);
  if (index < 0) return null;
  const previous = store.requests[index];
  store.requests[index] = { ...previous, status, ...split };
  if (
    status === "Paid" &&
    previous.status !== "Paid" &&
    typeof split?.partnerPot === "number" &&
    split.partnerPot > 0
  ) {
    store.partnerPot = (store.partnerPot ?? 0) + split.partnerPot;
  }
  saveDisk(store);
  return store.requests[index];
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
