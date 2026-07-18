/**
 * Soft-delete / deactivate account helpers.
 * Profile data is retained (Firestore + local registry) for legal reasons.
 */

export const DEACTIVATED_ACCOUNTS_KEY = "forest-buddies-deactivated-accounts";
export const DEACTIVATED_NOTICE_KEY = "forest-buddies-deactivated-notice";

export interface DeactivatedAccountRecord {
  uid: string;
  email: string | null;
  deactivatedAt: string;
  /** Kept for audit / support */
  displayName?: string | null;
}

function loadRegistry(): DeactivatedAccountRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DEACTIVATED_ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DeactivatedAccountRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRegistry(records: DeactivatedAccountRecord[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DEACTIVATED_ACCOUNTS_KEY, JSON.stringify(records));
    window.dispatchEvent(new Event("forest-buddies-account-updated"));
  } catch {
    // ignore
  }
}

export function isAccountDeactivatedLocally(uid: string): boolean {
  return loadRegistry().some((r) => r.uid === uid);
}

export function getDeactivatedAccount(
  uid: string
): DeactivatedAccountRecord | null {
  return loadRegistry().find((r) => r.uid === uid) ?? null;
}

/** Soft-delete registry entry — never removes prior records (legal retention). */
export function markAccountDeactivatedLocally(input: {
  uid: string;
  email: string | null;
  displayName?: string | null;
}): DeactivatedAccountRecord {
  const records = loadRegistry();
  const deactivatedAt = new Date().toISOString();
  const next: DeactivatedAccountRecord = {
    uid: input.uid,
    email: input.email,
    displayName: input.displayName ?? null,
    deactivatedAt,
  };
  const idx = records.findIndex((r) => r.uid === input.uid);
  if (idx >= 0) {
    records[idx] = { ...records[idx], ...next };
  } else {
    records.push(next);
  }
  saveRegistry(records);
  return next;
}

export function setDeactivatedNotice() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(DEACTIVATED_NOTICE_KEY, "1");
  } catch {
    // ignore
  }
}

export function consumeDeactivatedNotice(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const v = sessionStorage.getItem(DEACTIVATED_NOTICE_KEY);
    if (v) {
      sessionStorage.removeItem(DEACTIVATED_NOTICE_KEY);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}
