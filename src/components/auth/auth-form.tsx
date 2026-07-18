"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { consumeDeactivatedNotice } from "@/lib/account-storage";
import { getAuthErrorMessage } from "@/lib/firebase/errors";
import { consumeRateLimit } from "@/lib/rate-limit";
import { validateEmail, validatePassword } from "@/lib/validation";

type AuthMode = "login" | "register";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.27z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const { signIn, register, signInGoogle, firebaseReady } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode === "login" && consumeDeactivatedNotice()) {
      setInfo(
        "Your account is deactivated. Sign-in is blocked while it stays inactive. Contact support if you need help restoring access — we keep records for legal reasons."
      );
    }
  }, [mode]);

  async function finishAuthRedirect() {
    // Auth listener may soft-block deactivated accounts and set a notice
    await new Promise((r) => setTimeout(r, 350));
    if (consumeDeactivatedNotice()) {
      setInfo(
        "Your account is deactivated. Sign-in is blocked while it stays inactive. Contact support if you need help restoring access — we keep records for legal reasons."
      );
      return;
    }
    router.push("/dashboard");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    const emailResult = validateEmail(email);
    if (!emailResult.ok) {
      setError(emailResult.error);
      return;
    }
    const passwordResult = validatePassword(password);
    if (!passwordResult.ok) {
      setError(passwordResult.error);
      return;
    }

    const rate = consumeRateLimit("auth");
    if (!rate.allowed) {
      setError(rate.message);
      return;
    }

    setSubmitting(true);

    try {
      if (!firebaseReady) {
        throw new Error(
          "Firebase is not configured. Copy .env.local.example to .env.local and add your keys."
        );
      }
      if (mode === "login") {
        await signIn(emailResult.value, passwordResult.value);
      } else {
        await register(emailResult.value, passwordResult.value);
      }
      await finishAuthRedirect();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setInfo(null);
    const rate = consumeRateLimit("auth");
    if (!rate.allowed) {
      setError(rate.message);
      return;
    }
    setSubmitting(true);

    try {
      if (!firebaseReady) {
        throw new Error(
          "Firebase is not configured. Copy .env.local.example to .env.local and add your keys."
        );
      }
      await signInGoogle();
      await finishAuthRedirect();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <Card className="w-full max-w-md border-border/80 shadow-lg">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">
          {isLogin ? "Welcome back" : "Create your account"}
        </CardTitle>
        <CardDescription>
          {isLogin
            ? "Sign in to shop, track orders, and manage affiliate links."
            : "Join Forest Buddies to shop sustainably or start earning as an affiliate."}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {!firebaseReady && (
            <p className="rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-sm text-primary">
              Demo mode: configure Firebase in <code className="text-xs">.env.local</code> to enable auth.
            </p>
          )}
          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          {info && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              {info}
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={submitting}
            onClick={handleGoogleSignIn}
          >
            <GoogleIcon className="mr-2 size-4" />
            Continue with Google
          </Button>
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or with email</span>
            <Separator className="flex-1" />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
              maxLength={320}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              maxLength={128}
              autoComplete={isLogin ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Sign-in attempts are rate-limited in this browser (demo). By
            continuing you agree to our{" "}
            <Link href="/terms" className="text-primary underline-offset-2 hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary underline-offset-2 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? (
              <>
                New here?{" "}
                <Link href="/register" className="font-medium text-primary hover:underline">
                  Create an account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
