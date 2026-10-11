"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "@/contexts/auth-context";
import {
  deleteAdminCatalogProduct,
  saveSellerFirstPartyListing,
} from "@/lib/admin-catalog-products";
import { saveNewLeaValleyHireListing } from "@/lib/lea-valley-hire-listings";
import { isLeaValleySeller } from "@/lib/lea-valley-guest";
import {
  countOpenReportsForSeller,
  evaluateListing,
  recordFlagHits,
  resolveFlagsForProduct,
  resolveListingDecision,
} from "@/lib/moderation";
import {
  SELLERS_STORAGE_KEY,
  emptyAnalytics,
  emptyEarnings,
  emptyPayouts,
  emptySellerImpact,
  ensureDemoShops,
  loadAllSellers,
  normalizeSeller,
  saveAllSellers,
  slugifyShopName,
  setProductApproval as storageSetProductApproval,
  setSellerAccountStatus as storageSetSellerAccountStatus,
  setSellerTrustOverride as storageSetSellerTrustOverride,
  pauseSellerAccount as storagePauseSeller,
  resumeSellerAccount as storageResumeSeller,
  cancelSellerAccount as storageCancelSeller,
  uniqueShopSlug,
} from "@/lib/seller-storage";
import type {
  ProductApprovalStatus,
  SellerApplicationInput,
  SellerProduct,
  SellerProfile,
  SellerStatus,
  SellerTrustTier,
  SellerType,
} from "@/types";

interface SellerContextValue {
  seller: SellerProfile | null;
  loading: boolean;
  /** All seller profiles (for admin moderation) */
  allSellers: SellerProfile[];
  refreshSellers: () => void;
  applyAsSeller: (application: SellerApplicationInput) => void;
  updateSellerProfile: (fields: {
    shopName?: string;
    bio?: string;
    story?: string;
    sellerType?: SellerType;
    tradingName?: string;
    servicesOffered?: string;
    professionalBackground?: string;
    companyName?: string;
    location?: string;
  }) => void;
  pauseSeller: () => void;
  resumeSeller: () => void;
  cancelSeller: () => void;
  setSellerAccountStatus: (
    uid: string,
    status: Extract<
      SellerStatus,
      "approved" | "rejected" | "pending" | "paused" | "none"
    >
  ) => void;
  setSellerTrustOverride: (
    uid: string,
    trustOverride: SellerTrustTier | null
  ) => void;
  setProductApproval: (
    sellerUid: string,
    productId: string,
    status: ProductApprovalStatus,
    reviewNote?: string
  ) => void;
  addProduct: (product: Omit<SellerProduct, "id" | "createdAt">) => void;
  addProducts: (products: Omit<SellerProduct, "id" | "createdAt">[]) => number;
  updateProduct: (id: string, product: Omit<SellerProduct, "id" | "createdAt">) => void;
  deleteProduct: (id: string) => void;
  requestPayout: (amount?: number) => boolean;
}

const SellerContext = createContext<SellerContextValue | undefined>(undefined);

function publishHireListingTerms(product: {
  id: string;
  listingType?: string;
  hireTerms?: string;
}) {
  if (product.listingType !== "rental") return;
  void fetch("/api/hire-listing-terms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      listingId: product.id,
      terms: product.hireTerms?.trim() ?? "",
    }),
  }).catch(() => {});
}

function prepareProduct(
  seller: SellerProfile,
  product: Omit<SellerProduct, "id" | "createdAt">,
  id: string,
  options?: { keepApprovedHire?: boolean }
): SellerProduct {
  const hits = evaluateListing(product);
  const openReports = countOpenReportsForSeller(seller.uid);
  const decision = resolveListingDecision(seller, product, hits, openReports);
  const isHire = product.listingType === "rental";
  const status = isHire
    ? options?.keepApprovedHire
      ? "approved"
      : "pending"
    : decision.status;
  const autoApproved = isHire ? false : decision.autoApproved;

  recordFlagHits({
    hits,
    productId: id,
    productName: product.name,
    sellerUid: seller.uid,
    shopName: seller.shopName,
    source: "rule",
  });

  return {
    ...product,
    subtitle: product.subtitle ?? "",
    tags: product.tags ?? [],
    status,
    autoApproved,
    reviewNote: isHire ? undefined : decision.reviewNote,
    reviewedAt: autoApproved ? new Date().toISOString() : undefined,
    flagHits: hits,
    views: product.views ?? 0,
    sales: product.sales ?? 0,
    id,
    createdAt: new Date().toISOString(),
  };
}

const STUDIO_ACCOUNT = "paarolimited@gmail.com";
const STUDIO_NAME = "forest buddies studio";

function shopNameKey(name?: string) {
  return (name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isStudioAccount(email?: string | null) {
  return (email ?? "").trim().toLowerCase() === STUDIO_ACCOUNT;
}

function isStudioRecord(shop: SellerProfile, key: string) {
  if (key.startsWith("demo-") || (shop.uid ?? "").startsWith("demo-")) return false;
  return (
    shopNameKey(shop.shopName) === STUDIO_NAME ||
    shopNameKey(shop.companyName) === STUDIO_NAME ||
    key === "forest-buddies-studio" ||
    shop.slug === "forest-buddies-studio"
  );
}

function isApprovedTwin(mine: SellerProfile, shop: SellerProfile): boolean {
  const shopUid = shop.uid ?? "";
  if (!shopUid || shopUid === mine.uid || shopUid.startsWith("demo-")) return false;
  if (shop.status !== "approved") return false;
  const name = shopNameKey(mine.shopName);
  const company = shopNameKey(mine.companyName);
  const otherName = shopNameKey(shop.shopName);
  const otherCompany = shopNameKey(shop.companyName);
  if (name && (otherName === name || otherCompany === name)) return true;
  if (company && (otherName === company || otherCompany === company)) return true;
  const slug = mine.slug || slugifyShopName(mine.shopName);
  if (shop.slug === slug || shopUid === slug) return true;
  return (
    shopUid === "forest-buddies-studio" &&
    (slugifyShopName(mine.shopName) === "forest-buddies-studio" ||
      slug.startsWith("forest-buddies-studio") ||
      slugifyShopName(mine.companyName ?? "") === "forest-buddies-studio")
  );
}

/** Pending profile plus the Approved row Admin already stored for this shop. */
export function sellerReadingApprovedShop(
  mine: SellerProfile | null,
  shops: SellerProfile[]
): SellerProfile | null {
  if (!mine || mine.status !== "pending") return mine;
  const approved = shops.find((shop) => isApprovedTwin(mine, shop));
  if (!approved) return mine;
  return {
    ...mine,
    status: "approved",
    approvedAt: approved.approvedAt,
  };
}

/**
 * The signed-in account has no profile, so /seller shows the application form.
 * Admin already has one Approved Forest Buddies Studio shop. Use that shop.
 */
export function sellerForSignedInAccount(
  mine: SellerProfile | null,
  shops: SellerProfile[],
  email?: string | null,
  uid?: string | null
): SellerProfile | null {
  const read = sellerReadingApprovedShop(mine, shops);
  if (!isStudioAccount(email) || !uid) {
    if (read && isStudioRecord(read, read.uid)) return null;
    return read;
  }
  if (
    read &&
    read.status !== "none" &&
    read.status !== "pending" &&
    !isStudioRecord(read, read.uid)
  ) {
    return read;
  }
  const studio = shops.find(
    (shop) => shop.status === "approved" && isStudioRecord(shop, shop.uid)
  );
  if (!studio) return read;
  return {
    ...studio,
    uid,
    email: STUDIO_ACCOUNT,
    status: "approved",
    sellerType: studio.sellerType ?? "business",
    companyName: studio.companyName || studio.shopName,
  };
}

/** Write the company email on the existing Approved studio row. */
function stampStudioEmail(all: Record<string, SellerProfile>): boolean {
  let changed = false;
  const studioKeys = Object.keys(all).filter(
    (key) => all[key].status === "approved" && isStudioRecord(all[key], key)
  );
  if (studioKeys.length > 1 && all["forest-buddies-studio"]) {
    const keeper = studioKeys.find((key) => key !== "forest-buddies-studio");
    if (keeper) {
      delete all["forest-buddies-studio"];
      changed = true;
    }
  }
  for (const key of Object.keys(all)) {
    const shop = all[key];
    if (shop.status !== "approved" || !isStudioRecord(shop, key)) continue;
    if ((shop.email ?? "").trim().toLowerCase() === STUDIO_ACCOUNT) continue;
    all[key] = { ...shop, email: STUDIO_ACCOUNT };
    changed = true;
  }
  return changed;
}

/** The admin account must not keep this shop. Park the same row off that uid. */
function releaseStudioFromAdmin(
  all: Record<string, SellerProfile>,
  uid: string,
  email: string
): boolean {
  if (email.trim().toLowerCase() !== "cvasi.crisan@gmail.com") return false;
  const mine = all[uid];
  if (!mine || !isStudioRecord(mine, uid)) return false;
  const parked = all["forest-buddies-studio"];
  all["forest-buddies-studio"] = {
    ...(parked ?? mine),
    ...mine,
    uid: "forest-buddies-studio",
    email: STUDIO_ACCOUNT,
    status: "approved",
    sellerType: mine.sellerType ?? parked?.sellerType ?? "business",
    companyName: mine.companyName || parked?.companyName || mine.shopName,
    products: mine.products?.length ? mine.products : parked?.products ?? [],
  };
  delete all[uid];
  return true;
}

/** Move the existing Approved studio onto this account. Does not add a shop. */
function linkStudioShop(
  all: Record<string, SellerProfile>,
  uid: string,
  email: string
): boolean {
  if (!isStudioAccount(email)) return false;
  const mine = all[uid];
  if (
    mine &&
    mine.status !== "none" &&
    !isStudioRecord(mine, uid)
  ) {
    return false;
  }
  const extraKey = Object.keys(all).find(
    (key) =>
      key !== uid &&
      all[key].status === "approved" &&
      isStudioRecord(all[key], key)
  );
  const source =
    (extraKey ? all[extraKey] : null) ??
    (mine && mine.status === "approved" && isStudioRecord(mine, uid) ? mine : null);
  if (!source) return false;
  const emailSet = (mine?.email ?? "").trim().toLowerCase() === STUDIO_ACCOUNT;
  if (!extraKey && emailSet && mine?.status === "approved" && mine.uid === uid) {
    return false;
  }
  all[uid] = {
    ...source,
    uid,
    email: STUDIO_ACCOUNT,
    status: "approved",
    sellerType: source.sellerType ?? "business",
    companyName: source.companyName || source.shopName,
  };
  if (extraKey && extraKey !== uid) delete all[extraKey];
  if (uid !== "forest-buddies-studio") delete all["forest-buddies-studio"];
  return true;
}

/**
 * The seller page reads only the signed-in profile. Admin approval of this
 * application was stored on a separate row. Copy that approval onto the
 * existing profile and drop the extra row. Other shops stay as stored.
 */
function adoptApprovedShop(
  all: Record<string, SellerProfile>,
  uid: string,
  email?: string | null
): boolean {
  const mine = all[uid];
  if (!mine || mine.status !== "pending") return false;
  const extraKey = Object.keys(all).find(
    (key) => key !== uid && isApprovedTwin(mine, { ...all[key], uid: all[key].uid || key })
  );
  if (!extraKey) return false;
  if (isStudioRecord(all[extraKey], extraKey) && !isStudioAccount(email)) return false;
  all[uid] = {
    ...mine,
    status: "approved",
    approvedAt: all[extraKey].approvedAt || new Date().toISOString(),
  };
  if (extraKey === "forest-buddies-studio") delete all[extraKey];
  return true;
}

export function SellerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [allSellers, setAllSellers] = useState<SellerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshSellers = useCallback(() => {
    ensureDemoShops();
    const all = loadAllSellers();
    let changed = false;
    if (user && adoptApprovedShop(all, user.uid, user.email)) changed = true;
    if (user?.email && releaseStudioFromAdmin(all, user.uid, user.email)) changed = true;
    if (stampStudioEmail(all)) changed = true;
    if (user?.email && linkStudioShop(all, user.uid, user.email)) changed = true;
    if (changed) saveAllSellers(all);
    const list = Object.values(all).map(normalizeSeller);
    setAllSellers(list);
    if (user) {
      const mine = all[user.uid] ? normalizeSeller(all[user.uid]) : null;
      setSeller(sellerForSignedInAccount(mine, list, user.email, user.uid));
    }
  }, [user]);

  useEffect(() => {
    // Soft-launch demos + any approved shops — seed even when logged out so
    // /marketplace and /shop match Admin Sellers on the same device.
    ensureDemoShops();
    refreshSellers();
    setLoading(false);
    if (!user) {
      setSeller(null);
    }
  }, [user, refreshSellers]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key !== SELLERS_STORAGE_KEY) return;
      refreshSellers();
    };
    const onCustom = () => refreshSellers();
    window.addEventListener("storage", onStorage);
    window.addEventListener("forest-buddies-sellers-updated", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("forest-buddies-sellers-updated", onCustom);
    };
  }, [refreshSellers]);

  const persistCurrent = useCallback(
    (next: SellerProfile | null) => {
      if (!user) return;
      const all = loadAllSellers();
      if (next) {
        all[user.uid] = next;
      } else {
        delete all[user.uid];
      }
      saveAllSellers(all);
      setSeller(next);
      setAllSellers(Object.values(all).map(normalizeSeller));
    },
    [user]
  );

  const applyAsSeller = useCallback(
    (application: SellerApplicationInput) => {
      if (!user) return;
      const all = loadAllSellers();
      const existing = all[user.uid];
      const sellerType = application.sellerType;
      const tradingName = application.tradingName?.trim() || undefined;
      const companyName = application.companyName?.trim() || undefined;
      const shopName =
        application.shopName.trim() ||
        tradingName ||
        companyName ||
        "My Forest Shop";

      const profile: SellerProfile = {
        uid: user.uid,
        email: user.email ?? "",
        shopName,
        slug: uniqueShopSlug(shopName, all, user.uid),
        sellerType,
        bio: application.bio.trim(),
        story: (application.story ?? "").trim(),
        location: application.location?.trim() || undefined,
        tradingName: sellerType === "individual" ? tradingName || shopName : undefined,
        servicesOffered:
          sellerType === "individual"
            ? application.servicesOffered?.trim() || undefined
            : application.servicesOffered?.trim() || undefined,
        professionalBackground:
          sellerType === "individual"
            ? application.professionalBackground?.trim() || undefined
            : undefined,
        companyName:
          sellerType === "business" ? companyName || shopName : undefined,
        impact: existing?.impact?.length
          ? existing.impact
          : emptySellerImpact(),
        status: "pending" as SellerStatus,
        appliedAt: new Date().toISOString(),
        approvedAt: undefined,
        pausedAt: undefined,
        canceledAt: undefined,
        products: existing?.products ?? [],
        earnings:
          existing?.products?.length
            ? existing.earnings
            : emptyEarnings(),
        analytics:
          existing?.products?.length
            ? existing.analytics
            : emptyAnalytics(),
        payouts:
          existing?.products?.length
            ? existing.payouts
            : emptyPayouts(),
        payoutMethod: existing?.payoutMethod,
        trustOverride: existing?.trustOverride,
        coverImageUrl: existing?.coverImageUrl,
        founderNote: existing?.founderNote,
        impactStory: existing?.impactStory,
      };
      persistCurrent(profile);
      void fetch("/api/shop-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: profile.slug,
          shopName: profile.shopName,
          sellerType: profile.sellerType ?? "business",
          companyName: profile.companyName ?? profile.shopName,
          servicesOffered: profile.servicesOffered ?? "",
          email: profile.email,
          appliedAt: profile.appliedAt,
        }),
      }).catch((err) => {
        console.warn("[seller] Shop application was not saved", err);
      });
    },
    [user, persistCurrent]
  );

  const updateSellerProfile = useCallback(
    (fields: {
      shopName?: string;
      bio?: string;
      story?: string;
      sellerType?: SellerType;
      tradingName?: string;
      servicesOffered?: string;
      professionalBackground?: string;
      companyName?: string;
      location?: string;
    }) => {
      if (!seller || !user) return;
      const all = loadAllSellers();
      const nextName = fields.shopName?.trim() ?? seller.shopName;
      persistCurrent({
        ...seller,
        shopName: nextName,
        slug:
          nextName !== seller.shopName
            ? uniqueShopSlug(nextName, all, user.uid)
            : seller.slug || uniqueShopSlug(nextName, all, user.uid),
        bio: fields.bio !== undefined ? fields.bio.trim() : seller.bio,
        story: fields.story !== undefined ? fields.story.trim() : seller.story,
        sellerType:
          fields.sellerType !== undefined
            ? fields.sellerType
            : seller.sellerType,
        tradingName:
          fields.tradingName !== undefined
            ? fields.tradingName.trim() || undefined
            : seller.tradingName,
        servicesOffered:
          fields.servicesOffered !== undefined
            ? fields.servicesOffered.trim() || undefined
            : seller.servicesOffered,
        professionalBackground:
          fields.professionalBackground !== undefined
            ? fields.professionalBackground.trim() || undefined
            : seller.professionalBackground,
        companyName:
          fields.companyName !== undefined
            ? fields.companyName.trim() || undefined
            : seller.companyName,
        location:
          fields.location !== undefined
            ? fields.location.trim() || undefined
            : seller.location,
      });
    },
    [seller, user, persistCurrent]
  );

  const pauseSeller = useCallback(() => {
    if (!user) return;
    storagePauseSeller(user.uid);
    refreshSellers();
  }, [user, refreshSellers]);

  const resumeSeller = useCallback(() => {
    if (!user) return;
    storageResumeSeller(user.uid);
    refreshSellers();
  }, [user, refreshSellers]);

  const cancelSeller = useCallback(() => {
    if (!user) return;
    storageCancelSeller(user.uid);
    refreshSellers();
  }, [user, refreshSellers]);

  const setSellerAccountStatus = useCallback(
    (
      uid: string,
      status: Extract<
        SellerStatus,
        "approved" | "rejected" | "pending" | "paused" | "none"
      >
    ) => {
      storageSetSellerAccountStatus(uid, status);
      refreshSellers();
    },
    [refreshSellers]
  );

  const setSellerTrustOverride = useCallback(
    (uid: string, trustOverride: SellerTrustTier | null) => {
      storageSetSellerTrustOverride(uid, trustOverride);
      refreshSellers();
    },
    [refreshSellers]
  );

  const setProductApproval = useCallback(
    (
      sellerUid: string,
      productId: string,
      status: ProductApprovalStatus,
      reviewNote?: string
    ) => {
      storageSetProductApproval(sellerUid, productId, status, reviewNote);
      if (status === "approved" || status === "rejected") {
        resolveFlagsForProduct(productId, "resolved");
      }
      refreshSellers();
      const all = loadAllSellers();
      const profile = all[sellerUid];
      const product = profile?.products.find((p) => p.id === productId);
      if (status === "approved" && product && profile) {
        void saveSellerFirstPartyListing(sellerUid, product).catch((err) => {
          console.warn("[seller] Approval marketplace sync failed", err);
        });
      }
      if (status === "rejected") {
        void deleteAdminCatalogProduct(productId, {}).catch((err) => {
          console.warn("[seller] Rejection marketplace sync failed", err);
        });
      }
    },
    [refreshSellers]
  );

  const addProduct = useCallback(
    (product: Omit<SellerProduct, "id" | "createdAt">) => {
      let current = sellerForSignedInAccount(
        seller,
        allSellers,
        user?.email,
        user?.uid
      );
      if (user?.email && current?.status === "approved" && seller?.status !== "approved") {
        const all = loadAllSellers();
        const linked =
          adoptApprovedShop(all, user.uid) || linkStudioShop(all, user.uid, user.email);
        if (linked) saveAllSellers(all);
        if (all[user.uid]?.status === "approved") {
          current = normalizeSeller(all[user.uid]);
        }
      }
      if (!current || current.status !== "approved") return;
      const prepared = prepareProduct(current, product, `sp-${Date.now()}`);
      const next =
        prepared.listingType === "rental"
          ? {
              ...prepared,
              listingType: "rental" as const,
              status: "pending" as const,
              autoApproved: false,
              reviewedAt: undefined,
            }
          : prepared;
      persistCurrent({
        ...current,
        products: [next, ...current.products],
      });
      if (next.listingType === "rental" && isLeaValleySeller(current)) {
        void saveNewLeaValleyHireListing(next).catch((err) => {
          console.warn("[seller] Hire listing was not saved", err);
        });
      }
      publishHireListingTerms(next);
      void saveSellerFirstPartyListing(current.uid, next).catch((err) => {
        console.warn("[seller] Marketplace sync failed", err);
      });
    },
    [seller, allSellers, user, persistCurrent]
  );

  const addProducts = useCallback(
    (products: Omit<SellerProduct, "id" | "createdAt">[]) => {
      if (!seller || seller.status !== "approved" || products.length === 0) {
        return 0;
      }
      const now = Date.now();
      const nextItems = products.map((product, index) =>
        prepareProduct(seller, product, `sp-${now}-${index}`)
      );
      persistCurrent({
        ...seller,
        products: [...nextItems, ...seller.products],
      });
      for (const item of nextItems) {
        void saveSellerFirstPartyListing(seller.uid, item).catch((err) => {
          console.warn("[seller] Marketplace sync failed", err);
        });
      }
      return nextItems.length;
    },
    [seller, persistCurrent]
  );

  const updateProduct = useCallback(
    (id: string, product: Omit<SellerProduct, "id" | "createdAt">) => {
      if (!seller) return;
      const existing = seller.products.find((p) => p.id === id);
      const prepared = prepareProduct(seller, product, id, {
        keepApprovedHire:
          existing?.listingType === "rental" && existing.status === "approved",
      });
      const nextProduct = {
        ...prepared,
        id,
        createdAt:
          seller.products.find((p) => p.id === id)?.createdAt ??
          prepared.createdAt,
        views: seller.products.find((p) => p.id === id)?.views ?? 0,
        sales: seller.products.find((p) => p.id === id)?.sales ?? 0,
      };
      persistCurrent({
        ...seller,
        products: seller.products.map((p) =>
          p.id === id ? nextProduct : p
        ),
      });
      publishHireListingTerms(nextProduct);
      void saveSellerFirstPartyListing(seller.uid, nextProduct).catch((err) => {
        console.warn("[seller] Marketplace sync failed", err);
      });
    },
    [seller, persistCurrent]
  );

  const deleteProduct = useCallback(
    (id: string) => {
      if (!seller) return;
      persistCurrent({
        ...seller,
        products: seller.products.filter((p) => p.id !== id),
      });
      publishHireListingTerms({ id, listingType: "rental", hireTerms: "" });
      void deleteAdminCatalogProduct(id, {}).catch((err) => {
        console.warn("[seller] Marketplace delete sync failed", err);
      });
    },
    [seller, persistCurrent]
  );

  const requestPayout = useCallback(
    (amount?: number) => {
      if (!seller || seller.status !== "approved") return false;
      const available = seller.earnings.available ?? 0;
      const requestAmount = Math.min(amount ?? available, available);
      if (requestAmount < 10) return false;

      const scheduled = new Date();
      scheduled.setDate(scheduled.getDate() + 3);

      const payout = {
        id: `po-${Date.now()}`,
        amount: Number(requestAmount.toFixed(2)),
        status: "processing" as const,
        method: seller.payoutMethod ?? "Bank transfer",
        scheduledFor: scheduled.toISOString().slice(0, 10),
      };

      persistCurrent({
        ...seller,
        earnings: {
          ...seller.earnings,
          available: Number((available - requestAmount).toFixed(2)),
          pending: Number(
            (seller.earnings.pending + requestAmount).toFixed(2)
          ),
        },
        payouts: [
          payout,
          ...seller.payouts.filter((p) => p.id !== "po-next"),
        ],
      });
      return true;
    },
    [seller, persistCurrent]
  );

  const value = useMemo(
    () => ({
      seller,
      loading,
      allSellers,
      refreshSellers,
      applyAsSeller,
      updateSellerProfile,
      pauseSeller,
      resumeSeller,
      cancelSeller,
      setSellerAccountStatus,
      setSellerTrustOverride,
      setProductApproval,
      addProduct,
      addProducts,
      updateProduct,
      deleteProduct,
      requestPayout,
    }),
    [
      seller,
      loading,
      allSellers,
      refreshSellers,
      applyAsSeller,
      updateSellerProfile,
      pauseSeller,
      resumeSeller,
      cancelSeller,
      setSellerAccountStatus,
      setSellerTrustOverride,
      setProductApproval,
      addProduct,
      addProducts,
      updateProduct,
      deleteProduct,
      requestPayout,
    ]
  );

  return (
    <SellerContext.Provider value={value}>{children}</SellerContext.Provider>
  );
}

export function useSeller() {
  const context = useContext(SellerContext);
  if (!context) {
    throw new Error("useSeller must be used within a SellerProvider");
  }
  return context;
}
