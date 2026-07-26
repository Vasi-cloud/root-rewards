"use client";

import {
  ArrowLeft,
  BookMarked,
  ChefHat,
  ClipboardList,
  Clock,
  CookingPot,
  History,
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
  MAX_KITCHEN_HISTORY,
  clearKitchenHistory,
  formatKitchenHistoryDate,
  loadKitchenHistory,
  removeKitchenHistoryItem,
  subscribeKitchenHistory,
  type KitchenHistoryItem,
} from "@/lib/leafy-kitchen-history";
import {
  clearSavedKitchenLists,
  formatKitchenSavedDate,
  getSavedItemKind,
  loadSavedKitchenLists,
  removeSavedKitchenList,
  subscribeSavedKitchenLists,
  type KitchenSaveKind,
  type SavedKitchenList,
} from "@/lib/leafy-kitchen-saved";
import { cn } from "@/lib/utils";

function KindBadge({ kind }: { kind: KitchenSaveKind }) {
  if (kind === "both") {
    return (
      <Badge className="gap-1 bg-emerald-800 text-[10px] font-medium text-cream hover:bg-emerald-800">
        <CookingPot className="size-3" />
        Recipe &amp; list
      </Badge>
    );
  }
  if (kind === "recipe") {
    return (
      <Badge className="gap-1 border-0 bg-sky-800/90 text-[10px] font-medium text-white hover:bg-sky-800/90">
        <ChefHat className="size-3" />
        Recipe
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="gap-1 border-emerald-300/80 bg-emerald-50 text-[10px] font-medium text-emerald-950"
    >
      <ClipboardList className="size-3" />
      Shopping list
    </Badge>
  );
}

export default function KitchenSavedListsPage() {
  const router = useRouter();
  const { showSuccess } = useAppToast();
  const [items, setItems] = useState<SavedKitchenList[]>([]);
  const [history, setHistory] = useState<KitchenHistoryItem[]>([]);

  useEffect(() => {
    const refreshSaved = () => setItems(loadSavedKitchenLists());
    const refreshHistory = () => setHistory(loadKitchenHistory());
    refreshSaved();
    refreshHistory();
    const unsubSaved = subscribeSavedKitchenLists(refreshSaved);
    const unsubHistory = subscribeKitchenHistory(refreshHistory);
    return () => {
      unsubSaved();
      unsubHistory();
    };
  }, []);

  function handleOpenSaved(item: SavedKitchenList) {
    router.push(`/kitchen?saved=${encodeURIComponent(item.id)}`);
  }

  function handleOpenHistory(item: KitchenHistoryItem) {
    router.push(`/kitchen?history=${encodeURIComponent(item.id)}`);
  }

  function handleRemoveSaved(id: string, title: string) {
    removeSavedKitchenList(id);
    showSuccess("Removed", `“${title}” is no longer in Saved.`);
  }

  function handleRemoveHistory(id: string, title: string) {
    removeKitchenHistoryItem(id);
    showSuccess("Removed from Recent", `“${title}” left your history.`);
  }

  function handleClearSaved() {
    if (items.length === 0) return;
    clearSavedKitchenLists();
    showSuccess("Saved cleared", "Manually saved items were removed.");
  }

  function handleClearHistory() {
    if (history.length === 0) return;
    clearKitchenHistory();
    showSuccess("Recent cleared", "Automatic history was removed.");
  }

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(149,213,178,0.4),transparent)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-3xl px-3 py-6 pb-16 sm:px-6 sm:py-12">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
            <MarketplaceBrandBadge />
            <Badge className="gap-1 bg-emerald-800/10 font-normal text-emerald-900">
              <BookMarked className="size-3.5" />
              My Kitchen
            </Badge>
            <Badge
              variant="outline"
              className="hidden font-normal text-muted-foreground sm:inline-flex"
            >
              This device
            </Badge>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-heading text-[1.75rem] font-semibold tracking-tight text-primary sm:text-4xl">
              My Kitchen
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Manually saved recipes &amp; lists, plus recent recipes Leafy
              remembers automatically.
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

        <div className="mt-4 flex gap-2.5 rounded-2xl border border-emerald-200/80 bg-white/95 p-3 shadow-sm sm:mt-5 sm:gap-3 sm:p-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-cream shadow-sm sm:size-10">
            <Leaf className="size-4 sm:size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800/70 sm:text-xs">
              Leafy says
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-foreground">
              <span className="font-medium">Saved</span> is what you pin.{" "}
              <span className="font-medium">Recent</span> is automatic history
              (last {MAX_KITCHEN_HISTORY}) — handy, but not the same as Save.
            </p>
          </div>
        </div>

        {/* Recent (automatic) */}
        <section className="mt-8" aria-labelledby="kitchen-recent-heading">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <History className="size-4 text-emerald-800" />
                <h2
                  id="kitchen-recent-heading"
                  className="font-heading text-lg font-semibold text-foreground sm:text-xl"
                >
                  Recent
                </h2>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                Automatic history · last {history.length || 0} used
              </p>
            </div>
            {history.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                className="h-10 shrink-0 gap-1.5 text-muted-foreground hover:text-destructive sm:h-9"
                onClick={handleClearHistory}
              >
                <Trash2 className="size-3.5" />
                Clear
              </Button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-border/80 bg-muted/20 px-3.5 py-8 text-center">
              <Clock className="mx-auto size-5 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Build a shopping list in Kitchen — it appears here automatically.
              </p>
            </div>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {history.map((item) => (
                <li
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-border/70 bg-white/95 shadow-sm"
                >
                  <div className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                    <div className="min-w-0">
                      <Badge
                        variant="outline"
                        className="gap-1 border-amber-300/80 bg-amber-50 text-[10px] font-medium text-amber-950"
                      >
                        <History className="size-3" />
                        Recent
                      </Badge>
                      <p className="font-heading mt-1.5 text-base font-semibold leading-snug text-foreground sm:text-lg">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {item.servings} serving{item.servings === 1 ? "" : "s"}
                        {item.ingredients.length > 0
                          ? ` · ${item.ingredients.length} ingredients`
                          : ""}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Used {formatKitchenHistoryDate(item.usedAt)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:shrink-0">
                      <Button
                        type="button"
                        className="h-11 gap-2 bg-emerald-800 text-cream hover:bg-emerald-900 sm:h-10"
                        onClick={() => handleOpenHistory(item)}
                      >
                        Open
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-11 gap-2 text-muted-foreground hover:text-destructive sm:h-10"
                        onClick={() =>
                          handleRemoveHistory(item.id, item.title)
                        }
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
        </section>

        {/* Saved (manual) */}
        <section className="mt-10" aria-labelledby="kitchen-saved-heading">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <BookMarked className="size-4 text-emerald-800" />
                <h2
                  id="kitchen-saved-heading"
                  className="font-heading text-lg font-semibold text-foreground sm:text-xl"
                >
                  Saved
                </h2>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                Manually saved with Save list / Save recipe &amp; list
              </p>
            </div>
            {items.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                className="h-10 shrink-0 gap-1.5 text-muted-foreground hover:text-destructive sm:h-9"
                onClick={handleClearSaved}
              >
                <Trash2 className="size-3.5" />
                Clear
              </Button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="mt-3 rounded-3xl border border-dashed border-emerald-300/80 bg-emerald-50/40 px-4 py-10 text-center shadow-xs sm:py-12">
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-white text-emerald-800 shadow-sm ring-1 ring-emerald-200/80">
                <ChefHat className="size-6" />
              </span>
              <p className="font-heading mt-4 text-lg font-semibold text-emerald-950">
                No saved items yet
              </p>
              <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                In Leafy Kitchen, tap{" "}
                <span className="font-medium text-foreground">Save list</span>{" "}
                or{" "}
                <span className="font-medium text-foreground">
                  Save recipe &amp; list
                </span>{" "}
                to pin something here.
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
            <ul className="mt-3 space-y-2.5 sm:space-y-3">
              {items.map((item) => {
                const kind = getSavedItemKind(item);
                return (
                  <li
                    key={item.id}
                    className="overflow-hidden rounded-2xl border border-border/70 bg-white/95 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <KindBadge kind={kind} />
                          <Badge className="bg-emerald-800/10 text-[10px] font-medium text-emerald-900 hover:bg-emerald-800/10">
                            Saved
                          </Badge>
                        </div>
                        <p className="font-heading mt-1.5 text-base font-semibold leading-snug text-foreground sm:text-lg">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {item.servings} serving
                          {item.servings === 1 ? "" : "s"}
                          {item.ingredients.length > 0
                            ? ` · ${item.ingredients.length} ingredient${item.ingredients.length === 1 ? "" : "s"}`
                            : ""}
                          {item.method ? " · includes method" : ""}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Saved {formatKitchenSavedDate(item.savedAt)}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:shrink-0">
                        <Button
                          type="button"
                          className={cn(
                            "h-11 gap-2 bg-emerald-800 text-cream hover:bg-emerald-900 sm:h-10"
                          )}
                          onClick={() => handleOpenSaved(item)}
                        >
                          {kind === "list" ? "Open list" : "Open recipe"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-11 gap-2 text-muted-foreground hover:text-destructive sm:h-10"
                          onClick={() =>
                            handleRemoveSaved(item.id, item.title)
                          }
                        >
                          <Trash2 className="size-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
