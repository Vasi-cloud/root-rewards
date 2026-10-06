import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

export type ServiceTimeRequest = {
  id: string;
  listingId: string;
  serviceTitle: string;
  name: string;
  email: string;
  preferredTime: string;
  shopUid: string;
  shopName: string;
  createdAt: string;
};

type ServiceRequestStore = {
  requests: ServiceTimeRequest[];
};

const globalKey = "__forest_buddies_service_request_store__";

function memoryStore(): ServiceRequestStore {
  const g = globalThis as typeof globalThis & {
    [globalKey]?: ServiceRequestStore;
  };
  if (!g[globalKey]) {
    g[globalKey] = { requests: [] };
  }
  return g[globalKey]!;
}

function dataFilePath(): string {
  return path.join(process.cwd(), ".data", "service-requests.json");
}

function loadDisk(): ServiceRequestStore | null {
  try {
    const file = dataFilePath();
    if (!existsSync(file)) return null;
    const raw = readFileSync(file, "utf8");
    const parsed = JSON.parse(raw) as Partial<ServiceRequestStore>;
    if (!parsed?.requests || !Array.isArray(parsed.requests)) return null;
    return { requests: parsed.requests };
  } catch {
    return null;
  }
}

function saveDisk(store: ServiceRequestStore) {
  try {
    const dir = path.join(process.cwd(), ".data");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(dataFilePath(), JSON.stringify(store, null, 2));
  } catch {
    // Memory store still holds the request on this instance.
  }
}

function getStore(): ServiceRequestStore {
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

/** Requests Seller Hub can read later — this shop’s service times only. */
export function listServiceTimeRequests(shopUid?: string): ServiceTimeRequest[] {
  const rows = getStore().requests;
  const filtered = shopUid
    ? rows.filter((row) => row.shopUid === shopUid)
    : rows;
  return [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveServiceTimeRequest(
  request: ServiceTimeRequest
): ServiceTimeRequest {
  const store = getStore();
  store.requests = [request, ...store.requests].slice(0, 200);
  saveDisk(store);
  return request;
}
