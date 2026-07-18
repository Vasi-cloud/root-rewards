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
} from "@/lib/firebase/auth";
import {
  deactivateUserProfile,
  ensureUserProfile,
} from "@/lib/firebase/firestore";
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

      if (isDeactivatedProfile(nextProfile, nextUser.uid)) {
        setDeactivatedNotice();
        await signOutUser();
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(nextUser);
      setProfile(nextProfile);
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
