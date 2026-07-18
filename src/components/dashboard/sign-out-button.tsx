"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

export function DashboardSignOut({
  variant = "button",
  className,
}: {
  variant?: "button" | "link";
  className?: string;
}) {
  const { signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  if (variant === "link") {
    return (
      <button
        type="button"
        onClick={handleSignOut}
        className={cn("text-left hover:text-primary hover:underline", className)}
      >
        Sign out
      </button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSignOut}
      className={cn("gap-1.5", className)}
    >
      <LogOut className="size-3.5 shrink-0" />
      Sign out
    </Button>
  );
}
