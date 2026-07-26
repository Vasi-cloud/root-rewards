"use client";

import {
  ArrowLeft,
  BookMarked,
  ChefHat,
  Leaf,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { MarketplaceBrandBadge } from "@/components/brand/brand-mark";
import { useAppToast } from "@/components/ui/app-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  clearSavedKitchenLists,
  formatKitchenSavedDate,
  loadSavedKitchenLists,
  removeSavedKitchenList,
  subscribeSavedKitchenLists,
  type SavedKitchenList,
} from "@/lib/leafy-kitchen-saved";

export default function KitchenSavedListsPage() {
  const router = useRouter();
  const { showSuccess } = useAppToast();
  const [items, setItems] = useState<SavedKitchenList[]>([]);

  useEffect(() => {
    const refresh = () => setItems(loadSavedKitchenLists());
    refresh();
    return subscribeSavedKitchenLists(refresh);
  }, []);

  function handleOpen(item: SavedKitchenList) {
    try {
      sessionStorage.setItem(
        "fb-kitchen-open-saved",
        JSON.stringify({ id: item.id })
      );
    } catch {
      // ignore
    }
    router.push(`/kitchen?saved=${encodeURIComponent(item.id)}`);
  }

  function handleRemove(id: string, title: string) {
    removeSavedKitchenList(id);
    showSuccess("Removed", `“${title}” is no longer in My Kitchen.`);
  }

  function handleClearAll() {
    if (items.length === 0) return;
    clearSavedKitchenLists();
    showSuccess("My Kitchen cleared", "All saved lists were removed.");
  }

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(149,213,178,0.4),transparent)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-3xl px-4 py-7 pb-16 sm:px-6 sm:py-12">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
            <MarketplaceBrandBadge />
            <Badge className="gap-1 bg-emerald-800/10 font-normal text-emerald-900">
              <BookMarked className="size-3.5" />
              My Kitchen
            </Badge>
            <Badge variant="outline" className="font-normal text-muted-foreground">
              This device
            </Badge>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
              My Kitchen
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
              Saved shopping lists and recipes from Leafy Kitchen — reopen
              anytime on this device.
            </p>
          </div>
          <Button
            nativeButton={false}
            render={<Link href="/kitchen" />}
            variant="outline"
            className="h-11 w-full shrink-0 gap-2 bg-white/95 shadow-xs transition-all active:scale-[0.98] sm:w-auto"
          >
            <ArrowLeft className="size-4" />
            Back to Kitchen
          </Button>
        </div>

        <div className="mt-4 flex gap-3 rounded-2xl border border-emerald-200/80 bg-white/95 p-3.5 shadow-sm sm:mt-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-cream shadow-sm">
            <Leaf className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/70">
              Leafy says
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-foreground">
              Lists stay in this browser for now. Still check allergens and
              store labels when you shop.
            </p>
          </div>
        </div>

        <div className="mt-7 flex items-center justify-between gap-3 sm:mt-8">
          <p className="text-sm text-muted-foreground">
            {items.length === 0
              ? "No saved lists yet"
              : `${items.length} saved list${items.length === 1 ? "" : "s"}`}
          </p>
          {items.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              className="h-9 gap-1.5 text-muted-foreground hover:text-destructive"
              onClick={handleClearAll}
            >
              <Trash2 className="size-3.5" />
              Clear all
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="mt-4 rounded-3xl border border-dashed border-emerald-300/80 bg-emerald-50/40 px-4 py-12 text-center shadow-xs">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-white text-emerald-800 shadow-sm ring-1 ring-emerald-200/80">
              <ChefHat className="size-6" />
            </span>
            <p className="font-heading mt-4 text-lg font-semibold text-emerald-950">
              Nothing saved yet
            </p>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
              Build a shopping list in Leafy Kitchen, then tap{" "}
              <span className="font-medium text-foreground">Save list</span>.
            </p>
            <Button
              nativeButton={false}
              render={<Link href="/kitchen" />}
              className="mt-5 h-11 gap-2 bg-emerald-800 text-cream hover:bg-emerald-900"
            >
              Open Leafy Kitchen
            </Button>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="overflow-hidden rounded-2xl border border-border/70 bg-white/95 shadow-sm"
              >
                <div className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                  <div className="min-w-0">
                    <p className="font-heading text-base font-semibold leading-snug text-foreground sm:text-lg">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {item.ingredients.length} ingredient
                      {item.ingredients.length === 1 ? "" : "s"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Saved {formatKitchenSavedDate(item.savedAt)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
                    <Button
                      type="button"
                      className="h-10 gap-2 bg-emerald-800 text-cream hover:bg-emerald-900"
                      onClick={() => handleOpen(item)}
                    >
                      Open list
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-10 gap-2 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(item.id, item.title)}
                    >
                      <Trash2 className="size-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
