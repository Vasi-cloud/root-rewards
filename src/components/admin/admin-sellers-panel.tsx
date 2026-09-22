"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Eye,
  Leaf,
  Shield,
  ShoppingBag,
  Store,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSeller } from "@/contexts/seller-context";
import { listingTypeLabel } from "@/lib/listing-categories";
import { TRUST_CONFIG } from "@/lib/moderation";
import { readLeaValleyShopForAdmin } from "@/lib/lea-valley-admin";
import type {
  ProductApprovalStatus,
  SellerProduct,
  SellerProfile,
  SellerStatus,
  SellerTrustTier,
  SellerType,
} from "@/types";

export type SellersSubView = "shops" | "listings";

/** Keep Admin Sellers tables responsive — full counts stay in stat cards. */
const ADMIN_SELLERS_TABLE_CAP = 100;
/** Shop detail for one opened store — never a full-catalog merge. */
const SHOP_DETAIL_CAP = 20;
const DEMO_LEA_VALLEY_UID = "demo-lea-valley-cycle-hire";

function isAdminListingRow(product: { status?: string; listingType?: string }) {
  if (
    product.status === "pending" &&
    product.listingType === "rental"
  ) {
    return false;
  }
  return true;
}

function isDemoLeaValleyShop(shop: {
  uid: string;
  email?: string;
  products?: { id: string }[];
}) {
  if (shop.uid === DEMO_LEA_VALLEY_UID) return true;
  if (shop.email?.toLowerCase() === "hire@leavalleycycles.demo") return true;
  const products = shop.products ?? [];
  return (
    products.length > 0 &&
    products.every((product) => product.id.startsWith("demo-lv-pending"))
  );
}

function isLeaValleyCycleHireShop(shop: {
  shopName?: string;
  tradingName?: string;
}) {
  const folded = (value?: string) => value?.trim().toLowerCase() ?? "";
  return [shop.shopName, shop.tradingName].some((value) =>
    folded(value).includes("lea valley cycle hire")
  );
}

function isLeaValleyName(shop: {
  shopName?: string;
  tradingName?: string;
  slug?: string;
}) {
  return isLeaValleyCycleHireShop(shop);
}

function isLeaValleyApplication(shop: {
  uid: string;
  email?: string;
  shopName?: string;
  tradingName?: string;
  slug?: string;
  products?: { id: string }[];
}) {
  return isLeaValleyName(shop) && !isDemoLeaValleyShop(shop);
}

type LeaListingRow = { ownerUid: string; product: SellerProduct };

function collectLeaValleyListingRows(): {
  rows: LeaListingRow[];
  error: string | null;
} {
  const snapshot = readLeaValleyShopForAdmin();
  return {
    rows: snapshot.products.map((product) => ({
      ownerUid: snapshot.uid ?? "",
      product,
    })),
    error: snapshot.error,
  };
}

type AdminSellersPanelProps = {
  /** When Overview jumps here, land on shops (default). */
  initialSubView?: SellersSubView;
  /** Open this shop's detail, same as the Shops table View action. */
  initialShopUid?: string | null;
};

function legalTypeLabel(sellerType?: SellerType | null): string {
  if (sellerType === "individual") return "Self-employed";
  if (sellerType === "business") return "Company";
  return "—";
}

function sellerAccountBadge(status: SellerStatus) {
  switch (status) {
    case "approved":
      return { label: "Approved", className: "bg-emerald-100 text-emerald-800" };
    case "paused":
      return { label: "Paused", className: "bg-amber-100 text-amber-950" };
    case "rejected":
      return { label: "Rejected", className: "bg-destructive/10 text-destructive" };
    case "pending":
      return { label: "Pending", className: "bg-gold/25 text-primary" };
    case "none":
      return { label: "Canceled", className: "bg-muted text-muted-foreground" };
    default:
      return { label: status, className: "bg-muted text-muted-foreground" };
  }
}

function listingTypeBadgeClass(listingType?: string) {
  if (listingType === "service") return "bg-sky-100 text-sky-900";
  if (listingType === "rental") return "bg-violet-100 text-violet-950";
  return undefined;
}

function listingBadge(status: ProductApprovalStatus) {
  switch (status) {
    case "approved":
      return { label: "Approved", className: "bg-emerald-100 text-emerald-800" };
    case "rejected":
      return { label: "Rejected", className: "bg-destructive/10 text-destructive" };
    default:
      return { label: "Pending", className: "bg-gold/25 text-primary" };
  }
}

function trustBadge(tier?: SellerTrustTier) {
  switch (tier) {
    case "trusted":
      return { label: "Trusted", className: "bg-emerald-100 text-emerald-800" };
    case "standard":
      return { label: "Standard", className: "bg-primary/10 text-primary" };
    default:
      return { label: "New", className: "bg-muted text-muted-foreground" };
  }
}

function flagSeverityClass(severity: string) {
  if (severity === "high") return "bg-destructive/15 text-destructive";
  if (severity === "medium") return "bg-amber-100 text-amber-950";
  return "bg-muted text-muted-foreground";
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  return iso.slice(0, 10);
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <Card
      className={
        accent ? "border-emerald-200 bg-emerald-50/50" : "border-border/80"
      }
    >
      <CardHeader className="pb-2">
        <CardTitle
          className={`flex items-center gap-2 text-sm font-medium ${
            accent ? "text-emerald-700" : "text-muted-foreground"
          }`}
        >
          <Icon className="size-4" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`text-3xl font-semibold tabular-nums ${
            accent ? "text-emerald-800" : "text-primary"
          }`}
        >
          {value}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function ShopActions({
  shop,
  onApprove,
  onPause,
  onReject,
  onMarkTrusted,
  onClearTrust,
}: {
  shop: SellerProfile;
  onApprove: () => void;
  onPause: () => void;
  onReject: () => void;
  onMarkTrusted: () => void;
  onClearTrust: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {shop.status !== "approved" && shop.status !== "paused" && (
        <Button size="sm" className="gap-1" onClick={onApprove}>
          <Check className="size-3.5" />
          Approve
        </Button>
      )}
      {shop.status === "paused" && (
        <Button size="sm" className="gap-1" onClick={onApprove}>
          <Check className="size-3.5" />
          Resume
        </Button>
      )}
      {shop.status === "approved" && (
        <Button size="sm" variant="outline" onClick={onPause}>
          Pause
        </Button>
      )}
      {shop.status === "approved" && shop.trustOverride !== "trusted" && (
        <Button
          size="sm"
          variant="outline"
          className="gap-1"
          onClick={onMarkTrusted}
        >
          <Shield className="size-3.5" />
          Mark trusted
        </Button>
      )}
      {shop.trustOverride === "trusted" && (
        <Button size="sm" variant="ghost" onClick={onClearTrust}>
          Clear trust override
        </Button>
      )}
      {shop.status !== "rejected" && shop.status !== "none" && (
        <Button
          size="sm"
          variant="outline"
          className="gap-1 text-destructive"
          onClick={onReject}
        >
          <XCircle className="size-3.5" />
          Reject
        </Button>
      )}
    </div>
  );
}

export function AdminSellersPanel({
  initialSubView = "shops",
  initialShopUid = null,
}: AdminSellersPanelProps) {
  const {
    allSellers,
    seller,
    setSellerAccountStatus,
    setSellerTrustOverride,
    setProductApproval,
  } = useSeller();

  const [subView, setSubView] = useState<SellersSubView>(initialSubView);
  const [selectedShopUid, setSelectedShopUid] = useState<string | null>(
    initialShopUid
  );
  const [listingFilter, setListingFilter] = useState<
    "All" | ProductApprovalStatus
  >("pending");
  const [rejectingKey, setRejectingKey] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [leaListings, setLeaListings] = useState<{
    rows: LeaListingRow[];
    error: string | null;
    sig: string;
  } | null>(null);

  const visibleSellers = useMemo(() => {
    const hasApplication = allSellers.some((s) => isLeaValleyApplication(s));
    return allSellers.filter((s) => {
      if (!isDemoLeaValleyShop(s)) return true;
      return !hasApplication;
    });
  }, [allSellers]);

  const shopCounts = useMemo(() => {
    const total = visibleSellers.length;
    const pending = visibleSellers.filter((s) => s.status === "pending").length;
    const approved = visibleSellers.filter((s) => s.status === "approved").length;
    const paused = visibleSellers.filter((s) => s.status === "paused").length;
    return { total, pending, approved, paused };
  }, [visibleSellers]);

  const allListings = useMemo(
    () =>
      visibleSellers.flatMap((s) =>
        s.products
          .filter(isAdminListingRow)
          .map((product) => ({ seller: s, product }))
      ),
    [visibleSellers]
  );

  const pendingFromOpened = useMemo(() => {
    if (!leaListings) return [];
    return leaListings.rows
      .filter((row) => (row.product.status ?? "pending") === "pending")
      .slice(0, SHOP_DETAIL_CAP)
      .map((row) => ({
        seller:
          allSellers.find((s) => s.uid === row.ownerUid) ??
          ({
            uid: row.ownerUid,
            shopName: "Lea Valley Cycle Hire",
            email: "",
            products: [],
            status: "approved",
          } as unknown as SellerProfile),
        product: row.product,
      }));
  }, [leaListings, allSellers]);

  const pendingListings = pendingFromOpened;

  const liveListings = useMemo(
    () => allListings.filter((r) => r.product.status === "approved"),
    [allListings]
  );

  const filteredListings = useMemo(
    () =>
      allListings.filter(
        (row) =>
          listingFilter === "All" || row.product.status === listingFilter
      ),
    [allListings, listingFilter]
  );

  const tableListings = useMemo(
    () => filteredListings.slice(0, ADMIN_SELLERS_TABLE_CAP),
    [filteredListings]
  );

  const listingRows =
    listingFilter === "pending" ? pendingFromOpened : tableListings;

  const selectedShop = useMemo(() => {
    if (selectedShopUid == null) return null;
    return allSellers.find((s) => s.uid === selectedShopUid) ?? null;
  }, [selectedShopUid, allSellers]);

  const sortedShops = useMemo(() => {
    const rank = (s: SellerStatus) => {
      if (s === "pending") return 0;
      if (s === "approved") return 1;
      if (s === "paused") return 2;
      if (s === "rejected") return 3;
      return 4;
    };
    return [...visibleSellers].sort((a, b) => {
      const d = rank(a.status) - rank(b.status);
      if (d !== 0) return d;
      return a.shopName.localeCompare(b.shopName);
    });
  }, [visibleSellers]);

  const tableShops = useMemo(
    () => sortedShops.slice(0, ADMIN_SELLERS_TABLE_CAP),
    [sortedShops]
  );

  useEffect(() => {
    if (!selectedShop || !isLeaValleyCycleHireShop(selectedShop)) return;
    const { rows, error } = collectLeaValleyListingRows();
    const sig = rows
      .map((row) => `${row.ownerUid}:${row.product.id}:${row.product.status ?? "pending"}`)
      .join("|");
    setLeaListings((prev) =>
      prev && prev.sig === sig && prev.error === error
        ? prev
        : { rows, error, sig }
    );
  }, [selectedShop, seller]);

  if (selectedShop) {
    const badge = sellerAccountBadge(selectedShop.status);
    const openedLea = isLeaValleyCycleHireShop(selectedShop);
    const leaDetail = openedLea ? leaListings : null;
    const detailRows: LeaListingRow[] = openedLea
      ? (leaDetail?.rows ??
        selectedShop.products.slice(0, SHOP_DETAIL_CAP).map((product) => ({
          ownerUid: selectedShop.uid,
          product,
        })))
      : selectedShop.products
          .filter(isAdminListingRow)
          .slice(0, ADMIN_SELLERS_TABLE_CAP)
          .map((product) => ({
            ownerUid: selectedShop.uid,
            product,
          }));
    const approvedCount = detailRows.filter(
      (row) => row.product.status === "approved"
    ).length;
    const listingTotal = openedLea
      ? detailRows.length
      : selectedShop.products.length;
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Button
              type="button"
              variant="ghost"
              className="mb-2 h-9 gap-1.5 px-2"
              onClick={() => setSelectedShopUid(null)}
            >
              <ArrowLeft className="size-3.5" />
              Back to shops
            </Button>
            <h2 className="font-heading text-2xl font-semibold text-primary">
              {selectedShop.shopName}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Shop detail — status and listings for this store only.
            </p>
          </div>
          <ShopActions
            shop={selectedShop}
            onApprove={() =>
              setSellerAccountStatus(selectedShop.uid, "approved")
            }
            onPause={() => setSellerAccountStatus(selectedShop.uid, "paused")}
            onReject={() =>
              setSellerAccountStatus(selectedShop.uid, "rejected")
            }
            onMarkTrusted={() =>
              setSellerTrustOverride(selectedShop.uid, "trusted")
            }
            onClearTrust={() => setSellerTrustOverride(selectedShop.uid, null)}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/80">
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Legal type
              </p>
              <p className="mt-1 font-medium text-primary">
                {legalTypeLabel(selectedShop.sellerType)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/80">
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Contact email
              </p>
              <p className="mt-1 break-all font-medium text-primary">
                {selectedShop.email || "—"}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/80">
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Status
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge className={badge.className}>{badge.label}</Badge>
                <Badge className={trustBadge(selectedShop.trustTier).className}>
                  {trustBadge(selectedShop.trustTier).label}
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/80">
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Listings
              </p>
              <p className="mt-1 font-medium tabular-nums text-primary">
                {approvedCount} approved / {listingTotal} total
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-lg">Dates</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <p>
              <span className="text-muted-foreground">Applied: </span>
              {formatDate(selectedShop.appliedAt)}
            </p>
            <p>
              <span className="text-muted-foreground">Approved: </span>
              {formatDate(selectedShop.approvedAt)}
            </p>
            <p>
              <span className="text-muted-foreground">Paused: </span>
              {formatDate(selectedShop.pausedAt)}
            </p>
            <p>
              <span className="text-muted-foreground">Canceled: </span>
              {formatDate(selectedShop.canceledAt)}
            </p>
          </CardContent>
        </Card>

        {(selectedShop.sellerType === "individual" &&
          (selectedShop.tradingName ||
            selectedShop.servicesOffered ||
            selectedShop.professionalBackground)) ||
        (selectedShop.sellerType === "business" && selectedShop.companyName) ? (
          <Card className="border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-lg">Profile notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {selectedShop.sellerType === "individual" && (
                <>
                  {selectedShop.tradingName ? (
                    <p>
                      <span className="font-medium">Trading: </span>
                      {selectedShop.tradingName}
                    </p>
                  ) : null}
                  {selectedShop.servicesOffered ? (
                    <p>
                      <span className="font-medium">Offers: </span>
                      {selectedShop.servicesOffered}
                    </p>
                  ) : null}
                  {selectedShop.professionalBackground ? (
                    <p>
                      <span className="font-medium">Background: </span>
                      {selectedShop.professionalBackground}
                    </p>
                  ) : null}
                </>
              )}
              {selectedShop.sellerType === "business" &&
              selectedShop.companyName ? (
                <p>
                  <span className="font-medium">Company: </span>
                  {selectedShop.companyName}
                </p>
              ) : null}
              {selectedShop.bio ? (
                <p className="text-muted-foreground">{selectedShop.bio}</p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <Card className="overflow-hidden border-primary/20">
          <CardHeader className="border-b border-primary/10 bg-emerald-50/40">
            <CardTitle className="font-heading">
              Listings for this shop
            </CardTitle>
            <CardDescription>
              {isLeaValleyApplication(selectedShop)
                ? "Hire listings stored for this shop (same seller record as Seller Hub). Up to 20 rows."
                : `Product, hire, and service listings belonging to ${selectedShop.shopName}.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y p-0">
            {leaDetail?.error ? (
              <p className="px-6 py-3 text-sm text-destructive">
                {leaDetail.error}
              </p>
            ) : null}
            {isLeaValleyApplication(selectedShop) ? (
              <p className="px-6 py-2 text-xs text-muted-foreground">
                Notes: hire@leavalleycycles.demo is not a separate shop.
              </p>
            ) : null}
            {detailRows.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                No listings yet for this shop.
              </div>
            ) : (
              detailRows.map(({ product, ownerUid }) => {
                const lb = listingBadge(product.status ?? "pending");
                const key = `${ownerUid}-${product.id}`;
                const isRejecting = rejectingKey === key;
                return (
                  <div
                    key={key}
                    className={`space-y-3 px-5 py-4 ${
                      product.status === "pending" ? "bg-gold/10" : ""
                    }`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{product.name}</span>
                          <Badge className={lb.className}>{lb.label}</Badge>
                          <Badge
                            variant="secondary"
                            className={listingTypeBadgeClass(product.listingType)}
                          >
                            {listingTypeLabel(product.listingType)}
                          </Badge>
                          <Badge variant="outline">{product.category}</Badge>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          £{product.price.toFixed(2)} · {product.stock}{" "}
                          {product.listingType === "service"
                            ? "slots"
                            : product.listingType === "rental"
                              ? "units"
                              : "stock"}
                        </p>
                      </div>
                      {!isRejecting &&
                        (!openedLea ||
                          (product.status ?? "pending") === "pending") && (
                        <div className="flex shrink-0 flex-wrap gap-2">
                          {(product.status ?? "pending") === "pending" && (
                            <Button
                              size="sm"
                              className="gap-1"
                              onClick={() => {
                                setRejectingKey(null);
                                setProductApproval(
                                  ownerUid,
                                  product.id,
                                  "approved"
                                );
                              }}
                            >
                              <Check className="size-3.5" />
                              Approve
                            </Button>
                          )}
                          {(product.status ?? "pending") === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-destructive"
                              onClick={() => {
                                setRejectingKey(key);
                                setRejectNote(product.reviewNote ?? "");
                              }}
                            >
                              <XCircle className="size-3.5" />
                              Reject
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    {isRejecting && (
                      <div className="rounded-xl border border-destructive/20 bg-background p-3">
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                          Note for seller (optional)
                        </label>
                        <input
                          value={rejectNote}
                          onChange={(e) => setRejectNote(e.target.value)}
                          placeholder="e.g. Please clarify materials and eco score"
                          className="mb-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1"
                            onClick={() => {
                              setProductApproval(
                                ownerUid,
                                product.id,
                                "rejected",
                                rejectNote
                              );
                              setRejectingKey(null);
                              setRejectNote("");
                            }}
                          >
                            <XCircle className="size-3.5" />
                            Confirm reject
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setRejectingKey(null);
                              setRejectNote("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <p className="text-[11px] text-muted-foreground">
          Auto-approve at {TRUST_CONFIG.trustedMinApproved}+ approved listings
          &amp; low rejection rate
          {selectedShop.trustTier === "trusted" ? " · currently eligible" : ""}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-primary">
            Sellers
          </h2>
          <p className="mt-1 text-muted-foreground">
            Which stores are on the platform, legal type, and listing review.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["shops", "Shops", Store],
              ["listings", "Listings", ShoppingBag],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSubView(id)}
              className={`inline-flex h-10 items-center gap-1.5 rounded-lg px-3.5 text-sm font-medium transition-colors ${
                subView === id
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-foreground/70 ring-1 ring-border hover:text-primary"
              }`}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Store}
          label="Seller shops"
          value={String(shopCounts.total)}
          hint={`${shopCounts.pending} awaiting approval`}
        />
        <StatCard
          icon={ShoppingBag}
          label="Listings in review"
          value={String(pendingListings.length)}
          hint="Pending product approvals"
          accent
        />
        <StatCard
          icon={Check}
          label="Live listings"
          value={String(liveListings.length)}
          hint="Approved for marketplace"
        />
      </div>

      {subView === "shops" ? (
        <Card className="overflow-hidden border-primary/20">
          <CardHeader className="border-b border-primary/10 bg-emerald-50/50">
            <div className="flex items-center gap-2 text-primary">
              <Store className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">
                Stores on the platform
              </span>
            </div>
            <CardTitle className="font-heading">Shops</CardTitle>
            <CardDescription>
              Every seller shop — self-employed vs company, status, and
              listings. Counts above match this table ({shopCounts.total}{" "}
              shops).
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {sortedShops.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <Store className="mx-auto size-8 text-primary/40" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No seller shops yet. Sellers apply from the Seller Hub.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-border/80 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Shop name</th>
                      <th className="px-4 py-3 font-medium">Contact email</th>
                      <th className="px-4 py-3 font-medium">Legal type</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Listings</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {tableShops.map((s) => {
                      const badge = sellerAccountBadge(s.status);
                      const approved = s.products.filter(
                        (p) => p.status === "approved"
                      ).length;
                      return (
                        <tr
                          key={s.uid}
                          className={`cursor-pointer transition-colors hover:bg-emerald-50/40 ${
                            s.status === "pending" ? "bg-gold/10" : ""
                          }`}
                          onClick={() => setSelectedShopUid(s.uid)}
                        >
                          <td className="px-4 py-3 font-medium text-primary">
                            {s.shopName}
                          </td>
                          <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                            {s.email || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className={
                                s.sellerType === "individual"
                                  ? "border-sky-300 bg-sky-50 text-sky-900"
                                  : s.sellerType === "business"
                                    ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                                    : undefined
                              }
                            >
                              {legalTypeLabel(s.sellerType)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={badge.className}>
                              {badge.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 tabular-nums text-muted-foreground">
                            {approved} / {s.products.length}
                          </td>
                          <td
                            className="px-4 py-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex flex-wrap gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                                onClick={() => setSelectedShopUid(s.uid)}
                              >
                                <Eye className="size-3.5" />
                                View
                              </Button>
                              {s.status !== "approved" &&
                                s.status !== "paused" && (
                                  <Button
                                    size="sm"
                                    className="gap-1"
                                    onClick={() =>
                                      setSellerAccountStatus(s.uid, "approved")
                                    }
                                  >
                                    <Check className="size-3.5" />
                                    Approve
                                  </Button>
                                )}
                              {s.status === "paused" && (
                                <Button
                                  size="sm"
                                  className="gap-1"
                                  onClick={() =>
                                    setSellerAccountStatus(s.uid, "approved")
                                  }
                                >
                                  <Check className="size-3.5" />
                                  Resume
                                </Button>
                              )}
                              {s.status === "approved" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setSellerAccountStatus(s.uid, "paused")
                                  }
                                >
                                  Pause
                                </Button>
                              )}
                              {s.status !== "rejected" &&
                                s.status !== "none" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1 text-destructive"
                                    onClick={() =>
                                      setSellerAccountStatus(s.uid, "rejected")
                                    }
                                  >
                                    <XCircle className="size-3.5" />
                                    Reject
                                  </Button>
                                )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden border-primary/20">
          <CardHeader className="border-b border-primary/10 bg-emerald-50/40">
            <div className="flex items-center gap-2 text-primary">
              <ShoppingBag className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">
                Listing review
              </span>
            </div>
            <CardTitle className="font-heading">Seller listings</CardTitle>
            <CardDescription>
              Products, hire items, and services — approve or reject. Approved
              hire listings go live under Marketplace Rentals ({liveListings.length}{" "}
              live).
            </CardDescription>
            <div className="flex flex-wrap gap-2 pt-2">
              {(
                [
                  ["pending", "Pending"],
                  ["approved", "Approved"],
                  ["rejected", "Rejected"],
                  ["All", "All"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setListingFilter(value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    listingFilter === value
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-foreground/70 ring-1 ring-border hover:text-primary"
                  }`}
                >
                  {label}
                  {value !== "All" && (
                    <span className="ml-1 opacity-70">
                      (
                      {value === "pending"
                        ? pendingFromOpened.length
                        : allListings.filter((r) => r.product.status === value)
                            .length}
                      )
                    </span>
                  )}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="divide-y p-0">
            {listingRows.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <Leaf className="mx-auto size-8 text-primary/40" />
                <p className="mt-3 text-sm text-muted-foreground">
                  {listingFilter === "pending"
                    ? "No pending listings loaded. Open a shop to review its hires."
                    : "No listings in this filter."}
                </p>
              </div>
            ) : (
              listingRows.map(({ seller: s, product }) => {
                const badge = listingBadge(product.status ?? "pending");
                const key = `${s.uid}-${product.id}`;
                const isRejecting = rejectingKey === key;
                return (
                  <div
                    key={key}
                    className={`space-y-3 px-5 py-4 ${
                      product.status === "pending" ? "bg-gold/10" : ""
                    }`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{product.name}</span>
                          <Badge className={badge.className}>
                            {badge.label}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={listingTypeBadgeClass(product.listingType)}
                          >
                            {listingTypeLabel(product.listingType)}
                          </Badge>
                          <Badge variant="outline">{product.category}</Badge>
                          <Badge className="bg-emerald-100 text-emerald-800">
                            {product.ecoScore}% eco
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          <button
                            type="button"
                            className="font-medium text-primary underline-offset-2 hover:underline"
                            onClick={() => {
                              setSelectedShopUid(s.uid);
                              setSubView("shops");
                            }}
                          >
                            {s.shopName}
                          </button>{" "}
                          · £{product.price.toFixed(2)} · {product.stock}{" "}
                          {product.listingType === "service"
                            ? "slots"
                            : product.listingType === "rental"
                              ? "units"
                              : "stock"}
                        </p>
                        {product.subtitle ? (
                          <p className="mt-1 text-sm text-primary/80">
                            {product.subtitle}
                          </p>
                        ) : null}
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {product.description || "No description"}
                        </p>
                        {(product.flagHits?.length ?? 0) > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {product.flagHits!.map((hit) => (
                              <Badge
                                key={`${product.id}-${hit.ruleId}-${hit.message}`}
                                className={flagSeverityClass(hit.severity)}
                              >
                                {hit.ruleId}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {product.autoApproved && (
                          <p className="mt-1 text-xs text-emerald-700">
                            Auto-approved via trusted seller
                          </p>
                        )}
                      </div>
                      {!isRejecting && (
                        <div className="flex shrink-0 flex-wrap gap-2">
                          {product.status !== "approved" && (
                            <Button
                              size="sm"
                              className="gap-1"
                              onClick={() => {
                                setRejectingKey(null);
                                setProductApproval(
                                  s.uid,
                                  product.id,
                                  "approved"
                                );
                              }}
                            >
                              <Check className="size-3.5" />
                              Approve
                            </Button>
                          )}
                          {product.status !== "rejected" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-destructive"
                              onClick={() => {
                                setRejectingKey(key);
                                setRejectNote(product.reviewNote ?? "");
                              }}
                            >
                              <XCircle className="size-3.5" />
                              Reject
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    {isRejecting && (
                      <div className="rounded-xl border border-destructive/20 bg-background p-3">
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                          Note for seller (optional)
                        </label>
                        <input
                          value={rejectNote}
                          onChange={(e) => setRejectNote(e.target.value)}
                          placeholder="e.g. Please clarify materials and eco score"
                          className="mb-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1"
                            onClick={() => {
                              setProductApproval(
                                s.uid,
                                product.id,
                                "rejected",
                                rejectNote
                              );
                              setRejectingKey(null);
                              setRejectNote("");
                            }}
                          >
                            <XCircle className="size-3.5" />
                            Confirm reject
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setRejectingKey(null);
                              setRejectNote("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
