"use client";

import { Check, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

type ToastMessage = {
  id: number;
  title: string;
  description?: string;
  accent?: "default" | "cart";
};

type ToastContextValue = {
  showSuccess: (
    title: string,
    description?: string,
    opts?: { accent?: "default" | "cart" }
  ) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function AppToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showSuccess = useCallback(
    (
      title: string,
      description?: string,
      opts?: { accent?: "default" | "cart" }
    ) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((prev) => [
        ...prev.slice(-2),
        { id, title, description, accent: opts?.accent ?? "default" },
      ]);
      window.setTimeout(() => dismiss(id), 3600);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ showSuccess }), [showSuccess]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-3 sm:bottom-6 sm:items-end sm:px-6"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3.5 text-sm shadow-lg backdrop-blur-md",
              "animate-[fb-fade-up_0.35s_ease-out]",
              toast.accent === "cart"
                ? "border-emerald-700/40 bg-emerald-900 text-cream shadow-emerald-900/25"
                : "border-emerald-200 bg-cream/95 text-emerald-950 shadow-emerald-900/10"
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                toast.accent === "cart"
                  ? "bg-cream/15 text-cream"
                  : "bg-emerald-100 text-emerald-800"
              )}
            >
              <Check className="size-4" strokeWidth={2.5} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium leading-snug">{toast.title}</p>
              {toast.description && (
                <p
                  className={cn(
                    "mt-0.5 text-xs leading-relaxed",
                    toast.accent === "cart"
                      ? "text-cream/75"
                      : "text-emerald-900/70"
                  )}
                >
                  {toast.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className={cn(
                "rounded-md p-1 transition-colors",
                toast.accent === "cart"
                  ? "text-cream/60 hover:bg-cream/10 hover:text-cream"
                  : "text-emerald-800/60 hover:bg-emerald-100 hover:text-emerald-950"
              )}
              aria-label="Dismiss"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useAppToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useAppToast must be used within AppToastProvider");
  }
  return ctx;
}

/** @deprecated Prefer useAppToast — kept for settings imports */
export const useSettingsToast = useAppToast;
export const SettingsToastProvider = AppToastProvider;
