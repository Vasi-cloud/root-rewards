"use client";

import {
  collection,
  doc,
  Firestore,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
} from "firebase/firestore";

import type { User } from "firebase/auth";

import { getFirebaseApp } from "./config";
import type { UserProfile } from "@/types";
import { clampString } from "@/lib/validation";

function generateAffiliateCode(uid: string): string {
  return uid.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function getFirebaseFirestore(): Firestore | null {
  const app = getFirebaseApp();
  if (!app) return null;
  return getFirestore(app);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const db = getFirebaseFirestore();
  if (!db) return null;

  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() } as UserProfile;
}

/**
 * Writes a user profile without allowing client role escalation.
 * Create → role forced to "customer". Update → role omitted (immutable in rules).
 */
export async function upsertUserProfile(profile: UserProfile) {
  const db = getFirebaseFirestore();
  if (!db) throw new Error("Firestore is not configured");

  const now = new Date().toISOString();
  const existing = await getUserProfile(profile.uid);
  const email =
    profile.email != null ? clampString(profile.email, 320) : null;
  const displayName =
    profile.displayName != null
      ? clampString(profile.displayName, 120)
      : null;
  const photoURL =
    profile.photoURL != null ? clampString(profile.photoURL, 2048) : null;
  const affiliateCode = clampString(
    profile.affiliateCode ??
      existing?.affiliateCode ??
      generateAffiliateCode(profile.uid),
    32
  );

  if (!existing) {
    await setDoc(doc(db, "users", profile.uid), {
      email,
      displayName,
      photoURL,
      role: "customer",
      affiliateCode,
      accountStatus: profile.accountStatus ?? "active",
      createdAt: profile.createdAt ?? now,
      updatedAt: now,
    });
    return;
  }

  await setDoc(
    doc(db, "users", profile.uid),
    {
      email,
      displayName,
      photoURL,
      affiliateCode: existing.affiliateCode ?? affiliateCode,
      updatedAt: now,
    },
    { merge: true }
  );
}

/**
 * Soft-delete: mark inactive, keep profile data for legal / compliance.
 * Does not delete the Firestore document (rules forbid client delete).
 */
export async function deactivateUserProfile(uid: string): Promise<UserProfile | null> {
  const db = getFirebaseFirestore();
  if (!db) return null;

  const existing = await getUserProfile(uid);
  const now = new Date().toISOString();

  await setDoc(
    doc(db, "users", uid),
    {
      accountStatus: "deactivated",
      deactivatedAt: now,
      updatedAt: now,
    },
    { merge: true }
  );

  return {
    ...(existing ?? {
      uid,
      email: null,
      displayName: null,
      photoURL: null,
      role: "customer" as const,
    }),
    uid,
    accountStatus: "deactivated",
    deactivatedAt: now,
  };
}

/** Creates a Firestore profile on first sign-in (email or Google). */
export async function ensureUserProfile(user: User): Promise<UserProfile | null> {
  const db = getFirebaseFirestore();
  if (!db) return null;

  const existing = await getUserProfile(user.uid);
  if (existing) return existing;

  const profile: UserProfile = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    role: "customer",
    affiliateCode: generateAffiliateCode(user.uid),
    createdAt: new Date().toISOString(),
  };

  await upsertUserProfile(profile);

  // Welcome email for first-time profiles (email + Google). Fire-and-forget.
  if (profile.email) {
    const key = `fb-welcome-sent:${profile.uid}`;
    try {
      if (typeof window !== "undefined" && !sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        void fetch("/api/email/welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: profile.email,
            name: profile.displayName,
            userId: profile.uid,
          }),
        });
      }
    } catch {
      // ignore
    }
  }

  return profile;
}

export async function listProducts() {
  const db = getFirebaseFirestore();
  if (!db) return [];

  const snapshot = await getDocs(collection(db, "products"));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}
