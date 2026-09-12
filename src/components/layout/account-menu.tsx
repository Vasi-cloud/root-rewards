"use client";

import { BadgeCheck, LogOut, Settings, Trees } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

const TAP = "min-h-11 min-w-11";

/** Account dropdown — Membership, My Forest, Account settings, Sign out. */
export function AccountMenu({ className }: { className?: string }) {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!user) return null;

  const label =
    profile?.displayName?.trim() ||
    user.email?.split("@")[0] ||
    "Account";
  const initials = label.slice(0, 1).toUpperCase();

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    router.push("/");
  }

  return (
    <div className={cn("relative shrink-0", className)} ref={rootRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Account menu"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full border border-border bg-white/90 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          TAP
        )}
      >
        <Avatar size="sm" className="size-8">
          {profile?.photoURL ? (
            <AvatarImage src={profile.photoURL} alt="" />
          ) : null}
          <AvatarFallback className="bg-emerald-800 text-[11px] font-semibold text-cream">
            {initials}
          </AvatarFallback>
        </Avatar>
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border/80 bg-cream py-1 shadow-lg"
        >
          <div className="border-b border-border/60 px-3 py-2">
            <p className="truncate text-sm font-medium text-foreground">
              {label}
            </p>
            {user.email ? (
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            ) : null}
          </div>
          <Link
            href="/membership"
            role="menuitem"
            className="flex min-h-11 items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-emerald-50"
            onClick={() => setOpen(false)}
          >
            <BadgeCheck className="size-3.5 text-emerald-800" />
            Membership
          </Link>
          <Link
            href="/dashboard/my-forest"
            role="menuitem"
            className="flex min-h-11 items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-emerald-50"
            onClick={() => setOpen(false)}
          >
            <Trees className="size-3.5 text-emerald-800" />
            My Forest
          </Link>
          <Link
            href="/dashboard/settings"
            role="menuitem"
            className="flex min-h-11 items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-emerald-50"
            onClick={() => setOpen(false)}
          >
            <Settings className="size-3.5 text-emerald-800" />
            Account settings
          </Link>
          <button
            type="button"
            role="menuitem"
            className="flex min-h-11 w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground hover:bg-emerald-50"
            onClick={() => void handleSignOut()}
          >
            <LogOut className="size-3.5 text-emerald-800" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
