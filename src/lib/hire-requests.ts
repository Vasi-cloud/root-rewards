import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";

import { getFirebaseFirestore } from "@/lib/firebase/firestore";
import {
  isLeaValleyHireListing,
  LEA_VALLEY_SHOP_NAME,
  LEA_VALLEY_UID,
  leaValleyHireTitle,
} from "@/lib/lea-valley-guest";

export const HIRE_REQUEST_CONFIRMATION =
  "Request sent — the seller confirms. This is not a booking.";

export type HireRequestStatus = "new" | "Confirmed" | "Declined" | "Paid";

export type HireRequest = {
  id: string;
  listingId: string;
  listingTitle: string;
  name: string;
  email: string;
  dates: string;
  shopUid: string;
  shopName: string;
  createdAt: string;
  status: HireRequestStatus;
  seen?: boolean;
};

function parseHireRequestStatus(raw: unknown): HireRequestStatus {
  if (raw === "Confirmed" || raw === "Declined" || raw === "Paid") return raw;
  return "new";
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("Timed out")), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        window.clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function hireRequestsCollection() {
  const db = getFirebaseFirestore();
  if (!db) return null;
  return collection(db, "shops", LEA_VALLEY_UID, "hireRequests");
}

function parseHireRequest(
  id: string,
  raw: Record<string, unknown>
): HireRequest | null {
  const listingId = typeof raw.listingId === "string" ? raw.listingId : "";
  const listingTitle =
    typeof raw.listingTitle === "string" ? raw.listingTitle : "";
  const name = typeof raw.name === "string" ? raw.name : "";
  const email = typeof raw.email === "string" ? raw.email : "";
  const dates = typeof raw.dates === "string" ? raw.dates : "";
  if (!name || !email || !dates || !listingTitle) return null;
  if (!isLeaValleyHireListing({ id: listingId, name: listingTitle })) {
    return null;
  }
  return {
    id,
    listingId,
    listingTitle,
    name,
    email,
    dates,
    shopUid: LEA_VALLEY_UID,
    shopName:
      typeof raw.shopName === "string" && raw.shopName
        ? raw.shopName
        : LEA_VALLEY_SHOP_NAME,
    createdAt:
      typeof raw.createdAt === "string" && raw.createdAt
        ? raw.createdAt
        : new Date().toISOString(),
    status: parseHireRequestStatus(raw.status),
    seen: raw.seen === true,
  };
}

/** Same Firestore list /seller reads — this shop only, not a catalogue walk. */
export async function listLeaValleyHireRequests(): Promise<HireRequest[]> {
  const col = hireRequestsCollection();
  if (!col) return [];
  const snap = await withTimeout(getDocs(col), 5000);
  const rows: HireRequest[] = [];
  for (const item of snap.docs) {
    const parsed = parseHireRequest(
      item.id,
      item.data() as Record<string, unknown>
    );
    if (parsed) rows.push(parsed);
  }
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function unseenHireRequestCount(rows: HireRequest[]): number {
  return rows.filter((row) => !row.seen).length;
}

export async function getLeaValleyHireRequest(
  id: string
): Promise<HireRequest | null> {
  const db = getFirebaseFirestore();
  if (!db || !id) return null;
  const snap = await withTimeout(
    getDoc(doc(db, "shops", LEA_VALLEY_UID, "hireRequests", id)),
    5000
  );
  if (!snap.exists()) return null;
  return parseHireRequest(snap.id, snap.data() as Record<string, unknown>);
}

export async function markLeaValleyHireRequestPaid(id: string): Promise<void> {
  const db = getFirebaseFirestore();
  if (!db || !id) throw new Error("Could not mark this request paid.");
  await withTimeout(
    updateDoc(doc(db, "shops", LEA_VALLEY_UID, "hireRequests", id), {
      status: "Paid",
    }),
    5000
  );
}

/** Persist Confirm or Decline — this shop only. */
export async function setLeaValleyHireRequestStatus(
  id: string,
  status: Extract<HireRequestStatus, "Confirmed" | "Declined">
): Promise<void> {
  const db = getFirebaseFirestore();
  if (!db) throw new Error("Could not update this request.");
  await withTimeout(
    updateDoc(doc(db, "shops", LEA_VALLEY_UID, "hireRequests", id), { status }),
    5000
  );
}

/** Mark opened hire-request rows seen — this shop only. */
export async function markLeaValleyHireRequestsSeen(
  ids: string[]
): Promise<void> {
  const db = getFirebaseFirestore();
  if (!db || ids.length === 0) return;
  await withTimeout(
    Promise.all(
      ids.map((id) =>
        updateDoc(doc(db, "shops", LEA_VALLEY_UID, "hireRequests", id), {
          seen: true,
        }).catch(() => undefined)
      )
    ),
    5000
  );
}

/** Write to Firestore keyed to Lea Valley Cycle Hire. */
export async function submitLeaValleyHireRequest(input: {
  listingId: string;
  listingTitle: string;
  name: string;
  email: string;
  dates: string;
}): Promise<HireRequest> {
  const listingTitle = leaValleyHireTitle(input.listingId, input.listingTitle);
  if (
    !isLeaValleyHireListing({
      id: input.listingId,
      name: listingTitle,
    })
  ) {
    throw new Error("This listing does not take hire requests here.");
  }

  const db = getFirebaseFirestore();
  const col = hireRequestsCollection();
  if (!db || !col) {
    throw new Error("Could not send this request.");
  }

  const payload: HireRequest = {
    id: `hr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    listingId: input.listingId.slice(0, 80),
    listingTitle: listingTitle.slice(0, 200),
    name: input.name.trim().slice(0, 120),
    email: input.email.trim().slice(0, 160),
    dates: input.dates.trim().slice(0, 200),
    shopUid: LEA_VALLEY_UID,
    shopName: LEA_VALLEY_SHOP_NAME,
    createdAt: new Date().toISOString(),
    status: "new",
  };

  const { id, ...fields } = payload;
  await withTimeout(
    setDoc(doc(db, "shops", LEA_VALLEY_UID, "hireRequests", id), fields),
    5000
  );
  return payload;
}
