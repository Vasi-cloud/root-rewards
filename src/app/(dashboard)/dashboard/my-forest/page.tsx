"use client";

import {
  ArrowRight,
  BookMarked,
  ChefHat,
  Cog,
  History,
  Leaf,
  MapPin,
  Store,
  Trash2,
  Trees,
  Warehouse,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { LeafyHubLinks } from "@/components/layout/leafy-hub-links";
import { useAppToast } from "@/components/ui/app-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EcoEmptyPanel } from "@/components/ui/eco-empty-panel";
import {
  formatKitchenHistoryDate,
  loadKitchenHistory,
  removeKitchenHistoryItem,
  subscribeKitchenHistory,
  type KitchenHistoryItem,
} from "@/lib/leafy-kitchen-history";
import {
  formatKitchenSavedDate,
  getSavedItemKind,
  loadSavedKitchenLists,
  removeSavedKitchenList,
  savedKindLabel,
  subscribeSavedKitchenLists,
  type SavedKitchenList,
} from "@/lib/leafy-kitchen-saved";
import {
  formatGarageDate,
  loadGarageParts,
  removePartFromGarage,
  subscribeGarage,
  type GaragePartItem,
} from "@/lib/leafy-parts-garage";
import {
  getLocalFavourites,
  subscribeLocalFavourites,
  toggleLocalFavourite,
  type LocalFavourite,
} from "@/lib/local-favourites";
import { cn } from "@/lib/utils";

const PREVIEW_LIMIT = 5;

export default function MyForestPage() {
  const router = useRouter();
  const { showSuccess } = useAppToast();
  const [recipes, setRecipes] = useState<SavedKitchenList[]>([]);
  const [recentRecipes, setRecentRecipes] = useState<KitchenHistoryItem[]>([]);
  const [parts, setParts] = useState<GaragePartItem[]>([]);
  const [favourites, setFavourites] = useState<LocalFavourite[]>([]);
  const [ready, setReady] = useState(false);
  const [expandedPartId, setExpandedPartId] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      setRecipes(loadSavedKitchenLists());
      setRecentRecipes(loadKitchenHistory());
      setParts(loadGarageParts());
      setFavourites(getLocalFavourites());
      setReady(true);
    };
    refresh();
    const unsubs = [
      subscribeSavedKitchenLists(refresh),
      subscribeKitchenHistory(refresh),
      subscribeGarage(refresh),
      subscribeLocalFavourites(refresh),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const recipePreview = recipes.slice(0, PREVIEW_LIMIT);
  const historyPreview = recentRecipes.slice(0, PREVIEW_LIMIT);
  const partsPreview = parts.slice(0, PREVIEW_LIMIT);
  const favouritesPreview = favourites.slice(0, PREVIEW_LIMIT);
  const totalSaved =
    recipes.length + recentRecipes.length + parts.length + favourites.length;

  if (!ready) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-muted" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge className="gap-1 bg-emerald-800/10 font-normal text-emerald-900">
            <Trees className="size-3.5" />
            My Forest
          </Badge>
          <Badge variant="outline" className="text-muted-foreground">
            This device
          </Badge>
        </div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
          My Forest
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Saved recipes, parts, and favourite local places — your Forest Buddies®
          activity in one home.
        </p>
        {totalSaved > 0 && (
          <p className="mt-2 text-xs text-emerald-800/80">
            {totalSaved} saved item{totalSaved === 1 ? "" : "s"} on this device
          </p>
        )}
      </div>

        <LeafyHubLinks className="mt-1" dense />

      {/* Impact light link */}
      <Link
        href="/dashboard/impact"
        className="group flex items-center justify-between gap-3 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 via-cream to-white px-4 py-3.5 transition-colors hover:border-emerald-300 hover:bg-emerald-50/90"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-cream shadow-sm">
            <Leaf className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-950">
              Personal impact
            </p>
            <p className="text-xs text-muted-foreground">
              Trees, CO₂ estimates, and causes you’ve funded
            </p>
          </div>
        </div>
        <ArrowRight className="size-4 shrink-0 text-emerald-800 transition-transform group-hover:translate-x-0.5" />
      </Link>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recipes */}
        <Card className="border-emerald-200/70">
          <CardHeader className="flex flex-col gap-3 px-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
            <div className="min-w-0">
              <CardTitle className="font-heading flex items-center gap-2 text-lg text-emerald-950">
                <ChefHat className="size-5 text-emerald-800" />
                Kitchen recipes
              </CardTitle>
              <CardDescription>
                Saved lists and recent cooks from Leafy Kitchen.
              </CardDescription>
            </div>
            <Button
              nativeButton={false}
              render={<Link href="/kitchen/saved" />}
              variant="outline"
              size="sm"
              className="h-10 shrink-0 gap-1.5 sm:h-8"
            >
              <BookMarked className="size-3.5" />
              My Kitchen
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            {recipes.length === 0 && recentRecipes.length === 0 ? (
              <EcoEmptyPanel
                icon={ChefHat}
                title="No recipes saved yet"
                description="Plan a cook in Leafy Kitchen, then save a list or recipe to see it here."
                primaryAction={{
                  href: "/kitchen",
                  label: "Open Leafy Kitchen",
                }}
                secondaryAction={{
                  href: "/kitchen/saved",
                  label: "My Kitchen",
                }}
              />
            ) : (
              <>
                {recipePreview.length > 0 && (
                  <SectionList
                    label={`Saved (${recipes.length})`}
                    items={recipePreview.map((item) => ({
                      id: item.id,
                      title: item.title,
                      detail: `${savedKindLabel(getSavedItemKind(item))} · ${item.ingredients.length} ingredient${item.ingredients.length === 1 ? "" : "s"} · ${formatKitchenSavedDate(item.savedAt)}`,
                      onOpen: () =>
                        router.push(
                          `/kitchen?saved=${encodeURIComponent(item.id)}`
                        ),
                      onRemove: () => {
                        removeSavedKitchenList(item.id);
                        showSuccess(
                          "Removed",
                          `“${item.title}” left My Kitchen.`
                        );
                      },
                    }))}
                  />
                )}
                {historyPreview.length > 0 && (
                  <SectionList
                    label={`Recent (${recentRecipes.length})`}
                    icon={History}
                    items={historyPreview.map((item) => ({
                      id: item.id,
                      title: item.title,
                      detail: `${item.ingredients.length} ingredients · ${formatKitchenHistoryDate(item.usedAt)}`,
                      onOpen: () =>
                        router.push(
                          `/kitchen?history=${encodeURIComponent(item.id)}`
                        ),
                      onRemove: () => {
                        removeKitchenHistoryItem(item.id);
                        showSuccess(
                          "Removed from Recent",
                          `“${item.title}” left your history.`
                        );
                      },
                    }))}
                  />
                )}
                {(recipes.length > PREVIEW_LIMIT ||
                  recentRecipes.length > PREVIEW_LIMIT) && (
                  <Button
                    nativeButton={false}
                    render={<Link href="/kitchen/saved" />}
                    variant="ghost"
                    size="sm"
                    className="h-9 w-full gap-1.5 text-emerald-900"
                  >
                    View all in My Kitchen
                    <ArrowRight className="size-3.5" />
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Parts */}
        <Card className="border-emerald-200/70">
          <CardHeader className="flex flex-col gap-3 px-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
            <div className="min-w-0">
              <CardTitle className="font-heading flex items-center gap-2 text-lg text-emerald-950">
                <Wrench className="size-5 text-emerald-800" />
                Garage parts
              </CardTitle>
              <CardDescription>
                Parts saved from Leafy Parts Finder.
              </CardDescription>
            </div>
            <Button
              nativeButton={false}
              render={<Link href="/parts/garage" />}
              variant="outline"
              size="sm"
              className="h-10 shrink-0 gap-1.5 sm:h-8"
            >
              <Warehouse className="size-3.5" />
              My Garage
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 px-4 sm:px-6">
            {parts.length === 0 ? (
              <EcoEmptyPanel
                icon={Cog}
                title="No parts saved yet"
                description="Identify a part in Leafy Parts Finder, then save it to Garage for later."
                primaryAction={{
                  href: "/parts",
                  label: "Open Parts Finder",
                }}
                secondaryAction={{
                  href: "/parts/garage",
                  label: "My Garage",
                }}
              />
            ) : (
              <>
                <ul className="space-y-2">
                  {partsPreview.map((item) => {
                    const open = expandedPartId === item.id;
                    return (
                      <li
                        key={item.id}
                        className="overflow-hidden rounded-xl border border-border/70 bg-white/80"
                      >
                        <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">
                              {item.partName}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {item.vehicleLabel} · saved{" "}
                              {formatGarageDate(item.savedAt)}
                            </p>
                          </div>
                          <div className="flex gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 flex-1 sm:h-8 sm:flex-none"
                              onClick={() =>
                                setExpandedPartId(open ? null : item.id)
                              }
                            >
                              {open ? "Hide" : "Open"}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-9 gap-1 text-muted-foreground hover:text-destructive sm:h-8"
                              aria-label={`Remove ${item.partName}`}
                              onClick={() => {
                                removePartFromGarage(item.id);
                                if (expandedPartId === item.id) {
                                  setExpandedPartId(null);
                                }
                                showSuccess(
                                  "Removed from Garage",
                                  `${item.partName} is no longer saved.`
                                );
                              }}
                            >
                              <Trash2 className="size-3.5" />
                              <span className="sm:hidden">Remove</span>
                            </Button>
                          </div>
                        </div>
                        {open && (
                          <div className="space-y-1.5 border-t border-border/60 bg-muted/20 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                            <p className="text-foreground">{item.summary}</p>
                            <p className="font-mono text-emerald-900">
                              OEM {item.oemNumber}
                            </p>
                            <Button
                              nativeButton={false}
                              render={<Link href="/parts/garage" />}
                              variant="link"
                              size="sm"
                              className="h-auto px-0 text-emerald-900"
                            >
                              Open full Garage
                            </Button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {parts.length > PREVIEW_LIMIT && (
                  <Button
                    nativeButton={false}
                    render={<Link href="/parts/garage" />}
                    variant="ghost"
                    size="sm"
                    className="h-9 w-full gap-1.5 text-emerald-900"
                  >
                    View all in My Garage
                    <ArrowRight className="size-3.5" />
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Local favourites */}
        <Card className="border-emerald-200/70 lg:col-span-2">
          <CardHeader className="flex flex-col gap-3 px-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
            <div className="min-w-0">
              <CardTitle className="font-heading flex items-center gap-2 text-lg text-emerald-950">
                <MapPin className="size-5 text-emerald-800" />
                Favourite stores & makers
              </CardTitle>
              <CardDescription>
                Places you’ve hearted on Buy Local.
              </CardDescription>
            </div>
            <Button
              nativeButton={false}
              render={<Link href="/local#local-favourites" />}
              variant="outline"
              size="sm"
              className="h-10 shrink-0 gap-1.5 sm:h-8"
            >
              <Store className="size-3.5" />
              Buy Local
            </Button>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {favourites.length === 0 ? (
              <EcoEmptyPanel
                icon={MapPin}
                title="No favourites yet"
                description="Heart a store or maker on Buy Local so it shows up here for easy revisits."
                primaryAction={{
                  href: "/local",
                  label: "Check Buy Local",
                }}
              />
            ) : (
              <>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {favouritesPreview.map((fav) => (
                    <li
                      key={`${fav.kind}:${fav.id}`}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-white/80 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {fav.name}
                        </p>
                        <p className="text-xs capitalize text-muted-foreground">
                          {fav.kind}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          nativeButton={false}
                          render={
                            <Link href="/local#local-favourites" />
                          }
                          variant="outline"
                          size="sm"
                          className="h-9 sm:h-8"
                        >
                          Open
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-9 gap-1 text-muted-foreground hover:text-destructive sm:h-8"
                          aria-label={`Remove ${fav.name}`}
                          onClick={() => {
                            toggleLocalFavourite({
                              kind: fav.kind,
                              id: fav.id,
                              name: fav.name,
                            });
                            showSuccess(
                              "Removed from favourites",
                              fav.name
                            );
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
                {favourites.length > PREVIEW_LIMIT && (
                  <Button
                    nativeButton={false}
                    render={<Link href="/local#local-favourites" />}
                    variant="ghost"
                    size="sm"
                    className="mt-3 h-9 w-full gap-1.5 text-emerald-900"
                  >
                    View all favourites
                    <ArrowRight className="size-3.5" />
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          nativeButton={false}
          render={<Link href="/dashboard" />}
          variant="outline"
          className="h-11 sm:h-10"
        >
          Back to overview
        </Button>
        <Button
          nativeButton={false}
          render={<Link href="/dashboard/impact" />}
          variant="ghost"
          className="h-11 gap-1.5 sm:h-10"
        >
          <Leaf className="size-3.5" />
          Your impact
        </Button>
      </div>
    </div>
  );
}

function SectionList({
  label,
  icon: Icon,
  items,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  items: Array<{
    id: string;
    title: string;
    detail: string;
    onOpen: () => void;
    onRemove: () => void;
  }>;
}) {
  return (
    <div>
      <p
        className={cn(
          "mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-800/70"
        )}
      >
        {Icon ? <Icon className="size-3" /> : null}
        {label}
      </p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-2 rounded-xl border border-border/70 bg-white/80 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {item.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {item.detail}
              </p>
            </div>
            <div className="flex gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-11 flex-1 sm:h-9 sm:flex-none"
                onClick={item.onOpen}
              >
                Open
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-11 gap-1 text-muted-foreground hover:text-destructive sm:h-9"
                aria-label={`Remove ${item.title}`}
                onClick={item.onRemove}
              >
                <Trash2 className="size-3.5" />
                <span className="sm:hidden">Remove</span>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
