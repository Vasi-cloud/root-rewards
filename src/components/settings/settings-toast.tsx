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
};

type ToastContextValue = {
  showSuccess: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function SettingsToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showSuccess = useCallback(
    (title: string, description?: string) => {
      const id = Date.now();
      setToasts((prev) => [...prev.slice(-2), { id, title, description }]);
      window.setTimeout(() => dismiss(id), 3200);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ showSuccess }), [showSuccess]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-emerald-200 bg-cream/95 px-4 py-3 text-sm text-emerald-950 shadow-lg shadow-emerald-900/10 backdrop-blur-md",
              "animate-[fb-fade-up_0.35s_ease-out]"
            )}
          >
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
              <Check className="size-3.5" strokeWidth={2.5} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-xs text-emerald-900/70">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="rounded-md p-1 text-emerald-800/60 transition-colors hover:bg-emerald-100 hover:text-emerald-950"
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

export function useSettingsToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useSettingsToast must be used within SettingsToastProvider");
  }
  return ctx;
}
