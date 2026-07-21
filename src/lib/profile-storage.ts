/**
 * Local profile overrides when Firestore isn't available or photo is device-only.
 * Cloud photo upload stays a placeholder — we keep a preview on this device.
 */

const PROFILE_OVERRIDES_KEY = "fb-profile-overrides";

export type ProfileOverrides = {
  displayName?: string;
  /** Device-only preview (data URL). Not synced to Firestore. */
  photoPreview?: string | null;
  notifications?: {
    orders: boolean;
    affiliates: boolean;
    cartReminders: boolean;
    impact: boolean;
  };
  preferredUnits?: "mi" | "km";
};

function readAll(): Record<string, ProfileOverrides> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PROFILE_OVERRIDES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, ProfileOverrides>;
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, ProfileOverrides>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_OVERRIDES_KEY, JSON.stringify(map));
}

export function getProfileOverrides(uid: string): ProfileOverrides {
  return readAll()[uid] ?? {};
}

export function setProfileOverrides(
  uid: string,
  patch: Partial<ProfileOverrides>
): ProfileOverrides {
  const all = readAll();
  const next: ProfileOverrides = {
    ...all[uid],
    ...patch,
    notifications: {
      orders: true,
      affiliates: true,
      cartReminders: false,
      impact: true,
      ...all[uid]?.notifications,
      ...patch.notifications,
    },
  };
  all[uid] = next;
  writeAll(all);
  return next;
}
