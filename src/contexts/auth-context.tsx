"use client";

import { User } from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  isAccountDeactivatedLocally,
  markAccountDeactivatedLocally,
  setDeactivatedNotice,
} from "@/lib/account-storage";
import {
  registerWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  subscribeToAuthState,
  updateAuthProfile,
} from "@/lib/firebase/auth";
import {
  deactivateUserProfile,
  ensureUserProfile,
  upsertUserProfile,
} from "@/lib/firebase/firestore";
import {
  getProfileOverrides,
  setProfileOverrides,
} from "@/lib/profile-storage";
import type { UserProfile } from "@/types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  firebaseReady: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  /**
   * Soft-delete account: mark inactive, retain data, sign out.
   * Intended for free-tier users (callers should gate).
   */
  deactivateAccount: () => Promise<void>;
  /** Update display name (and optional https photo URL). Merges local overrides. */
  updateProfileDetails: (input: {
    displayName: string;
    photoURL?: string | null;
  }) => Promise<UserProfile>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function isDeactivatedProfile(profile: UserProfile | null, uid: string): boolean {
  if (profile?.accountStatus === "deactivated") return true;
  return isAccountDeactivatedLocally(uid);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const firebaseReady = Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );

  if (typeof window !== "undefined") {
    console.log("[Firebase] firebaseReady in AuthProvider:", firebaseReady, {
      hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (nextUser) => {
      if (!nextUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const data = await ensureUserProfile(nextUser);
      const overrides = getProfileOverrides(nextUser.uid);
      const nextProfile =
        data ??
        ({
          uid: nextUser.uid,
          email: nextUser.email,
          displayName: nextUser.displayName,
          photoURL: nextUser.photoURL,
          role: "customer",
          accountStatus: "active",
        } satisfies UserProfile);

      const merged: UserProfile = {
        ...nextProfile,
        displayName:
          overrides.displayName?.trim() ||
          nextProfile.displayName ||
          nextUser.displayName,
        photoURL:
          overrides.photoPreview ||
          nextProfile.photoURL ||
          nextUser.photoURL,
      };

      if (isDeactivatedProfile(merged, nextUser.uid)) {
        setDeactivatedNotice();
        await signOutUser();
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(nextUser);
      setProfile(merged);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmail(email, password);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    await registerWithEmail(email, password);
  }, []);

  const signInGoogle = useCallback(async () => {
    await signInWithGoogle();
  }, []);

  const signOut = useCallback(async () => {
    await signOutUser();
  }, []);

  const deactivateAccount = useCallback(async () => {
    if (!user) {
      throw new Error("You must be signed in to deactivate your account.");
    }

    // Soft-delete in Firestore when available (retains document)
    try {
      await deactivateUserProfile(user.uid);
    } catch {
      // Demo / offline: local registry still records the soft-delete
    }

    markAccountDeactivatedLocally({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName ?? profile?.displayName,
    });

    setDeactivatedNotice();
    await signOutUser();
    setUser(null);
    setProfile(null);
  }, [user, profile?.displayName]);

  const updateProfileDetails = useCallback(
    async (input: { displayName: string; photoURL?: string | null }) => {
      if (!user) {
        throw new Error("You must be signed in to update your profile.");
      }

      const displayName = input.displayName.trim().slice(0, 120);
      if (!displayName) {
        throw new Error("Display name is required.");
      }

      // Only sync http(s) photo URLs to Auth/Firestore (data URLs are device-only)
      const remotePhoto =
        input.photoURL &&
        /^https?:\/\//i.test(input.photoURL) &&
        input.photoURL.length <= 2048
          ? input.photoURL
          : undefined;

      const devicePhoto =
        input.photoURL &&
        (input.photoURL.startsWith("data:") || input.photoURL.startsWith("blob:"))
          ? input.photoURL
          : input.photoURL === null
            ? null
            : undefined;

      setProfileOverrides(user.uid, {
        displayName,
        ...(devicePhoto !== undefined ? { photoPreview: devicePhoto } : {}),
      });

      try {
        await updateAuthProfile({
          displayName,
          ...(remotePhoto ? { photoURL: remotePhoto } : {}),
        });
      } catch {
        // Auth profile update optional in demo mode
      }

      const base: UserProfile = {
        uid: user.uid,
        email: user.email ?? profile?.email ?? null,
        displayName,
        photoURL:
          devicePhoto ??
          remotePhoto ??
          profile?.photoURL ??
          user.photoURL ??
          null,
        role: profile?.role ?? "customer",
        affiliateCode: profile?.affiliateCode,
        membershipTier: profile?.membershipTier,
        accountStatus: profile?.accountStatus ?? "active",
        createdAt: profile?.createdAt,
      };

      try {
        await upsertUserProfile({
          ...base,
          photoURL: remotePhoto ?? (profile?.photoURL && /^https?:\/\//i.test(profile.photoURL) ? profile.photoURL : null),
        });
      } catch {
        // Demo / offline: local overrides still apply
      }

      const overrides = getProfileOverrides(user.uid);
      const next: UserProfile = {
        ...base,
        displayName: overrides.displayName ?? displayName,
        photoURL: overrides.photoPreview ?? base.photoURL,
      };
      setProfile(next);
      return next;
    },
    [user, profile]
  );

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      firebaseReady,
      signIn,
      register,
      signInGoogle,
      signOut,
      deactivateAccount,
      updateProfileDetails,
    }),
    [
      user,
      profile,
      loading,
      firebaseReady,
      signIn,
      register,
      signInGoogle,
      signOut,
      deactivateAccount,
      updateProfileDetails,
    ]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
